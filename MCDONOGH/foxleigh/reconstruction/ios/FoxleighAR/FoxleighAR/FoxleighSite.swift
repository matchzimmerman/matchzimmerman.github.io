//
// FoxleighSite.swift — where the mansion stood (MZ.Claude for MZ.Human, 2026-11-04)
//
// Values copied from ../../placement.json (placement v001: MZ.Human's on-site footprint sketch,
// memorial pin and porch bearing; 2024 USGS lidar). Field estimate: expect ±5 m / ±5°.
//
// Model frame (Foxleigh.usdz): metres, +y up, +x along the long axis (brick house → Trustees'
// Extension), +z out of the front porch. Origin = centre of the brick mansion's main rectangle
// at grade.
//

import CoreLocation
import simd

enum FoxleighSite {
  /// Model origin: centre of the brick mansion, at grade.
  static let origin = CLLocationCoordinate2D(latitude: 39.3955909, longitude: -76.7762687)
  /// Compass bearing the front porch faces (model +z).
  static let porchFacingDegrees: Double = 165
  /// The 2024 Foxleigh memorial plaque, for the VPS coverage check and the status readout.
  static let memorial = CLLocationCoordinate2D(latitude: 39.3956616, longitude: -76.7760450)

  /// Yaw (about +y, counter-clockwise seen from above) that turns the model's axes onto the
  /// geospatial anchor's East-Up-South axes. +x → bearing 75°, +z → bearing 165°.
  static func modelYawRadians(trimDegrees: Double) -> Float {
    Float((180 - porchFacingDegrees + trimDegrees) * .pi / 180)
  }
}
