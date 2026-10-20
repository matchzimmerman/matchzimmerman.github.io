"""Append-only, hash-chained event log + SQLite projection.

The JSONL log (ledger/events.jsonl) is the source of truth. The SQLite file
(data/state.sqlite) is a projection that can always be rebuilt by replaying the
log. Every state change in the system is an event; nothing writes the tables
directly. On open, the chain is verified and any events missing from the
projection (e.g. after a crash between log append and DB commit) are replayed.
"""
import hashlib
import json
import os
import sqlite3
import datetime as _dt
from pathlib import Path

SCHEMA_VERSION = 1
GENESIS = "0" * 64


def utcnow():
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha256_text(s):
    return sha256_bytes(s.encode("utf-8"))


SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS sources(
  source_id TEXT PRIMARY KEY, namespace TEXT, original_url TEXT, provider TEXT, title TEXT,
  original_date TEXT, release_date TEXT, retrieval_time TEXT, file_count INTEGER, page_count INTEGER,
  pages_extracted INTEGER DEFAULT 0, bytes INTEGER, content_type TEXT, rights TEXT, rights_basis TEXT,
  display_policy TEXT, sha256 TEXT, version INTEGER DEFAULT 1, ingestion_state TEXT, error TEXT,
  attempts INTEGER DEFAULT 0, next_attempt_at TEXT, record_kind TEXT, content_retained INTEGER DEFAULT 0,
  duplicate_of TEXT, discovered_at TEXT, updated_at TEXT, meta_json TEXT);
CREATE TABLE IF NOT EXISTS claims(
  claim_id TEXT PRIMARY KEY, namespace TEXT, source_id TEXT, locator TEXT, page INTEGER, line INTEGER,
  excerpt TEXT, excerpt_policy TEXT, quantity TEXT, normalized_value REAL, unit TEXT, param_key TEXT,
  time_ref TEXT, coordinate TEXT, confidence_band TEXT, extraction_method TEXT, review_state TEXT,
  reviewers_json TEXT, dependencies_json TEXT, contradiction_ids_json TEXT, eligibility TEXT,
  eligibility_reasons_json TEXT, status TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS models(
  model_id TEXT PRIMARY KEY, namespace TEXT, version TEXT, base_model TEXT, kind TEXT, status TEXT,
  validation TEXT, params_json TEXT, artifact_path TEXT, artifact_sha256 TEXT, output_hash TEXT,
  summary_json TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS candidates(
  candidate_id TEXT PRIMARY KEY, namespace TEXT, base_model TEXT, proposed_model TEXT,
  params_changed_json TEXT, evidence_claim_ids_json TEXT, evidence_manifest_hash TEXT, seed INTEGER,
  count INTEGER, code_commit TEXT, previous_snapshot_hash TEXT, review_status TEXT, tests_json TEXT,
  reason TEXT, diff_json TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS promotions(
  promotion_id TEXT PRIMARY KEY, namespace TEXT, kind TEXT, actor TEXT, authorization TEXT, ts TEXT,
  candidate_id TEXT, previous_model TEXT, next_model TEXT, diff_json TEXT, rollback_pointer TEXT,
  reasons_json TEXT);
CREATE TABLE IF NOT EXISTS pointers(namespace TEXT PRIMARY KEY, baseline_model TEXT, approval_label TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS display_events(seq INTEGER PRIMARY KEY, ts TEXT, kind TEXT, namespace TEXT, label TEXT, synthetic INTEGER);
CREATE TABLE IF NOT EXISTS runs(run_id TEXT PRIMARY KEY, started_at TEXT, ended_at TEXT, status TEXT, steps INTEGER, resumed INTEGER, meta_json TEXT);
"""

# event types that change a source's ingestion_state, and the state they set
STATE_EVENTS = {
    "source.discovered": "discovered",
    "source.acquire_started": "acquiring",
    "source.acquired": "acquired",
    "source.acquire_failed": "retry_wait",
    "source.failed": "failed",
    "source.metadata_verified": "metadata_only",
    "source.integrity_ok": "verified",
    "source.duplicate": "duplicate",
    "source.corrupt": "corrupt",
    "source.unsupported": "unsupported",
    "source.blocked": "blocked_rights",
    "source.extract_started": "extracting",
    "source.extracted": "extracted",
    "source.extract_partial": "extracted_partial",
    "source.extract_requeued": "partially_extracted",
    "source.normalized": "normalized",
    "source.claims_extracted": "claims_extracted",
    "source.classified": "classified",
}


class ChainError(Exception):
    pass


class Ledger:
    def __init__(self, root):
        self.root = Path(root)
        self.log_path = self.root / "ledger" / "events.jsonl"
        self.db_path = self.root / "data" / "state.sqlite"
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.last_seq = 0
        self.last_hash = GENESIS
        self.db = None
        self.on_append = None  # optional hook (crash simulation in tests)

    # ---------------------------------------------------------------- log
    def read_log(self):
        if not self.log_path.exists():
            return []
        out = []
        with open(self.log_path, "r", encoding="utf-8") as f:
            for n, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    # a torn final line (crash mid-write) is dropped and reported; anything else is fatal
                    rest = f.read().strip()
                    if rest:
                        raise ChainError(f"corrupt event at log line {n}")
                    self._torn_tail = n
        return out

    @staticmethod
    def event_hash(ev):
        body = {k: v for k, v in ev.items() if k != "hash"}
        return sha256_text(canon(body))

    def verify_chain(self, events=None):
        events = self.read_log() if events is None else events
        prev = GENESIS
        for i, ev in enumerate(events, 1):
            if ev.get("seq") != i:
                raise ChainError(f"sequence gap at {i}: found {ev.get('seq')}")
            if ev.get("prev_hash") != prev:
                raise ChainError(f"broken chain at seq {i}")
            if self.event_hash(ev) != ev.get("hash"):
                raise ChainError(f"hash mismatch at seq {i}")
            prev = ev["hash"]
        return len(events), prev

    # ---------------------------------------------------------------- open / rebuild
    def open(self):
        self._torn_tail = None
        events = self.read_log()
        if self._torn_tail:
            # rewrite log without the torn tail so appends stay valid JSONL
            with open(self.log_path, "w", encoding="utf-8") as f:
                for ev in events:
                    f.write(canon(ev) + "\n")
        n, h = self.verify_chain(events)
        self.last_seq, self.last_hash = n, h
        self.db = sqlite3.connect(self.db_path)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        row = self.db.execute("SELECT value FROM meta WHERE key='last_seq'").fetchone()
        db_seq = int(row["value"]) if row else 0
        replayed = 0
        if db_seq > n:
            # projection is ahead of the log: rebuild from scratch
            self.rebuild(events)
            replayed = n
        elif db_seq < n:
            for ev in events[db_seq:]:
                self._apply(ev)
                replayed += 1
            self._set_meta("last_seq", n)
            self.db.commit()
        return {"events": n, "replayed": replayed, "torn_tail_dropped": bool(self._torn_tail)}

    def rebuild(self, events=None):
        events = self.read_log() if events is None else events
        self.db.close()
        if self.db_path.exists():
            self.db_path.unlink()
        self.db = sqlite3.connect(self.db_path)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        for ev in events:
            self._apply(ev)
        self._set_meta("last_seq", len(events))
        self.db.commit()
        return len(events)

    def close(self):
        if self.db:
            self.db.commit()
            self.db.close()
            self.db = None

    def _set_meta(self, k, v):
        self.db.execute("INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)", (k, str(v)))

    # ---------------------------------------------------------------- append
    def append(self, etype, entity, entity_id, data=None, actor="MZ.Claude/engine", namespace="real", synthetic=None):
        if synthetic is None:
            synthetic = namespace == "demo"
        ev = {
            "seq": self.last_seq + 1,
            "event_id": f"ev-{self.last_seq + 1:07d}",
            "ts": utcnow(),
            "schema": SCHEMA_VERSION,
            "type": etype,
            "actor": actor,
            "namespace": namespace,
            "provenance_mode": "DEMO/SYNTHETIC" if synthetic else "REAL",
            "entity": entity,
            "entity_id": entity_id,
            "data": data or {},
            "prev_hash": self.last_hash,
        }
        ev["hash"] = self.event_hash(ev)
        line = canon(ev) + "\n"
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(line)
            f.flush()
            os.fsync(f.fileno())
        self.last_seq, self.last_hash = ev["seq"], ev["hash"]
        if self.on_append:
            self.on_append(ev, "logged")  # crash point: logged, not yet projected
        self._apply(ev)
        self._set_meta("last_seq", ev["seq"])
        self.db.commit()
        return ev

    # ---------------------------------------------------------------- projection
    def _apply(self, ev):
        t, d, eid, ns = ev["type"], ev["data"], ev["entity_id"], ev["namespace"]
        db = self.db
        ts = ev["ts"]
        if ev["entity"] == "source":
            if t == "source.discovered":
                db.execute(
                    """INSERT OR IGNORE INTO sources(source_id,namespace,original_url,provider,title,original_date,
                    release_date,rights,rights_basis,display_policy,record_kind,ingestion_state,discovered_at,updated_at,meta_json,file_count)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)""",
                    (eid, ns, d.get("original_url"), d.get("provider"), d.get("title"), d.get("original_date"),
                     d.get("release_date"), d.get("rights"), d.get("rights_basis"), d.get("display_policy"),
                     d.get("record_kind"), "discovered", ts, ts, canon(d.get("meta", {}))))
            fields = {}
            if t in STATE_EVENTS:
                fields["ingestion_state"] = STATE_EVENTS[t]
            for k in ("retrieval_time", "bytes", "content_type", "sha256", "page_count", "pages_extracted",
                      "duplicate_of", "error", "attempts", "next_attempt_at", "rights", "rights_basis",
                      "display_policy", "content_retained", "record_kind", "title"):
                if k in d and t != "source.discovered":
                    fields[k] = d[k]
            if t == "source.version_bumped":
                db.execute("UPDATE sources SET version=version+1 WHERE source_id=?", (eid,))
            if fields:
                fields["updated_at"] = ts
                sets = ",".join(f"{k}=?" for k in fields)
                db.execute(f"UPDATE sources SET {sets} WHERE source_id=?", (*fields.values(), eid))
        elif ev["entity"] == "claim":
            if t == "claim.extracted":
                db.execute(
                    """INSERT OR IGNORE INTO claims(claim_id,namespace,source_id,locator,page,line,excerpt,excerpt_policy,
                    quantity,normalized_value,unit,param_key,time_ref,coordinate,confidence_band,extraction_method,
                    review_state,reviewers_json,dependencies_json,contradiction_ids_json,eligibility,eligibility_reasons_json,
                    status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (eid, ns, d["source_id"], d.get("locator"), d.get("page"), d.get("line"), d.get("excerpt"),
                     d.get("excerpt_policy"), d.get("quantity"), d.get("normalized_value"), d.get("unit"),
                     d.get("param_key"), d.get("time_ref"), d.get("coordinate"), d.get("confidence_band"),
                     d.get("extraction_method"), "unreviewed", "[]", canon(d.get("dependencies", [])), "[]",
                     "unclassified", "[]", "active", ts, ts))
            elif t == "claim.reviewed":
                row = db.execute("SELECT reviewers_json FROM claims WHERE claim_id=?", (eid,)).fetchone()
                revs = json.loads(row["reviewers_json"]) if row else []
                revs.append({"reviewer": d["reviewer"], "decision": d["decision"], "scope": d.get("scope"),
                             "note": d.get("note"), "ts": ts, "event": ev["event_id"]})
                state = {"accept": "accepted_" + d.get("scope", "candidate"), "reject": "rejected",
                         "needs_human": "needs_human"}[d["decision"]]
                db.execute("UPDATE claims SET review_state=?, reviewers_json=?, updated_at=? WHERE claim_id=?",
                           (state, canon(revs), ts, eid))
                if d.get("confidence_band"):
                    db.execute("UPDATE claims SET confidence_band=? WHERE claim_id=?", (d["confidence_band"], eid))
            elif t == "claim.conflict":
                for cid in d["claim_ids"]:
                    row = db.execute("SELECT contradiction_ids_json FROM claims WHERE claim_id=?", (cid,)).fetchone()
                    if not row:
                        continue
                    cur = set(json.loads(row["contradiction_ids_json"]))
                    cur.update(x for x in d["claim_ids"] if x != cid)
                    db.execute("UPDATE claims SET contradiction_ids_json=?, updated_at=? WHERE claim_id=?",
                               (canon(sorted(cur)), ts, cid))
            elif t == "claim.classified":
                db.execute("UPDATE claims SET eligibility=?, eligibility_reasons_json=?, updated_at=? WHERE claim_id=?",
                           (d["eligibility"], canon(d.get("reasons", [])), ts, eid))
            elif t == "claim.linked":
                row = db.execute("SELECT dependencies_json FROM claims WHERE claim_id=?", (eid,)).fetchone()
                deps = json.loads(row["dependencies_json"]) if row else []
                for x in d.get("depends_on", []):
                    if x not in deps:
                        deps.append(x)
                db.execute("UPDATE claims SET dependencies_json=?, updated_at=? WHERE claim_id=?", (canon(deps), ts, eid))
            elif t in ("claim.retracted", "claim.superseded"):
                db.execute("UPDATE claims SET status=?, updated_at=? WHERE claim_id=?",
                           (t.split(".")[1], ts, eid))
        elif ev["entity"] == "model":
            if t == "model.registered":
                db.execute(
                    """INSERT OR REPLACE INTO models(model_id,namespace,version,base_model,kind,status,validation,params_json,
                    artifact_path,artifact_sha256,output_hash,summary_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (eid, ns, d["version"], d.get("base_model"), d["kind"], d["status"], d.get("validation"),
                     canon(d["params"]), d.get("artifact_path"), d.get("artifact_sha256"), d.get("output_hash"),
                     canon(d.get("summary", {})), ts))
            elif t == "model.status":
                db.execute("UPDATE models SET status=? WHERE model_id=?", (d["status"], eid))
        elif ev["entity"] == "candidate":
            if t == "candidate.proposed":
                db.execute(
                    """INSERT OR REPLACE INTO candidates(candidate_id,namespace,base_model,proposed_model,params_changed_json,
                    evidence_claim_ids_json,evidence_manifest_hash,seed,count,code_commit,previous_snapshot_hash,review_status,
                    tests_json,reason,diff_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (eid, ns, d["base_model"], d["proposed_model"], canon(d["params_changed"]),
                     canon(d["evidence_claim_ids"]), d["evidence_manifest_hash"], d["seed"], d["count"],
                     d.get("code_commit"), d.get("previous_snapshot_hash"), "proposed", "{}", d.get("reason"),
                     "{}", ts, ts))
            elif t == "candidate.tested":
                db.execute("UPDATE candidates SET tests_json=?, diff_json=?, review_status=?, updated_at=? WHERE candidate_id=?",
                           (canon(d["tests"]), canon(d["diff"]), d["review_status"], ts, eid))
            elif t == "candidate.status":
                db.execute("UPDATE candidates SET review_status=?, updated_at=? WHERE candidate_id=?",
                           (d["review_status"], ts, eid))
        elif ev["entity"] == "pointer":
            if t in ("pointer.set",):
                db.execute("INSERT OR REPLACE INTO pointers(namespace,baseline_model,approval_label,updated_at) VALUES(?,?,?,?)",
                           (ns, d["baseline_model"], d.get("approval_label"), ts))
        elif ev["entity"] == "promotion":
            db.execute(
                """INSERT OR REPLACE INTO promotions(promotion_id,namespace,kind,actor,authorization,ts,candidate_id,
                previous_model,next_model,diff_json,rollback_pointer,reasons_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, ns, t.split(".")[1], ev["actor"], d.get("authorization"), ts, d.get("candidate_id"),
                 d.get("previous_model"), d.get("next_model"), canon(d.get("diff", {})), d.get("rollback_pointer"),
                 canon(d.get("reasons", []))))
        elif ev["entity"] == "run":
            if t in ("run.started", "run.resumed"):
                db.execute("INSERT OR REPLACE INTO runs(run_id,started_at,status,steps,resumed,meta_json) VALUES(?,?,?,?,?,?)",
                           (eid, ts, "running", 0, 1 if t == "run.resumed" else 0, canon(d)))
            elif t == "run.ended":
                db.execute("UPDATE runs SET ended_at=?, status=?, steps=? WHERE run_id=?",
                           (ts, d.get("status", "ok"), d.get("steps", 0), eid))
            elif t == "run.interrupted":
                db.execute("UPDATE runs SET ended_at=?, status='interrupted' WHERE run_id=?", (ts, eid))
        if ev["entity"] == "display":
            db.execute("INSERT OR REPLACE INTO display_events(seq,ts,kind,namespace,label,synthetic) VALUES(?,?,?,?,?,?)",
                       (ev["seq"], ts, t, ns, d.get("label"), 1 if d.get("synthetic", True) else 0))

    # ---------------------------------------------------------------- helpers
    def q(self, sql, args=()):
        return [dict(r) for r in self.db.execute(sql, args).fetchall()]

    def one(self, sql, args=()):
        r = self.db.execute(sql, args).fetchone()
        return dict(r) if r else None
