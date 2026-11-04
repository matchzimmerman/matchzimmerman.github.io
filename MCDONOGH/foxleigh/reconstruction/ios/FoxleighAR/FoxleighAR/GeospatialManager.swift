//
// GeospatialManager.swift — Foxleigh AR
//
// Adapted from Google's ARCore GeospatialExample (Apache License 2.0,
// https://github.com/google-ar/arcore-ios-sdk). Changes by MZ.Claude for MZ.Human, 2026-11-04:
// a single terrain anchor at the Foxleigh site, a VPS coverage check at the site, an in-app API key,
// and persistent fine-tune offsets.
//

import ARCoreGARSession
import ARCoreGeospatial
import ARKit
import CoreLocation
import Foundation
import RealityKit
import simd

final class GeospatialManager: NSObject, ObservableObject, CLLocationManagerDelegate {

  private enum Keys {
    static let apiKey = "arcore_api_key"
    static let privacy = "privacy_notice_acknowledged"
    static let east = "nudge_east_m", north = "nudge_north_m", up = "nudge_up_m", yaw = "nudge_yaw_deg"
  }

  /// Accuracy needed before the house is placed automatically. VPS typically gives < 1 m and < 2°.
  private enum Threshold {
    static let placeHorizontal: CLLocationAccuracy = 3
    static let placeYaw: CLLocationDirectionAccuracy = 5
    static let hideHorizontal: CLLocationAccuracy = 15
    static let hideYaw: CLLocationDirectionAccuracy = 25
  }

  // MARK: published UI state
  @Published var apiKey = UserDefaults.standard.string(forKey: Keys.apiKey) ?? ""
  @Published var showKeyEntry = (UserDefaults.standard.string(forKey: Keys.apiKey) ?? "").isEmpty
  @Published var showPrivacyNotice = !UserDefaults.standard.bool(forKey: Keys.privacy)
  @Published var vpsAtSite = "VPS at Foxleigh: checking…"
  @Published var vpsAvailable: Bool? = nil
  @Published var status = "Starting…"
  @Published var accuracy = ""
  @Published var distanceToPlaque = ""
  @Published var placed = false
  @Published var canPlaceAnyway = false
  @Published var opacity: Float = 0.92

  // Fine-tune offsets (persisted): metres east / north / up, degrees of extra yaw.
  @Published var nudgeEast = UserDefaults.standard.double(forKey: Keys.east) { didSet { save() } }
  @Published var nudgeNorth = UserDefaults.standard.double(forKey: Keys.north) { didSet { save() } }
  @Published var nudgeUp = UserDefaults.standard.double(forKey: Keys.up) { didSet { save() } }
  @Published var nudgeYaw = UserDefaults.standard.double(forKey: Keys.yaw) { didSet { save() } }

  let arView = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
  private var locationManager: CLLocationManager?
  private(set) var garSession: GARSession?
  private var future: GARFuture?
  private(set) var anchor: GARAnchor?
  private var started = false
  private var waitingSince: Date?
  /// Last good geospatial accuracy, used to hide the house if tracking degrades badly.
  private(set) var trackingGood = false

  override init() {
    super.init()
    if !showPrivacyNotice && !showKeyEntry { start() }
  }

  // MARK: setup
  func acceptPrivacyNotice() {
    UserDefaults.standard.set(true, forKey: Keys.privacy)
    showPrivacyNotice = false
    if !showKeyEntry { start() }
  }

  func saveKey(_ key: String) {
    let k = key.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !k.isEmpty else { return }
    UserDefaults.standard.set(k, forKey: Keys.apiKey)
    apiKey = k
    showKeyEntry = false
    garSession = nil
    if !showPrivacyNotice { started = false; start() }
  }

  private func start() {
    guard !started else { return }
    started = true
    let configuration = ARWorldTrackingConfiguration()
    configuration.worldAlignment = .gravity
    configuration.planeDetection = .horizontal
    configuration.environmentTexturing = .automatic
    arView.session.run(configuration)
    let lm = CLLocationManager()
    lm.delegate = self
    lm.desiredAccuracy = kCLLocationAccuracyBest
    locationManager = lm
    status = "Allow location (precise) so Google can localise you."
  }

  private func setupGARSession() {
    guard garSession == nil else { return }
    do {
      let session = try GARSession(apiKey: apiKey, bundleIdentifier: nil)
      guard session.isGeospatialModeSupported(.enabled) else {
        status = "This iPhone doesn't support the Geospatial API."
        return
      }
      let configuration = GARSessionConfiguration()
      configuration.geospatialMode = .enabled
      var error: NSError?
      session.setConfiguration(configuration, error: &error)
      if let error { status = "Could not configure ARCore (\(error.code))."; return }
      garSession = session
      waitingSince = Date()
      checkVPSAtSite()
    } catch let error as NSError {
      status = "Could not start ARCore (\(error.code)). Check the API key."
    }
  }

  /// Ask Google whether its Visual Positioning Service covers the memorial. Works from anywhere.
  func checkVPSAtSite() {
    guard let garSession else { return }
    vpsAtSite = "VPS at Foxleigh: checking…"
    garSession.checkVPSAvailability(coordinate: FoxleighSite.memorial) { [weak self] availability in
      DispatchQueue.main.async {
        guard let self else { return }
        switch availability {
        case .available:
          self.vpsAvailable = true
          self.vpsAtSite = "VPS at Foxleigh: AVAILABLE — sub-metre anchoring expected"
        case .unavailable:
          self.vpsAvailable = false
          self.vpsAtSite = "VPS at Foxleigh: not available — GPS + compass only (±5–10 m)"
        case .errorNotAuthorized:
          self.vpsAvailable = nil
          self.vpsAtSite = "VPS check: API key not authorised (check ARCore API + bundle ID)"
        case .errorNetworkConnection:
          self.vpsAvailable = nil
          self.vpsAtSite = "VPS check: no network"
        default:
          self.vpsAvailable = nil
          self.vpsAtSite = "VPS check failed (\(availability.rawValue))"
        }
      }
    }
  }

  // MARK: per-frame
  func update(_ frame: ARFrame) -> GARFrame? {
    guard let garSession, let garFrame = try? garSession.update(frame) else { return nil }
    guard let earth = garFrame.earth else { return garFrame }

    if earth.earthState != .enabled {
      set(\.status, earthStateMessage(earth.earthState))
      return garFrame
    }
    guard earth.trackingState == .tracking, let pose = earth.cameraGeospatialTransform else {
      set(\.status, "Localising… point the camera at buildings around you (Rollins Hall, the dorms).")
      trackingGood = false
      return garFrame
    }

    let h = pose.horizontalAccuracy, yaw = pose.orientationYawAccuracy
    set(\.accuracy, String(format: "Position ±%.1f m · heading ±%.1f° · altitude ±%.1f m", h, yaw, pose.verticalAccuracy))
    let here = CLLocation(latitude: pose.coordinate.latitude, longitude: pose.coordinate.longitude)
    let plaque = CLLocation(latitude: FoxleighSite.memorial.latitude, longitude: FoxleighSite.memorial.longitude)
    set(\.distanceToPlaque, String(format: "%.0f m from the plaque", here.distance(from: plaque)))
    trackingGood = h < Threshold.hideHorizontal && yaw < Threshold.hideYaw

    if anchor == nil && future == nil {
      if h < Threshold.placeHorizontal && yaw < Threshold.placeYaw {
        placeHouse()
      } else {
        set(\.status, "Refining position… keep scanning buildings and trees around you.")
        if let waitingSince, Date().timeIntervalSince(waitingSince) > 25 { set(\.canPlaceAnyway, true) }
      }
    } else if let anchor {
      switch anchor.trackingState {
      case .tracking: set(\.status, trackingGood ? "Foxleigh is anchored. Walk around it." : "Tracking weak — scan buildings to recover.")
      case .paused: set(\.status, "Anchor paused — keep scanning.")
      default: set(\.status, "Anchor lost — tap Re-place.")
      }
    }
    return garFrame
  }

  /// Assign only when the value changes, so SwiftUI isn't invalidated every camera frame.
  private func set<T: Equatable>(_ kp: ReferenceWritableKeyPath<GeospatialManager, T>, _ v: T) {
    if self[keyPath: kp] != v { self[keyPath: kp] = v }
  }

  // MARK: anchoring
  /// One terrain anchor at the mansion's origin with East-Up-South axes; the model's yaw and the
  /// fine-tune offsets are applied as a local transform on top (see ARViewContainer), so nudging
  /// never needs a new anchor.
  func placeHouse() {
    guard let garSession, future == nil else { return }
    canPlaceAnyway = false
    status = "Placing Foxleigh on the ground…"
    do {
      future = try garSession.createAnchorOnTerrain(
        coordinate: FoxleighSite.origin, altitudeAboveTerrain: 0,
        eastUpSouthQAnchor: simd_quatf(ix: 0, iy: 0, iz: 0, r: 1)
      ) { [weak self] anchor, state in
        DispatchQueue.main.async {
          guard let self else { return }
          self.future = nil
          if state == .success, let anchor {
            self.anchor = anchor
            self.placed = true
          } else {
            self.status = "Terrain anchor failed (\(state.rawValue)). Tap Re-place to retry."
            self.canPlaceAnyway = true
          }
        }
      }
    } catch let error as NSError {
      future = nil
      status = "Could not create anchor (\(error.code))."
      canPlaceAnyway = true
    }
  }

  func replace() {
    _ = future?.cancel(); future = nil
    if let anchor { garSession?.remove(anchor) }
    anchor = nil; placed = false
    waitingSince = Date()
    placeHouse()
  }

  func resetNudges() { nudgeEast = 0; nudgeNorth = 0; nudgeUp = 0; nudgeYaw = 0 }

  /// Local transform of the model inside the anchor's East-Up-South frame.
  var modelLocalTransform: simd_float4x4 {
    let t = simd_float4x4(translation: SIMD3<Float>(Float(nudgeEast), Float(nudgeUp), Float(-nudgeNorth)))
    let r = simd_float4x4(simd_quatf(angle: FoxleighSite.modelYawRadians(trimDegrees: nudgeYaw), axis: SIMD3<Float>(0, 1, 0)))
    return t * r
  }

  private func save() {
    let d = UserDefaults.standard
    d.set(nudgeEast, forKey: Keys.east); d.set(nudgeNorth, forKey: Keys.north)
    d.set(nudgeUp, forKey: Keys.up); d.set(nudgeYaw, forKey: Keys.yaw)
  }

  private func earthStateMessage(_ s: GAREarthState) -> String {
    switch s {
    case .errorNotAuthorized: return "Google rejected the API key. Check ARCore API is enabled and the key allows com.matchzimmerman.foxleigh."
    case .errorResourceExhausted: return "Google quota exceeded for this key."
    default: return "ARCore Earth error (\(s.rawValue))."
    }
  }

  // MARK: CLLocationManagerDelegate
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
    case .authorizedAlways, .authorizedWhenInUse:
      if manager.accuracyAuthorization != .fullAccuracy {
        status = "Turn on Precise Location for Foxleigh AR in Settings."
        return
      }
      setupGARSession()
      manager.startUpdatingLocation()
    case .notDetermined:
      manager.requestWhenInUseAuthorization()
    default:
      status = "Location access denied. Enable it in Settings → Foxleigh AR."
    }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {}
  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {}
}

extension simd_float4x4 {
  init(translation t: SIMD3<Float>) {
    self = matrix_identity_float4x4
    columns.3 = SIMD4<Float>(t.x, t.y, t.z, 1)
  }
}
