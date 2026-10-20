"""Model registry, candidate proposal, fixed-seed diff, gated promotion, rollback.

Policy (BUILD-001 promotion contract):
- Volume never promotes. A candidate is *proposed* only when accepted,
  traceable, uncontradicted claims move a mapped parameter beyond its
  tolerance from the namespace's approved baseline.
- A candidate may drive the experimental side-preview automatically once its
  deterministic tests pass. It never replaces the approved baseline by itself.
- Promotion requires: tests passed, every evidence claim accepted at *science*
  scope, and an authorization. In the REAL namespace the actor must be
  MZ.Human and the claims must carry an MZ.Human review. In the DEMO namespace
  only a declared controlled-test authorization is accepted.
- Approval is not historical validation: the approved real baseline is labelled
  HUMAN-APPROVED · NOT HISTORICALLY VALIDATED until HDD gates G0–G7 pass.
- Rollback moves the pointer back; no model, candidate or event is deleted.
"""
import json
import math
import subprocess
from pathlib import Path

from . import claims as C
from .ledger import canon, sha256_bytes, sha256_text

ENGINE_DIR = Path(__file__).resolve().parents[2]
RUNNER = ENGINE_DIR / "model" / "runner.js"
BASELINE_ARTIFACT = ENGINE_DIR / "models" / "LF-0.1.0.json"
SURROGATE_TEST = ENGINE_DIR.parent / "earhart-last-flight" / "test-model.js"

REAL_LABEL = "HUMAN-APPROVED · NOT HISTORICALLY VALIDATED (HDD gates G0–G7 open)"
BASE_LABEL = "EXPLORATORY SURROGATE · NOT VALIDATED · no approval of historical authority"
DEMO_LABEL = "DEMO · TEST-APPROVED IN CONTROLLED SANDBOX · not science"


def git_commit():
    try:
        return subprocess.run(["git", "-C", str(ENGINE_DIR), "rev-parse", "--short=12", "HEAD"],
                              capture_output=True, text=True, timeout=10).stdout.strip() or "unknown"
    except Exception:  # noqa
        return "unknown"


def run_model(params, seed, count):
    p = subprocess.run(["node", str(RUNNER), "--params", json.dumps(params), "--seed", str(seed), "--count", str(count)],
                       capture_output=True, text=True, timeout=300)
    if p.returncode != 0:
        raise RuntimeError("model runner failed: " + p.stderr.strip())
    return json.loads(p.stdout)


def artifact_params(art):
    return {k: v["value"] for k, v in art["parameters"].items()}


def _art_path(L, model_id):
    safe = model_id.replace("/", "_")
    return L.root / "ledger" / "models" / f"{safe}.json"


def write_immutable(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False) + "\n").encode("utf-8")
    if path.exists():
        if path.read_bytes() != data:
            raise RuntimeError(f"immutable artifact {path.name} exists with different content")
        return sha256_bytes(data)
    path.write_bytes(data)
    return sha256_bytes(data)


# ---------------------------------------------------------------------- registry
def register_baselines(L):
    art = json.loads(BASELINE_ARTIFACT.read_text())
    sha = sha256_bytes(BASELINE_ARTIFACT.read_bytes())
    out = run_model(artifact_params(art), art["ensemble"]["seed"], art["ensemble"]["count"])
    for ns, mid in (("real", art["model_id"]), ("demo", "DEMO/" + art["model_id"])):
        if L.one("SELECT 1 FROM models WHERE model_id=?", (mid,)):
            continue
        L.append("model.registered", "model", mid, {
            "version": art["version"], "kind": "baseline", "status": "approved-baseline (exploratory)",
            "validation": art["validation"], "params": art["parameters"], "artifact_path": str(BASELINE_ARTIFACT.relative_to(ENGINE_DIR)),
            "artifact_sha256": sha, "output_hash": out["output_hash"], "summary": out["summary"],
            "seed": art["ensemble"]["seed"], "count": art["ensemble"]["count"]}, namespace=ns)
        L.append("pointer.set", "pointer", ns, {"baseline_model": mid, "approval_label":
                                               BASE_LABEL if ns == "real" else "DEMO · " + BASE_LABEL,
                                               "reason": "initial exploratory baseline (original public prototype inputs)"},
                 namespace=ns)


def baseline(L, ns):
    p = L.one("SELECT * FROM pointers WHERE namespace=?", (ns,))
    m = L.one("SELECT * FROM models WHERE model_id=?", (p["baseline_model"],))
    m["params"] = json.loads(m["params_json"])
    return p, m


# ---------------------------------------------------------------------- proposal
def evaluate(L, ns):
    """Decide whether accepted evidence materially changes a parameter. Returns (changes, considered)."""
    _, base = baseline(L, ns)
    eligible = L.q("SELECT * FROM claims WHERE namespace=? AND status='active' AND eligibility IN "
                   "('eligible-candidate','eligible-science') ORDER BY claim_id", (ns,))
    by = {}
    for c in eligible:
        by.setdefault(c["param_key"], []).append(c)
    changes = []
    for pk, cs in sorted(by.items()):
        vals = [c["normalized_value"] for c in cs]
        prop = round(sum(vals) / len(vals), 3)
        cur = base["params"][pk]["value"]
        tol = C.PARAMS[pk]["tolerance"]
        material = abs(prop - cur) > tol * abs(cur)
        changes.append({"key": pk, "base": cur, "proposed": prop, "unit": C.PARAMS[pk]["unit"],
                        "tolerance": tol, "material": material,
                        "evidence_claim_ids": [c["claim_id"] for c in cs],
                        "scopes": sorted({c["eligibility"] for c in cs})})
    return [c for c in changes if c["material"]], changes


def manifest(L, claim_ids):
    rows = []
    for cid in sorted(claim_ids):
        c = L.one("SELECT c.claim_id,c.source_id,c.locator,c.normalized_value,c.unit,s.original_url,s.sha256 FROM claims c "
                  "JOIN sources s ON s.source_id=c.source_id WHERE claim_id=?", (cid,))
        rows.append(c)
    return rows, sha256_text(canon(rows))


def propose(L, ns, log=print):
    material, considered = evaluate(L, ns)
    p, base = baseline(L, ns)
    if not material:
        _policy_note(L, ns, considered, "no material change from accepted evidence; baseline unchanged")
        return None
    ids = sorted({i for ch in material for i in ch["evidence_claim_ids"]})
    rows, mhash = manifest(L, ids)
    existing = L.one("SELECT * FROM candidates WHERE namespace=? AND evidence_manifest_hash=? AND base_model=?",
                     (ns, mhash, base["model_id"]))
    if existing and existing["review_status"] != "proposed":
        return existing["candidate_id"]
    if existing:
        # proposal was interrupted before its tests were recorded: resume from the immutable artifact
        cid, mid = existing["candidate_id"], existing["proposed_model"]
        art = json.loads(_art_path(L, mid).read_text())
        L.append("candidate.resumed", "candidate", cid, {"note": "proposal found without test record; re-running tests"},
                 namespace=ns)
        return _finish(L, ns, cid, mid, art, base, material, _art_path(L, mid), log)
    n = L.one("SELECT COUNT(*) n FROM candidates WHERE namespace=?", (ns,))["n"] + 1
    major, minor, patch = (int(x) for x in base["version"].split("-")[0].split("."))
    version = f"{major}.{minor + 1}.0-c{n}"
    prefix = "DEMO/" if ns == "demo" else ""
    mid = f"{prefix}LF-{version}"
    cid = f"{prefix}CAND-{n:03d}"
    params = json.loads(json.dumps(base["params"]))
    for ch in material:
        params[ch["key"]] = dict(params[ch["key"]], value=ch["proposed"], evidence_claim_ids=ch["evidence_claim_ids"],
                                 calibration_status="evidence-derived candidate (uncalibrated against held-out legs)")
    art0 = json.loads(BASELINE_ARTIFACT.read_text())
    seed, count = art0["ensemble"]["seed"], art0["ensemble"]["count"]
    reason = "; ".join(f"accepted claims {', '.join(ch['evidence_claim_ids'])} move {ch['key']} "
                       f"{ch['base']}→{ch['proposed']} {ch['unit']} (> {ch['tolerance']:.0%} tolerance)" for ch in material)
    art = {
        "model_id": mid, "version": version, "kind": "candidate", "namespace": ns,
        "base_model": base["model_id"], "base_artifact_sha256": base["artifact_sha256"],
        "validation": "NOT VALIDATED · candidate", "parameters": params,
        "ensemble": {"seed": seed, "count": count},
        "evidence_manifest": rows, "evidence_manifest_hash": mhash,
        "surrogate": "../earhart-last-flight/model.js (pinned sha256 in model/runner.js)",
        "code_commit": git_commit(), "reason": reason,
    }
    path = _art_path(L, mid)
    asha = write_immutable(path, art)
    L.append("candidate.proposed", "candidate", cid, {
        "base_model": base["model_id"], "proposed_model": mid,
        "params_changed": [{k: ch[k] for k in ("key", "base", "proposed", "unit")} for ch in material],
        "evidence_claim_ids": ids, "evidence_manifest_hash": mhash, "seed": seed, "count": count,
        "code_commit": art["code_commit"], "previous_snapshot_hash": base["output_hash"], "reason": reason}, namespace=ns)
    return _finish(L, ns, cid, mid, art, base, material, path, log)


def _finish(L, ns, cid, mid, art, base, material, path, log):
    params, seed, count, version = art["parameters"], art["ensemble"]["seed"], art["ensemble"]["count"], art["version"]
    asha = sha256_bytes(path.read_bytes())
    tests, diff, out = test_candidate(L, base, params, seed, count, material)
    L.append("model.registered", "model", mid, {
        "version": version, "base_model": base["model_id"], "kind": "candidate", "status": "candidate",
        "validation": "NOT VALIDATED · candidate", "params": params, "artifact_path": "ledger/models/" + path.name,
        "artifact_sha256": asha, "output_hash": out["output_hash"] if out else None,
        "summary": out["summary"] if out else {}}, namespace=ns)
    status = "candidate · side-preview" if tests["passed"] else "failed-tests"
    L.append("candidate.tested", "candidate", cid, {"tests": tests, "diff": diff, "review_status": status}, namespace=ns)
    log(f"[{ns}] proposed {cid} → {mid}: {status}")
    return cid


def _policy_note(L, ns, considered, verdict):
    """Log the promotion-policy evaluation, but only when it differs from the last one (durable across restarts)."""
    data = {"verdict": verdict, "considered": considered}
    h = sha256_text(canon(data))
    last = None
    for ev in L.read_log():
        if ev["type"] == "display.policy_evaluated" and ev["namespace"] == ns:
            last = ev["data"].get("eval_hash")
    if last == h:
        return
    L.append("display.policy_evaluated", "display", ns, dict(data, eval_hash=h, label=f"PROMOTION POLICY · {verdict}",
                                                            synthetic=(ns == "demo")), namespace=ns)


def test_candidate(L, base, params, seed, count, material):
    pv = {k: v["value"] for k, v in params.items()}
    bv = {k: v["value"] for k, v in base["params"].items()}
    t = {"checks": []}

    def check(name, ok, detail=""):
        t["checks"].append({"name": name, "ok": bool(ok), "detail": detail})
    try:
        b1, b2 = run_model(bv, seed, count), run_model(bv, seed, count)
        c1, c2 = run_model(pv, seed, count), run_model(pv, seed, count)
    except Exception as e:  # noqa
        check("runner", False, str(e))
        t["passed"] = False
        return t, {}, None
    check("baseline reproduces (same seeds → identical output hash)", b1["output_hash"] == b2["output_hash"], b1["output_hash"][:16])
    check("baseline matches registered snapshot", b1["output_hash"] == base["output_hash"], base["output_hash"][:16])
    check("candidate reproduces (same seeds → identical output hash)", c1["output_hash"] == c2["output_hash"], c1["output_hash"][:16])
    check("candidate differs from baseline", c1["output_hash"] != b1["output_hash"])
    check("same surrogate code", c1["surrogate_sha256"] == b1["surrogate_sha256"], c1["surrogate_sha256"][:16])
    for ch in material:
        lo, hi = params[ch["key"]].get("bounds", [None, None])
        ok = (lo is None or ch["proposed"] >= lo) and (hi is None or ch["proposed"] <= hi)
        check(f"{ch['key']} within declared bounds {lo}–{hi}", ok, str(ch["proposed"]))
    fin = all(math.isfinite(x[k]) for x in c1["trials"] for k in ("end_lat", "end_lon", "endurance_h"))
    check("all candidate trials finite", fin)
    st = subprocess.run(["node", str(SURROGATE_TEST)], capture_output=True, text=True, timeout=120)
    check("original surrogate sanity suite (test-model.js)", st.returncode == 0, st.stdout.strip()[:90])
    t["passed"] = all(c["ok"] for c in t["checks"])
    t["tolerance"] = "outputs rounded to 1e-6 before hashing"
    # ---- fixed-seed diff
    per = []
    for a, b in zip(b1["trials"], c1["trials"]):
        assert a["seed"] == b["seed"]
        dlat = (b["end_lat"] - a["end_lat"]) * 111.195
        dlon = (b["end_lon"] - a["end_lon"]) * 111.195 * math.cos(math.radians((a["end_lat"] + b["end_lat"]) / 2))
        per.append({"i": a["i"], "seed": a["seed"],
                    "base_end": [a["end_lat"], a["end_lon"]], "cand_end": [b["end_lat"], b["end_lon"]],
                    "d_endurance_h": round(b["endurance_h"] - a["endurance_h"], 6),
                    "end_shift_km": round(math.hypot(dlat, dlon), 3),
                    "d_min_howland_km": round(b["min_howland_km"] - a["min_howland_km"], 3),
                    "near_howland": [a["near_howland"], b["near_howland"]]})
    sb, sc = b1["summary"], c1["summary"]
    expected = []
    for ch in material:
        e = {"key": ch["key"], "text": C.PARAMS[ch["key"]]["expected"]}
        if ch["key"] == "fuelStart":
            e["expected_mean_d_endurance_h"] = round((ch["proposed"] - ch["base"]) / bv["burn"], 4)
        if ch["key"] == "burn":
            e["expected_mean_d_endurance_h"] = round(bv["fuelStart"] / ch["proposed"] - bv["fuelStart"] / ch["base"], 4)
        expected.append(e)
    diff = {
        "same_seeds": True, "seed": seed, "count": count,
        "base_output_hash": b1["output_hash"], "candidate_output_hash": c1["output_hash"],
        "params": [dict(ch, label=C.PARAMS[ch["key"]]["label"]) for ch in material],
        "expected_influence": expected,
        "summary_base": sb, "summary_candidate": sc,
        "observed": {
            "mean_d_endurance_h": round(sc["mean_endurance_h"] - sb["mean_endurance_h"], 6),
            "mean_end_shift_km": round(sum(p["end_shift_km"] for p in per) / len(per), 3),
            "max_end_shift_km": round(max(p["end_shift_km"] for p in per), 3),
            "near_howland": [sb["near_howland"], sc["near_howland"]],
            "trials_changed_classification": sum(1 for p in per if p["near_howland"][0] != p["near_howland"][1]),
        },
        "per_trial": per,
        "caution": "differences are between two uncalibrated synthetic surrogates on identical seeds; not a historical inference",
    }
    return t, diff, c1


# ---------------------------------------------------------------------- promotion
def approve(L, ns, cid, actor, authorization):
    cand = L.one("SELECT * FROM candidates WHERE candidate_id=? AND namespace=?", (cid, ns))
    reasons = []
    if not cand:
        reasons.append(f"no candidate {cid} in namespace {ns}")
    else:
        tests = json.loads(cand["tests_json"] or "{}")
        if not tests.get("passed"):
            reasons.append("deterministic tests have not passed")
        if cand["review_status"] in ("promoted",):
            reasons.append("already promoted")
        for c in json.loads(cand["evidence_claim_ids_json"]):
            row = L.one("SELECT review_state, eligibility, reviewers_json FROM claims WHERE claim_id=?", (c,))
            if not row or row["review_state"] != "accepted_science" or row["eligibility"] != "eligible-science":
                reasons.append(f"claim {c} not accepted at science scope (state={row and row['review_state']}, "
                               f"eligibility={row and row['eligibility']})")
            elif ns == "real" and not any(r["reviewer"] == "MZ.Human" and r["decision"] == "accept" and r.get("scope") == "science"
                                          for r in json.loads(row["reviewers_json"])):
                reasons.append(f"claim {c} lacks an MZ.Human science-scope review")
        p, base = baseline(L, ns)
        if cand["base_model"] != base["model_id"]:
            reasons.append(f"candidate base {cand['base_model']} is not the current baseline {base['model_id']}")
    if not authorization or not authorization.strip():
        reasons.append("no authorization statement")
    if ns == "real" and actor != "MZ.Human":
        reasons.append("real-namespace promotion requires actor MZ.Human")
    if ns == "demo" and not (actor.startswith("TEST") and "controlled test" in (authorization or "").lower()):
        reasons.append("demo promotion requires a TEST actor and a 'controlled test' authorization")
    pid = f"{'DEMO/' if ns == 'demo' else ''}PROMO-{L.last_seq + 1:07d}"
    if reasons:
        L.append("promotion.refused", "promotion", pid, {"candidate_id": cid, "authorization": authorization,
                                                          "reasons": reasons}, actor=actor, namespace=ns)
        return False, reasons
    diff = json.loads(cand["diff_json"])
    diff_s = {k: diff[k] for k in ("params", "summary_base", "summary_candidate", "observed", "base_output_hash",
                                     "candidate_output_hash")}
    L.append("promotion.approved", "promotion", pid, {
        "candidate_id": cid, "authorization": authorization, "previous_model": base["model_id"],
        "next_model": cand["proposed_model"], "diff": diff_s, "rollback_pointer": base["model_id"]}, actor=actor, namespace=ns)
    L.append("model.status", "model", base["model_id"], {"status": "superseded (retained, rollback target)"}, actor=actor, namespace=ns)
    L.append("model.status", "model", cand["proposed_model"], {"status": "approved-baseline"}, actor=actor, namespace=ns)
    L.append("pointer.set", "pointer", ns, {"baseline_model": cand["proposed_model"],
                                           "approval_label": REAL_LABEL if ns == "real" else DEMO_LABEL,
                                           "promotion_id": pid}, actor=actor, namespace=ns)
    L.append("candidate.status", "candidate", cid, {"review_status": "promoted"}, actor=actor, namespace=ns)
    return True, pid


def rollback(L, ns, actor, authorization):
    last = L.one("SELECT * FROM promotions WHERE namespace=? AND kind='approved' AND promotion_id NOT IN "
                 "(SELECT COALESCE(rollback_pointer,'') FROM promotions WHERE kind='rolled_back') ORDER BY ts DESC LIMIT 1", (ns,))
    p, cur = baseline(L, ns)
    pid = f"{'DEMO/' if ns == 'demo' else ''}PROMO-{L.last_seq + 1:07d}"
    if not last or last["next_model"] != cur["model_id"]:
        L.append("promotion.refused", "promotion", pid, {"authorization": authorization,
                                                          "reasons": ["no promotion to roll back for current baseline"]},
                 actor=actor, namespace=ns)
        return False, "nothing to roll back"
    if not authorization:
        return False, "authorization required"
    target = last["previous_model"]
    L.append("promotion.rolled_back", "promotion", pid, {
        "candidate_id": last["candidate_id"], "authorization": authorization, "previous_model": cur["model_id"],
        "next_model": target, "rollback_pointer": last["promotion_id"],
        "diff": {"note": "pointer restored; no artifacts deleted"}}, actor=actor, namespace=ns)
    L.append("model.status", "model", cur["model_id"], {"status": "rolled back (retained)"}, actor=actor, namespace=ns)
    prev_label = BASE_LABEL if ns == "real" else "DEMO · " + BASE_LABEL
    L.append("model.status", "model", target, {"status": "approved-baseline (restored)"}, actor=actor, namespace=ns)
    L.append("pointer.set", "pointer", ns, {"baseline_model": target, "approval_label": prev_label, "promotion_id": pid},
             actor=actor, namespace=ns)
    L.append("candidate.status", "candidate", last["candidate_id"], {"review_status": "rolled-back (retained)"}, actor=actor, namespace=ns)
    return True, pid
