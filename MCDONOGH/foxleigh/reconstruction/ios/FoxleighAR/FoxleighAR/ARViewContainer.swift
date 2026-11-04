//
// ARViewContainer.swift — Foxleigh AR
//
// Adapted from Google's ARCore GeospatialExample (Apache License 2.0). Renders Foxleigh.usdz on the
// geospatial terrain anchor.
//

import ARCoreGARSession
import ARCoreGeospatial
import ARKit
import RealityKit
import SwiftUI
import simd

struct ARViewContainer: UIViewRepresentable {
  let manager: GeospatialManager

  final class Coordinator: NSObject, ARSessionDelegate {
    private let manager: GeospatialManager
    /// Follows the GARAnchor (East-Up-South axes at the mansion origin, on Google's terrain).
    private let siteAnchor = AnchorEntity(world: matrix_identity_float4x4)
    /// Holds the model; carries the model yaw + fine-tune offsets.
    private let house = Entity()
    private var model: Entity?

    init(_ manager: GeospatialManager) {
      self.manager = manager
      super.init()
      manager.arView.session.delegate = self
      manager.arView.scene.addAnchor(siteAnchor)
      siteAnchor.addChild(house)
      siteAnchor.isEnabled = false
      loadModel()
    }

    private func loadModel() {
      do {
        let entity = try Entity.load(named: "Foxleigh")
        house.addChild(entity)
        model = entity
      } catch {
        DispatchQueue.main.async { self.manager.status = "Could not load Foxleigh.usdz: \(error.localizedDescription)" }
      }
    }

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
      _ = manager.update(frame)
      guard let anchor = manager.anchor else { siteAnchor.isEnabled = false; return }
      siteAnchor.transform = Transform(matrix: anchor.transform)
      house.transform = Transform(matrix: manager.modelLocalTransform)
      siteAnchor.isEnabled = anchor.trackingState == .tracking && manager.trackingGood
      if let model { model.components.set(OpacityComponent(opacity: manager.opacity)) }
    }
  }

  func makeUIView(context: Context) -> ARView {
    manager.arView.environment.sceneUnderstanding.options = []
    manager.arView.renderOptions.insert(.disableMotionBlur)
    return manager.arView
  }

  func updateUIView(_ uiView: ARView, context: Context) {}

  func makeCoordinator() -> Coordinator { Coordinator(manager) }
}
