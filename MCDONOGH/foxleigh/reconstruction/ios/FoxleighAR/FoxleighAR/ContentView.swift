//
// ContentView.swift — Foxleigh AR (MZ.Claude for MZ.Human, 2026-11-04)
//

import SwiftUI

struct ContentView: View {
  @StateObject private var manager = GeospatialManager()
  @State private var keyDraft = ""
  @State private var showTune = false

  private let gold = Color(red: 0.89, green: 0.78, blue: 0.56)
  private let panel = Color(red: 0.03, green: 0.07, blue: 0.09).opacity(0.82)

  var body: some View {
    ZStack {
      ARViewContainer(manager: manager).ignoresSafeArea()

      VStack(spacing: 0) {
        // ---------- header ----------
        VStack(alignment: .leading, spacing: 3) {
          Text("FOXLEIGH · ON SITE").font(.system(size: 10, weight: .bold)).kerning(1.6).foregroundStyle(gold)
          Text("The Old House, c.1873–1914").font(.custom("Georgia", size: 20)).foregroundStyle(.white)
          Text(manager.status).font(.system(size: 12)).foregroundStyle(.white.opacity(0.9))
          Text(manager.vpsAtSite).font(.system(size: 11, weight: .semibold))
            .foregroundStyle(manager.vpsAvailable == true ? Color.green : manager.vpsAvailable == false ? Color.orange : Color.white.opacity(0.7))
          if !manager.accuracy.isEmpty {
            Text(manager.accuracy + (manager.distanceToPlaque.isEmpty ? "" : " · " + manager.distanceToPlaque))
              .font(.system(size: 11)).foregroundStyle(.white.opacity(0.75))
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(panel)

        Spacer()

        // ---------- controls ----------
        VStack(spacing: 8) {
          HStack(spacing: 8) {
            if manager.canPlaceAnyway && !manager.placed {
              button("Place anyway") { manager.placeHouse() }
            }
            if manager.placed { button("Re-place") { manager.replace() } }
            button(showTune ? "Done" : "Fine-tune") { showTune.toggle() }
            button("Key") { keyDraft = manager.apiKey; manager.showKeyEntry = true }
          }
          HStack {
            Text("See-through").font(.system(size: 11)).foregroundStyle(.white.opacity(0.7)).frame(width: 78, alignment: .leading)
            Slider(value: $manager.opacity, in: 0.2...1).tint(gold)
          }
          if showTune { tunePanel }
        }
        .padding(12)
        .background(panel)
      }
    }
    .alert("AR in the real world", isPresented: $manager.showPrivacyNotice) {
      Button("Get started") { manager.acceptPrivacyNotice() }
      Link("Learn more", destination: URL(string: "https://developers.google.com/ar/data-privacy")!)
    } message: {
      Text("To power this session, Google will process visual data from your camera.")
    }
    .sheet(isPresented: Binding(
      get: { manager.showKeyEntry && !manager.showPrivacyNotice },
      set: { manager.showKeyEntry = $0 })) { keySheet }
  }

  // ---------- fine-tune: moves are relative to the ground, not the camera ----------
  private var tunePanel: some View {
    VStack(spacing: 6) {
      Text(String(format: "East %+.1f m · North %+.1f m · Up %+.1f m · Turn %+.1f°",
                  manager.nudgeEast, manager.nudgeNorth, manager.nudgeUp, manager.nudgeYaw))
        .font(.system(size: 11).monospacedDigit()).foregroundStyle(gold)
      HStack(spacing: 6) {
        small("W ←") { manager.nudgeEast -= 0.5 }
        small("→ E") { manager.nudgeEast += 0.5 }
        small("S ↓") { manager.nudgeNorth -= 0.5 }
        small("↑ N") { manager.nudgeNorth += 0.5 }
      }
      HStack(spacing: 6) {
        small("⟲ 0.5°") { manager.nudgeYaw += 0.5 }
        small("⟳ 0.5°") { manager.nudgeYaw -= 0.5 }
        small("Up 0.1") { manager.nudgeUp += 0.1 }
        small("Down 0.1") { manager.nudgeUp -= 0.1 }
      }
      HStack(spacing: 6) {
        small("Reset") { manager.resetNudges() }
        small("Recheck VPS") { manager.checkVPSAtSite() }
      }
      Text("Offsets are saved on this phone. Send them to MZ.Claude to update the site placement.")
        .font(.system(size: 10)).foregroundStyle(.white.opacity(0.6))
    }
  }

  private var keySheet: some View {
    NavigationStack {
      Form {
        Section {
          TextField("Paste your ARCore API key", text: $keyDraft)
            .textInputAutocapitalization(.never).autocorrectionDisabled().font(.system(.body, design: .monospaced))
        } footer: {
          Text("From Google Cloud console → APIs & Services → Credentials. The key needs the ARCore API enabled and should be restricted to the iOS bundle ID com.matchzimmerman.foxleigh. It stays on this phone.")
        }
        Button("Save key") { manager.saveKey(keyDraft) }.disabled(keyDraft.trimmingCharacters(in: .whitespaces).isEmpty)
      }
      .navigationTitle("Google API key")
    }
    .interactiveDismissDisabled(manager.apiKey.isEmpty)
  }

  private func button(_ title: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Text(title).font(.system(size: 13, weight: .semibold)).frame(maxWidth: .infinity, minHeight: 40)
    }
    .buttonStyle(.bordered).tint(.white)
  }

  private func small(_ title: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Text(title).font(.system(size: 12, weight: .semibold)).frame(maxWidth: .infinity, minHeight: 34)
    }
    .buttonStyle(.bordered).tint(gold)
  }
}
