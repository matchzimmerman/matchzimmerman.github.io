#!/usr/bin/env python3
"""THE LAST FLIGHT · research intake & model evolution engine (BUILD-001).

    python3 engine/lastflight.py init                 # ledger + baseline model registration
    python3 engine/lastflight.py discover --real --demo
    python3 engine/lastflight.py work [--max-steps N] [--ocr-budget N] [--metadata-limit N] [--crash-after N]
    python3 engine/lastflight.py review --claim ID --decision accept|reject|needs_human --scope candidate|science \
                                        --reviewer NAME --note TEXT [--i-am-mz-human]
    python3 engine/lastflight.py demo-review          # apply the DEMO reviewer decisions from the fixture manifest
    python3 engine/lastflight.py propose [--ns real|demo]
    python3 engine/lastflight.py approve --ns NS --candidate ID --actor NAME --authorization TEXT
    python3 engine/lastflight.py rollback --ns NS --actor NAME --authorization TEXT
    python3 engine/lastflight.py status | verify | export | rebuild

Everything is append-only: decisions are events, nothing is deleted.
"""
import argparse
import json
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lf.ledger import Ledger, utcnow  # noqa: E402
from lf import pipeline as P  # noqa: E402
from lf import models as M  # noqa: E402
from lf import feed as F  # noqa: E402
from lf import sources as S  # noqa: E402

ROOT = Path(os.environ.get("LF_ROOT", Path(__file__).resolve().parents[1]))


def open_ledger():
    L = Ledger(ROOT)
    info = L.open()
    if info["replayed"] or info["torn_tail_dropped"]:
        print(f"recovery: replayed {info['replayed']} events into projection; torn tail dropped={info['torn_tail_dropped']}")
    return L


def cmd_init(a):
    L = open_ledger()
    M.register_baselines(L)
    F.export(L, ROOT)
    print(f"ledger ok · {L.last_seq} events")


def cmd_discover(a):
    L = open_ledger()
    W = P.Worker(L, ROOT)
    n = 0
    if a.real:
        n += W.discover_real()
    if a.demo:
        n += W.discover_demo()
    F.export(L, ROOT)
    print(f"discovered {n} new sources")


def _start_run(L, a):
    # a run that never logged run.ended was interrupted (crash / kill / power loss)
    open_runs = L.q("SELECT run_id FROM runs WHERE status='running'")
    for r in open_runs:
        L.append("run.interrupted", "run", r["run_id"], {"note": "no run.ended recorded; detected at next start"})
    rid = "RUN-" + utcnow()[:19].replace(":", "").replace("-", "") + "-" + uuid.uuid4().hex[:4]
    L.append("run.resumed" if open_runs else "run.started", "run", rid,
             {"ocr_budget": a.ocr_budget, "metadata_limit": a.metadata_limit, "pid": os.getpid(),
              "interrupted_runs": [r["run_id"] for r in open_runs]})
    return rid


def cmd_work(a):
    L = open_ledger()
    if a.crash_after:
        count = {"n": 0}

        def hook(ev, phase):
            count["n"] += 1
            if count["n"] >= a.crash_after:
                print(f"SIMULATED CRASH after event {ev['seq']} ({ev['type']}) — logged but not projected", flush=True)
                os._exit(9)
        L.on_append = hook
    rid = _start_run(L, a)
    W = P.Worker(L, ROOT, ocr_budget=a.ocr_budget, metadata_limit=a.metadata_limit)
    steps = W.run(max_steps=a.max_steps)
    for ns in ("real", "demo"):
        P.classify_claims(L, ns)
    L.on_append = None
    L.append("run.ended", "run", rid, {"status": "ok", "steps": steps, "ocr_pages_used": W.ocr_used})
    F.export(L, ROOT)
    print(f"{rid}: {steps} steps · {L.last_seq} events")


def cmd_review(a):
    L = open_ledger()
    c = L.one("SELECT * FROM claims WHERE claim_id=?", (a.claim,))
    if not c:
        sys.exit(f"no claim {a.claim}")
    if a.reviewer == "MZ.Human" and not a.i_am_mz_human:
        sys.exit("refusing: reviewer MZ.Human may only be recorded by MZ.Human (pass --i-am-mz-human)")
    if a.decision == "accept" and a.scope == "science" and c["namespace"] == "real" and a.reviewer != "MZ.Human":
        sys.exit("refusing: science-scope acceptance of real evidence requires MZ.Human")
    L.append("claim.reviewed", "claim", a.claim, {"decision": a.decision, "scope": a.scope, "reviewer": a.reviewer,
                                                  "note": a.note, "confidence_band": a.band},
             actor=a.reviewer, namespace=c["namespace"])
    if a.depends_on:
        L.append("claim.linked", "claim", a.claim, {"depends_on": a.depends_on, "note": a.note},
                 actor=a.reviewer, namespace=c["namespace"])
    P.classify_claims(L, c["namespace"])
    F.export(L, ROOT)
    print("reviewed", a.claim, a.decision, a.scope)


def cmd_demo_review(a):
    L = open_ledger()
    man = {f["fixture_id"]: f for f in S.load_fixture_manifest(ROOT)["fixtures"]}
    n = 0
    for c in L.q("SELECT c.*, s.meta_json FROM claims c JOIN sources s ON s.source_id=c.source_id WHERE c.namespace='demo' "
                 "AND c.review_state='unreviewed'"):
        fid = json.loads(c["meta_json"]).get("fixture_id")
        rule = (man.get(fid) or {}).get("demo_review", {}).get(c["param_key"])
        if not rule:
            continue
        dec, scope, note = rule
        L.append("claim.reviewed", "claim", c["claim_id"], {"decision": dec, "scope": scope,
                                                           "reviewer": "DEMO-REVIEWER (synthetic)", "note": note},
                 actor="DEMO-REVIEWER (synthetic)", namespace="demo")
        n += 1
    P.classify_claims(L, "demo")
    F.export(L, ROOT)
    print(f"DEMO reviewer applied {n} decisions")


def cmd_propose(a):
    L = open_ledger()
    for ns in ([a.ns] if a.ns else ["real", "demo"]):
        P.classify_claims(L, ns)
        cid = M.propose(L, ns)
        print(ns, "→", cid or "no material change (baseline unchanged)")
    F.export(L, ROOT)


def cmd_approve(a):
    L = open_ledger()
    ok, info = M.approve(L, a.ns, a.candidate, a.actor, a.authorization)
    F.export(L, ROOT)
    print("APPROVED" if ok else "REFUSED", info)
    sys.exit(0 if ok else 3)


def cmd_rollback(a):
    L = open_ledger()
    ok, info = M.rollback(L, a.ns, a.actor, a.authorization)
    F.export(L, ROOT)
    print("ROLLED BACK" if ok else "REFUSED", info)
    sys.exit(0 if ok else 3)


def cmd_status(a):
    L = open_ledger()
    for ns in ("real", "demo"):
        c = F.counters(L, ns)
        p, base = M.baseline(L, ns)
        print(f"[{ns}] baseline {base['model_id']} · {p['approval_label']}")
        print("   ", json.dumps({k: c[k] for k in ("known_targets", "metadata_verified", "content_acquired", "parsed",
                                                  "pages_in_acquired_files", "pages_extracted", "claims", "claims_reviewed",
                                                  "claims_in_approved_baseline", "failed", "blocked", "duplicates", "corrupt",
                                                  "unsupported", "conflicts", "candidates")}))
        print("    states", c["by_state"])
        print("    eligibility", c["claims_by_eligibility"])


def cmd_verify(a):
    L = Ledger(ROOT)
    n, h = L.verify_chain()
    L.open()
    # projection consistency: rebuild into memory copy and compare table digests
    import sqlite3
    tables = ["sources", "claims", "models", "candidates", "promotions", "pointers"]

    def digest(db):
        out = {}
        for t in tables:
            rows = db.execute(f"SELECT * FROM {t} ORDER BY 1").fetchall()
            out[t] = len(rows), hash(tuple(tuple(r) for r in rows))
        return out
    live = digest(L.db)
    tmp = Ledger(ROOT)
    tmp.db_path = ROOT / "data" / "verify.sqlite"
    if tmp.db_path.exists():
        tmp.db_path.unlink()
    tmp.db = sqlite3.connect(tmp.db_path)
    tmp.db.row_factory = sqlite3.Row
    tmp.rebuild()
    rebuilt = digest(tmp.db)
    tmp.close()
    tmp.db_path.unlink()
    same = live == rebuilt
    print(f"chain ok · {n} events · head {h[:16]} · projection {'MATCHES' if same else 'DIFFERS FROM'} replay")
    for t in tables:
        print(f"   {t}: {live[t][0]} rows")
    sys.exit(0 if same else 4)


def cmd_export(a):
    L = open_ledger()
    s = F.export(L, ROOT)
    print("feed/snapshot.json", s["content_hash"][:16], s["ledger"]["events"], "events")


def cmd_rebuild(a):
    L = open_ledger()
    print("rebuilt projection from", L.rebuild(), "events")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("init").set_defaults(fn=cmd_init)
    d = sp.add_parser("discover")
    d.add_argument("--real", action="store_true")
    d.add_argument("--demo", action="store_true")
    d.set_defaults(fn=cmd_discover)
    w = sp.add_parser("work")
    w.add_argument("--max-steps", type=int)
    w.add_argument("--ocr-budget", type=int, default=12)
    w.add_argument("--metadata-limit", type=int)
    w.add_argument("--crash-after", type=int)
    w.set_defaults(fn=cmd_work)
    r = sp.add_parser("review")
    r.add_argument("--claim", required=True)
    r.add_argument("--decision", choices=["accept", "reject", "needs_human"], required=True)
    r.add_argument("--scope", choices=["candidate", "science"], default="candidate")
    r.add_argument("--reviewer", required=True)
    r.add_argument("--note", required=True)
    r.add_argument("--band", choices=["Known", "Strongly Supported", "Inferred", "Speculative"])
    r.add_argument("--depends-on", nargs="*")
    r.add_argument("--i-am-mz-human", action="store_true")
    r.set_defaults(fn=cmd_review)
    sp.add_parser("demo-review").set_defaults(fn=cmd_demo_review)
    p = sp.add_parser("propose")
    p.add_argument("--ns", choices=["real", "demo"])
    p.set_defaults(fn=cmd_propose)
    for name, fn in (("approve", cmd_approve), ("rollback", cmd_rollback)):
        x = sp.add_parser(name)
        x.add_argument("--ns", choices=["real", "demo"], required=True)
        if name == "approve":
            x.add_argument("--candidate", required=True)
        x.add_argument("--actor", required=True)
        x.add_argument("--authorization", required=True)
        x.set_defaults(fn=fn)
    for name, fn in (("status", cmd_status), ("verify", cmd_verify), ("export", cmd_export), ("rebuild", cmd_rebuild)):
        sp.add_parser(name).set_defaults(fn=fn)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
