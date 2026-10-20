"""Read-only public feed for the OBS browser source.

feed/snapshot.json is written atomically after every worker pass. It contains
only public-safe fields (no local paths, no third-party text), explicit
denominators per namespace, and the lineage source → claim → parameter →
candidate → affected result. The viewer never writes anything back.
"""
import json
import os
from pathlib import Path

from .ledger import utcnow, canon, sha256_text
from . import models as M

ENGINE_VERSION = "lf-engine 0.1.0 (BUILD-001)"


def _count(L, sql, args=()):
    return L.one(sql, args)["n"]


def counters(L, ns):
    c = {}
    by_state = {r["ingestion_state"]: r["n"] for r in L.q(
        "SELECT ingestion_state, COUNT(*) n FROM sources WHERE namespace=? GROUP BY ingestion_state", (ns,))}
    c["by_state"] = by_state
    c["known_targets"] = sum(by_state.values())
    # verified = size AND type recorded; reachable-only is counted separately and never shown as verified
    c["metadata_verified"] = _count(L, "SELECT COUNT(*) n FROM sources WHERE namespace=? AND ingestion_state='metadata_only' "
                                       "AND bytes IS NOT NULL AND content_type IS NOT NULL", (ns,))
    c["metadata_reachable_only"] = by_state.get("metadata_only", 0) - c["metadata_verified"]
    acquired_states = ("acquired", "verified", "extracting", "extracted", "extracted_partial", "partially_extracted", "normalized",
                       "claims_extracted", "classified", "duplicate", "corrupt", "unsupported")
    c["content_acquired"] = sum(by_state.get(s, 0) for s in acquired_states)
    c["parsed"] = sum(by_state.get(s, 0) for s in ("extracted", "extracted_partial", "partially_extracted", "normalized", "claims_extracted", "classified"))
    c["classified"] = by_state.get("classified", 0)
    c["pages_in_acquired_files"] = _count(L, "SELECT COALESCE(SUM(page_count),0) n FROM sources WHERE namespace=? AND page_count IS NOT NULL "
                                             "AND ingestion_state NOT IN ('duplicate','corrupt')", (ns,))
    c["pages_extracted"] = _count(L, "SELECT COALESCE(SUM(pages_extracted),0) n FROM sources WHERE namespace=?", (ns,))
    c["bytes_indexed"] = _count(L, "SELECT COALESCE(SUM(bytes),0) n FROM sources WHERE namespace=?", (ns,))
    c["claims"] = _count(L, "SELECT COUNT(*) n FROM claims WHERE namespace=?", (ns,))
    c["claims_by_review"] = {r["review_state"]: r["n"] for r in L.q(
        "SELECT review_state, COUNT(*) n FROM claims WHERE namespace=? GROUP BY review_state", (ns,))}
    c["claims_by_eligibility"] = {r["eligibility"]: r["n"] for r in L.q(
        "SELECT eligibility, COUNT(*) n FROM claims WHERE namespace=? GROUP BY eligibility", (ns,))}
    c["claims_reviewed"] = sum(v for k, v in c["claims_by_review"].items() if k != "unreviewed")
    p, base = M.baseline(L, ns)
    used = sorted({i for v in base["params"].values() for i in v.get("evidence_claim_ids", [])})
    c["claims_in_approved_baseline"] = len(used)
    c["model_parameters_evidence_derived"] = sum(1 for v in base["params"].values() if v.get("evidence_claim_ids"))
    c["failed"] = by_state.get("failed", 0)
    c["blocked"] = by_state.get("blocked_rights", 0)
    c["duplicates"] = by_state.get("duplicate", 0)
    c["corrupt"] = by_state.get("corrupt", 0)
    c["unsupported"] = by_state.get("unsupported", 0)
    c["retry_wait"] = by_state.get("retry_wait", 0)
    c["conflicts"] = _count(L, "SELECT COUNT(*) n FROM claims WHERE namespace=? AND contradiction_ids_json<>'[]'", (ns,))
    c["candidates"] = _count(L, "SELECT COUNT(*) n FROM candidates WHERE namespace=?", (ns,))
    return c


def export(L, root, recent=400):
    root = Path(root)
    feed_dir = root / "feed"
    feed_dir.mkdir(parents=True, exist_ok=True)
    events = L.read_log()
    portal = None
    acq_fail = {"real": 0, "demo": 0}
    for ev in events:
        if ev["type"] == "source.inventory_parsed":
            portal = ev["data"]
        if ev["type"] == "source.acquire_failed":
            acq_fail[ev["namespace"]] += 1
    snap = {
        "schema": "lastflight-feed/1",
        "generated_at": utcnow(),
        "engine": ENGINE_VERSION,
        "code_commit": M.git_commit(),
        "ledger": {"events": len(events), "last_hash": events[-1]["hash"] if events else None,
                   "first_ts": events[0]["ts"] if events else None, "last_ts": events[-1]["ts"] if events else None},
        "labels": {
            "real": "REAL · retrieved sources (counts are actual processed items)",
            "demo": "DEMO / SYNTHETIC · authored fixtures for testing mechanics — not evidence",
        },
        "namespaces": {},
        "portal": portal,
    }
    for ns in ("real", "demo"):
        p, base = M.baseline(L, ns)
        snap["namespaces"][ns] = {
            "counters": counters(L, ns),
            "acquire_failures_logged": acq_fail[ns],
            "pointer": p,
            "baseline": {k: base[k] for k in ("model_id", "version", "status", "validation", "output_hash", "artifact_sha256")}
                        | {"params": base["params"], "summary": json.loads(base["summary_json"] or "{}")},
        }
    pub_src = ("source_id", "namespace", "original_url", "provider", "title", "original_date", "release_date",
               "retrieval_time", "page_count", "pages_extracted", "bytes", "content_type", "rights", "rights_basis",
               "display_policy", "sha256", "version", "ingestion_state", "error", "attempts", "record_kind",
               "content_retained", "duplicate_of", "discovered_at", "updated_at", "last_modified")
    snap["sources"] = [{k: r[k] for k in pub_src} | {"meta": json.loads(r["meta_json"] or "{}")}
                       for r in L.q("SELECT * FROM sources ORDER BY namespace, discovered_at, source_id")]
    for s in snap["sources"]:
        s["meta"].pop("file", None)
    cl = []
    for r in L.q("SELECT * FROM claims ORDER BY namespace, source_id, page, line"):
        d = dict(r)
        for k in ("reviewers_json", "dependencies_json", "contradiction_ids_json", "eligibility_reasons_json"):
            d[k[:-5]] = json.loads(d.pop(k) or "[]")
        cl.append(d)
    snap["claims"] = cl
    snap["models"] = []
    for r in L.q("SELECT * FROM models ORDER BY created_at"):
        d = dict(r)
        d["params"] = json.loads(d.pop("params_json"))
        d["summary"] = json.loads(d.pop("summary_json") or "{}")
        snap["models"].append(d)
    snap["candidates"] = []
    for r in L.q("SELECT * FROM candidates ORDER BY created_at"):
        d = dict(r)
        for k in ("params_changed_json", "evidence_claim_ids_json", "tests_json", "diff_json"):
            d[k[:-5]] = json.loads(d.pop(k) or "{}")
        snap["candidates"].append(d)
    snap["promotions"] = []
    for r in L.q("SELECT * FROM promotions ORDER BY ts"):
        d = dict(r)
        d["diff"] = json.loads(d.pop("diff_json") or "{}")
        d["reasons"] = json.loads(d.pop("reasons_json") or "[]")
        snap["promotions"].append(d)
    snap["runs"] = L.q("SELECT * FROM runs ORDER BY started_at")
    snap["recent_events"] = [{k: ev[k] for k in ("seq", "ts", "type", "namespace", "provenance_mode", "entity", "entity_id", "actor")}
                             | {"summary": _summ(ev)} for ev in events[-recent:]]
    snap["content_hash"] = sha256_text(canon({k: v for k, v in snap.items() if k != "generated_at"}))
    tmp = feed_dir / "snapshot.json.tmp"
    tmp.write_text(json.dumps(snap, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    os.replace(tmp, feed_dir / "snapshot.json")
    return snap


def _summ(ev):
    d = ev["data"]
    t = ev["type"]
    if t == "source.discovered":
        return d.get("title", "")[:90]
    if t in ("source.acquire_failed", "source.failed", "source.corrupt", "source.unsupported", "source.duplicate"):
        return (d.get("error") or "")[:120]
    if t == "source.integrity_ok":
        return f"sha256 {d.get('sha256', '')[:12]} · {d.get('page_count')} p"
    if t in ("source.extracted", "source.extract_partial"):
        return f"{d.get('pages_extracted')} pages · {', '.join(d.get('methods', []))}"
    if t == "claim.extracted":
        return f"{d.get('locator')} · {d.get('quantity')} → {d.get('param_key') or 'context'}"
    if t == "claim.reviewed":
        return f"{d.get('decision')} ({d.get('scope')}) by {d.get('reviewer')}"
    if t == "claim.classified":
        return d.get("eligibility")
    if t == "claim.conflict":
        return f"{d.get('param_key')} {d.get('values')}"
    if t.startswith("candidate."):
        return d.get("review_status") or d.get("reason", "")[:120]
    if t.startswith("promotion."):
        return f"{d.get('previous_model', '')} → {d.get('next_model', '')} " + "; ".join(d.get("reasons", []))[:140]
    if t == "pointer.set":
        return f"baseline = {d.get('baseline_model')}"
    if t == "source.inventory_parsed":
        return f"{d.get('files_linked')} files linked · NARA-published total {d.get('published_pages_total')} pages"
    if t == "source.metadata_verified":
        return f"{d.get('bytes')} bytes · {d.get('content_type')}"
    return d.get("label") or d.get("note") or ""
