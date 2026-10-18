/* MZ WORLDS Warren collaboration bridge v0.1
 * Same file in the MZ source directory and Mick's integration mirror.
 * No model registration, historical identity or map coordinates are inferred.
 */
(() => {
  "use strict";
  const mirror = /\/integrations\/mz-worlds(?:\/|$)/.test(location.pathname);
  const fieldUrl = mirror ? "./engine/index.html" : "../experience/index.html";
  const evidence = mirror ? {
    map: "../../Warren_Foundations_Map.html",
    town: "../../Warren_Town_3D.html",
    plan: "../../Warren_1908_Plan.html"
  } : { map: null, town: null, plan: null };
  const researchRepo = "https://github.com/ItsMick/town-of-warren";
  const body = document.getElementById("workspace");
  const fieldFrame = document.getElementById("field-frame");
  const researchFrame = document.getElementById("research-frame");
  const gate = document.getElementById("research-gate");
  const researchSelect = document.getElementById("evidence-view");
  const modes = [...document.querySelectorAll("[data-mode]")];
  const setUrl = (id, url) => { document.getElementById(id).href = url; };
  fieldFrame.src = fieldUrl;
  setUrl("open-field", fieldUrl);
  setUrl("field-fallback", fieldUrl);
  setUrl("open-research", mirror ? evidence.map : researchRepo);
  let mode = "field";
  let activeResearch = null;
  function loadResearch() {
    if (!mirror) {
      gate.hidden = false;
      researchFrame.hidden = true;
      return;
    }
    gate.hidden = true;
    researchFrame.hidden = false;
    const next = evidence[researchSelect.value];
    if (activeResearch !== next) {
      researchFrame.src = next;
      activeResearch = next;
    }
    setUrl("open-research", next);
  }
  function setMode(next) {
    if (!["field", "research", "compare"].includes(next)) return;
    mode = next;
    body.className = "workspace mode-" + next;
    for (const b of modes) b.setAttribute("aria-pressed", String(b.dataset.mode === next));
    if (next !== "field") loadResearch();
  }
  for (const b of modes) b.addEventListener("click", () => setMode(b.dataset.mode));
  researchSelect.addEventListener("change", () => {
    if (mirror) setUrl("open-research", evidence[researchSelect.value]);
    if (mode !== "field") loadResearch();
  });
  setMode("field");
  const note = document.getElementById("observation");
  const status = document.getElementById("export-status");
  document.getElementById("export").addEventListener("click", () => {
    const observation = note.value.trim();
    if (!observation) {
      status.textContent = "WRITE AN OBSERVATION FIRST";
      note.focus();
      return;
    }
    const now = new Date();
    const record = {
      schema: "mz-warren-observation/v1",
      authorSystem: "HARIL STUDIO / MZ WORLDS",
      originRepository: "matchzimmerman/matchzimmerman.github.io",
      pairedResearchRepository: "ItsMick/town-of-warren",
      originExperience: "WARREN / Field Study 002",
      capturedAtUtc: now.toISOString(),
      observation,
      researchView: mode === "field" ? null : researchSelect.value,
      epistemicStatus: "unverified-human-observation",
      historicalLocation: null,
      sourceReference: null,
      requiresHumanSourceReview: true,
      promotedToHistoricalRecord: false
    };
    const json = JSON.stringify(record, null, 2) + "\n";
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "warren-observation-" + now.toISOString().replace(/[:.]/g, "-") + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "EXPORTED · AWAITING HUMAN REVIEW";
  });
})();