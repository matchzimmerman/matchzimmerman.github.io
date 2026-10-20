"""Ingest worker: finite-state source pipeline.

discover → acquire → integrity → extract → normalize → claims → classify
plus aside states: metadata_only, retry_wait, failed, duplicate, corrupt,
unsupported, blocked_rights, partially_extracted.

Each step performs one transition and records it as events. Steps are
idempotent: a source left mid-stage by a crash is resumed from its recorded
state (its *_started event), re-doing work whose outputs are content-addressed.
"""
import datetime as dt
import json
import shutil
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import claims as C
from . import sources as S
from .ledger import sha256_bytes, sha256_text, utcnow, canon

MAX_ATTEMPTS = 4
SUPPORTED = {"application/pdf", "text/plain", "text/html"}


def _now():
    return dt.datetime.now(dt.timezone.utc)


def _iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class Worker:
    def __init__(self, ledger, root, ocr_budget=12, metadata_limit=None, backoff_base=2.0, demo_backoff=0.2,
                 log=print):
        self.L = ledger
        self.root = Path(root)
        self.raw = self.root / "data" / "raw"
        self.text = self.root / "data" / "text"
        self.ocr_budget = ocr_budget          # OCR pages allowed per run (resource bound)
        self.ocr_used = 0
        self.metadata_limit = metadata_limit
        self.backoff_base = backoff_base
        self.demo_backoff = demo_backoff
        self.log = log
        self._fixtures = None

    # ------------------------------------------------------------------ helpers
    def ev(self, etype, sid, data=None, ns="real", entity="source", actor="MZ.Claude/engine"):
        return self.L.append(etype, entity, sid, data or {}, actor=actor, namespace=ns)

    def src(self, sid):
        return self.L.one("SELECT * FROM sources WHERE source_id=?", (sid,))

    def meta(self, s):
        return json.loads(s.get("meta_json") or "{}")

    def fixtures(self):
        if self._fixtures is None:
            self._fixtures = {f["fixture_id"]: f for f in S.load_fixture_manifest(self.root)["fixtures"]}
        return self._fixtures

    # ------------------------------------------------------------------ discovery
    def discover_real(self):
        """NARA release portal (inventory) + the two Lae accounts. Returns counts."""
        n_new = 0
        portal_id = "SRC-NARA-RELEASE-PORTAL"
        if not self.src(portal_id):
            self.ev("source.discovered", portal_id, {
                "original_url": S.NARA_PORTAL, "provider": "U.S. National Archives (NARA)",
                "title": "Amelia Earhart records release portal (inventory page)",
                "original_date": None, "release_date": "2025-11-14/2026-01-09",
                "rights": "U.S. FEDERAL WEBSITE · public information", "rights_basis": "NARA web page",
                "display_policy": "metadata + counts", "record_kind": "release inventory (discovery corpus)",
                "meta": {"role": "inventory", "acquire_content": True}})
            n_new += 1
        for a in S.LAE_ACCOUNTS:
            if not self.src(a["source_id"]):
                self.ev("source.discovered", a["source_id"], {
                    "original_url": a["original_url"], "provider": a["provider"], "title": a["title"],
                    "original_date": a["original_date"], "release_date": None,
                    "rights": "THIRD-PARTY TRANSCRIPTION · copyright TIGHAR/holders; facsimile not yet located",
                    "rights_basis": "HDD rights note: link, do not mirror",
                    "display_policy": "link-only", "record_kind": "contemporary account (transcription)",
                    "meta": {"acquire_content": True, "retain": False, "hdd_ref": a["hdd_ref"]}})
                n_new += 1
        return n_new

    def discover_demo(self):
        n_new = 0
        for f in self.fixtures().values():
            sid = "DEMO-" + f["fixture_id"]
            if self.src(sid):
                continue
            self.ev("source.discovered", sid, {
                "original_url": f.get("original_url"), "provider": "DEMO FIXTURE (synthetic)",
                "title": "DEMO · " + f["title"], "original_date": f.get("original_date"), "release_date": None,
                "rights": f.get("rights", "DEMO / SYNTHETIC — authored test fixture"),
                "rights_basis": "authored by MZ.Claude for BUILD-001 tests",
                "display_policy": f.get("display_policy", "short-excerpt-after-review"),
                "record_kind": "DEMO fixture",
                "meta": {"fixture_id": f["fixture_id"], "file": f.get("file"), "acquire_content": True,
                         "fail_first_n": f.get("fail_first_n", 0), "expect": f.get("expect")}}, ns="demo")
            n_new += 1
        return n_new

    # ------------------------------------------------------------------ queue
    ACTIVE = ("discovered", "acquiring", "acquired", "retry_wait", "verified", "extracting", "extracted",
              "extracted_partial", "partially_extracted", "normalized", "claims_extracted")

    def actionable(self):
        now = _iso(_now())
        rows = self.L.q(f"SELECT * FROM sources WHERE ingestion_state IN ({','.join('?' * len(self.ACTIVE))}) "
                        "ORDER BY namespace DESC, discovered_at, source_id", self.ACTIVE)
        out = []
        for r in rows:
            if r["ingestion_state"] == "retry_wait" and (r["next_attempt_at"] or "") > now:
                continue
            if r["ingestion_state"] == "partially_extracted" and self.ocr_used >= self.ocr_budget:
                continue
            out.append(r)
        return out

    def step(self):
        """Perform one transition. Returns True if work was done."""
        rows = self.actionable()
        if not rows:
            return False
        # batch metadata-only real targets (bounded concurrency HEAD requests)
        meta_rows = [r for r in rows if r["ingestion_state"] == "discovered" and not self.meta(r).get("acquire_content")]
        if meta_rows:
            if self.metadata_limit is not None:
                done = self.L.one("SELECT COUNT(*) n FROM sources WHERE ingestion_state='metadata_only'")["n"]
                meta_rows = meta_rows[:max(0, self.metadata_limit - done)]
            if meta_rows:
                return self.metadata_batch(meta_rows[:8])
            rows = [r for r in rows if not (r["ingestion_state"] == "discovered" and not self.meta(r).get("acquire_content"))]
            if not rows:
                return False
        r = rows[0]
        st = r["ingestion_state"]
        fn = {
            "discovered": self.acquire, "acquiring": self.acquire, "retry_wait": self.acquire,
            "acquired": self.integrity, "verified": self.extract, "extracting": self.extract,
            "partially_extracted": self.extract, "extracted": self.normalize, "extracted_partial": self.normalize,
            "normalized": self.claims,
            "claims_extracted": self.classify,
        }[st]
        if st in ("acquiring", "extracting"):
            self.ev("source.stage_resumed", r["source_id"], {"stage": st, "reason": "found mid-stage at start (previous process stopped)"},
                    ns=r["namespace"])
        fn(r)
        return True

    # ------------------------------------------------------------------ metadata (HEAD)
    def metadata_batch(self, rows):
        def head(r):
            try:
                st, h, _ = S.curl(r["original_url"], head=True, timeout=30)
                return r, h, None
            except S.FetchError as e:
                return r, None, e
        with ThreadPoolExecutor(max_workers=2) as ex:
            results = list(ex.map(head, rows))
        for r, h, err in results:
            sid = r["source_id"]
            if err:
                att = (r["attempts"] or 0) + 1
                if att >= MAX_ATTEMPTS or not err.transient:
                    self.ev("source.failed", sid, {"error": f"metadata HEAD: {err}", "attempts": att})
                else:
                    nxt = _iso(_now() + dt.timedelta(seconds=self.backoff_base ** att))
                    self.ev("source.metadata_retry", sid, {"error": str(err), "attempts": att, "next_attempt_at": nxt})
                continue
            self.ev("source.metadata_verified", sid, {
                "retrieval_time": utcnow(), "bytes": int(h.get("content-length") or 0) or None,
                "content_type": (h.get("content-type") or "").split(";")[0] or None,
                "error": None,
                "last_modified": h.get("last-modified"),
                "note": "metadata only: content not acquired in BUILD-001 (resource budget); pages unknown until inspected"})
        return True

    # ------------------------------------------------------------------ acquire
    def acquire(self, r):
        sid, ns, m = r["source_id"], r["namespace"], self.meta(r)
        if r["display_policy"] == "blocked":
            self.ev("source.blocked", sid, {"error": None, "reason": "rights restrict acquisition; metadata recorded only",
                                             "content_retained": 0}, ns=ns)
            return
        att = (r["attempts"] or 0) + 1
        self.ev("source.acquire_started", sid, {"attempts": att}, ns=ns)
        dest_dir = self.raw / sid
        dest_dir.mkdir(parents=True, exist_ok=True)
        try:
            if ns == "demo":
                f = self.fixtures()[m["fixture_id"]]
                if att <= f.get("fail_first_n", 0):
                    raise S.FetchError(f"DEMO simulated transient failure {att}/{f['fail_first_n']} (authored)", transient=True)
                srcf = self.root / "fixtures" / "demo" / f["file"]
                dest = dest_dir / f["file"]
                shutil.copyfile(srcf, dest)
                ctype = f.get("content_type") or "text/plain"
            else:
                name = Path(r["original_url"]).name or "index.html"
                if not Path(name).suffix:
                    name += ".html"
                dest = dest_dir / name
                st, h, _ = S.curl(r["original_url"], out_path=dest, timeout=600)
                ctype = (h.get("content-type") or "").split(";")[0] or "application/octet-stream"
        except S.FetchError as e:
            if att >= MAX_ATTEMPTS or not e.transient:
                self.ev("source.failed", sid, {"error": str(e), "attempts": att}, ns=ns)
            else:
                base = self.demo_backoff if ns == "demo" else self.backoff_base
                nxt = _iso(_now() + dt.timedelta(seconds=base * (2 ** (att - 1))))
                self.ev("source.acquire_failed", sid, {"error": str(e), "attempts": att, "next_attempt_at": nxt}, ns=ns)
            return
        data = dest.read_bytes()
        self.ev("source.acquired", sid, {
            "retrieval_time": utcnow(), "bytes": len(data), "content_type": ctype, "error": None,
            "attempts": att, "content_retained": 0 if m.get("retain") is False else 1,
            "local_cache": "data/raw (gitignored; never published)"}, ns=ns)

    def _local(self, sid):
        d = self.raw / sid
        files = sorted(p for p in d.iterdir() if p.is_file()) if d.exists() else []
        return files[0] if files else None

    # ------------------------------------------------------------------ integrity
    def integrity(self, r):
        sid, ns = r["source_id"], r["namespace"]
        p = self._local(sid)
        if p is None:
            self.ev("source.acquire_failed", sid, {"error": "local cache missing; re-acquiring", "attempts": r["attempts"] or 0,
                                                     "next_attempt_at": utcnow()}, ns=ns)
            return
        data = p.read_bytes()
        digest = sha256_bytes(data)
        dup = self.L.one("SELECT source_id FROM sources WHERE namespace=? AND sha256=? AND source_id<>? "
                         "AND ingestion_state NOT IN ('duplicate')", (ns, digest, sid))
        if dup:
            self.ev("source.duplicate", sid, {"sha256": digest, "duplicate_of": dup["source_id"],
                                               "error": f"byte-identical to {dup['source_id']}"}, ns=ns)
            return
        ctype = r["content_type"] or ""
        kind = self._sniff(data, p.name, ctype)
        if kind == "unsupported":
            self.ev("source.unsupported", sid, {"sha256": digest, "error": f"unsupported type ({ctype or p.suffix})"}, ns=ns)
            return
        pages = 1
        if kind == "pdf":
            ok, pages, why = self._pdf_check(p)
            if not ok:
                self.ev("source.corrupt", sid, {"sha256": digest, "error": f"PDF integrity failed: {why}"}, ns=ns)
                return
        self.ev("source.integrity_ok", sid, {"sha256": digest, "page_count": pages, "content_type":
                                              {"pdf": "application/pdf", "html": "text/html", "text": "text/plain"}[kind]}, ns=ns)

    @staticmethod
    def _sniff(data, name, ctype):
        if data[:5] == b"%PDF-":
            return "pdf"
        if name.lower().endswith(".pdf") or ctype == "application/pdf":
            return "pdf"  # claims to be a PDF; integrity check decides
        if ctype in ("text/html",) or name.lower().endswith((".html", ".htm")):
            return "html"
        if ctype == "text/plain" or name.lower().endswith(".txt"):
            try:
                data.decode("utf-8")
                return "text"
            except UnicodeDecodeError:
                return "unsupported"
        return "unsupported"

    @staticmethod
    def _pdf_check(p):
        try:
            out = subprocess.run(["pdfinfo", str(p)], capture_output=True, text=True, timeout=60)
            if out.returncode != 0:
                return False, 0, out.stderr.strip()[:160] or "pdfinfo failed"
            pages = 0
            for ln in out.stdout.splitlines():
                if ln.startswith("Pages:"):
                    pages = int(ln.split()[1])
            if pages < 1:
                return False, 0, "no pages"
            tail = p.read_bytes()[-2048:]
            if b"%%EOF" not in tail:
                return False, pages, "missing %%EOF trailer (truncated?)"
            return True, pages, None
        except Exception as e:  # noqa
            return False, 0, str(e)[:160]

    # ------------------------------------------------------------------ extract
    def extract(self, r):
        sid, ns = r["source_id"], r["namespace"]
        p = self._local(sid)
        out_dir = self.text / sid
        out_dir.mkdir(parents=True, exist_ok=True)
        if r["ingestion_state"] != "extracting":
            self.ev("source.extract_started", sid, {"pages_extracted": r["pages_extracted"] or 0}, ns=ns)
        if p is None:
            self.ev("source.acquire_failed", sid, {"error": "local cache missing before extraction", "attempts": r["attempts"] or 0,
                                                     "next_attempt_at": utcnow()}, ns=ns)
            return
        ctype = r["content_type"]
        methods = {}
        if ctype == "application/pdf":
            total = r["page_count"] or 0
            done = r["pages_extracted"] or 0
            pg = done
            while pg < total:
                n = pg + 1
                txt_p = out_dir / f"p{n:04d}.txt"
                if not txt_p.exists():
                    t = subprocess.run(["pdftotext", "-layout", "-f", str(n), "-l", str(n), str(p), "-"],
                                       capture_output=True, timeout=120).stdout.decode("utf-8", errors="replace")
                    method = "pdf-embedded-text-layer (publisher OCR, unverified)"
                    if len(t.strip()) < 40:
                        if self.ocr_used >= self.ocr_budget:
                            break
                        t = self._ocr_page(p, n, out_dir)
                        method = "tesseract-ocr-200dpi"
                        self.ocr_used += 1
                    txt_p.write_text(t, encoding="utf-8")
                    (out_dir / f"p{n:04d}.method").write_text(method)
                methods[n] = (out_dir / f"p{n:04d}.method").read_text()
                pg = n
            pages_done = pg
            mset = sorted(set(methods.values()))
            if pages_done >= total:
                self.ev("source.extracted", sid, {"pages_extracted": pages_done, "methods": mset}, ns=ns)
            else:
                self.ev("source.extract_partial", sid, {
                    "pages_extracted": pages_done, "methods": mset,
                    "note": f"OCR budget {self.ocr_budget} pages/run reached; resumes next run"}, ns=ns)
        else:
            raw = p.read_bytes()
            if ctype == "text/html":
                lines = S.html_to_lines(raw)
                method = "html-text"
            else:
                lines = raw.decode("utf-8", errors="replace").split("\n")
                method = "plain-text"
            (out_dir / "p0001.txt").write_text("\n".join(lines), encoding="utf-8")
            (out_dir / "p0001.method").write_text(method)
            self.ev("source.extracted", sid, {"pages_extracted": 1, "methods": [method]}, ns=ns)

    @staticmethod
    def _ocr_page(pdf, n, out_dir):
        stem = out_dir / f"ocr{n:04d}"
        subprocess.run(["pdftoppm", "-r", "200", "-gray", "-f", str(n), "-l", str(n), "-png", str(pdf), str(stem)],
                       capture_output=True, timeout=180)
        pngs = sorted(out_dir.glob(f"ocr{n:04d}*.png"))
        if not pngs:
            return ""
        t = subprocess.run(["tesseract", str(pngs[0]), "-", "--psm", "6"], capture_output=True, timeout=300).stdout.decode(
            "utf-8", errors="replace")
        for x in pngs:
            x.unlink()
        return t

    # ------------------------------------------------------------------ normalize
    def normalize(self, r):
        sid, ns = r["source_id"], r["namespace"]
        d = self.text / sid
        h = []
        n_lines = 0
        for tp in sorted(d.glob("p*.txt")):
            lines = C.normalize_lines(tp.read_text(encoding="utf-8"))
            (d / (tp.stem + ".norm")).write_text("\n".join(lines), encoding="utf-8")
            h.append(sha256_text("\n".join(lines)))
            n_lines += len(lines)
        self.ev("source.normalized", sid, {
            "normalized_text_sha256": sha256_text("".join(h)), "lines": n_lines,
            "rules": "whitespace collapsed; original spelling, units and time notation retained; units normalized per claim"},
            ns=ns)

    # ------------------------------------------------------------------ claims
    def claims(self, r):
        sid, ns = r["source_id"], r["namespace"]
        d = self.text / sid
        pol = r["display_policy"] or "short-excerpt-after-review"
        if pol not in ("link-only", "metadata-only"):
            pol = "short excerpt (≤160 chars) · " + pol
        new = 0
        if sid == "SRC-NARA-RELEASE-PORTAL":
            new += self._portal_inventory(sid)
        else:
            for npth in sorted(d.glob("p*.norm")):
                page = int(npth.stem[1:])
                method = (d / f"p{page:04d}.method").read_text() if (d / f"p{page:04d}.method").exists() else "text"
                lines = npth.read_text(encoding="utf-8").split("\n")
                for c in C.extract_from_lines(sid, page, lines, "regex-v1 over " + method, pol):
                    if self.L.one("SELECT 1 FROM claims WHERE claim_id=?", (c["claim_id"],)):
                        continue
                    self.L.append("claim.extracted", "claim", c["claim_id"], c, namespace=ns)
                    new += 1
        self.ev("source.claims_extracted", sid, {"new_claims": new}, ns=ns)
        meta = self.meta(r)
        if meta.get("retain") is False:
            shutil.rmtree(self.raw / sid, ignore_errors=True)
            shutil.rmtree(self.text / sid, ignore_errors=True)
            self.ev("source.content_discarded", sid, {"content_retained": 0,
                                                       "reason": "third-party content: hashed + located, not retained"}, ns=ns)

    def _portal_inventory(self, sid):
        """The portal page discovers the real release files (a discovery corpus, not ingested records)."""
        page_html = (self.text / sid / "p0001.txt")
        raw = self._local(sid).read_bytes().decode("utf-8", errors="replace")
        files, summaries = S.parse_nara_portal(raw)
        added = 0
        for f in files:
            fsid = S.nara_source_id(f["url"])
            if self.src(fsid):
                continue
            cls = S.classify_nara_file(f["filename"])
            acquire = f["filename"] in TARGETED_CONTENT
            self.ev("source.discovered", fsid, {
                "original_url": f["url"], "provider": "U.S. National Archives (NARA) · Earhart release",
                "title": f["filename"], "original_date": None, "release_date": f["release_date"],
                "rights": cls["rights"], "rights_basis": cls["rights_basis"], "display_policy": cls["display_policy"],
                "record_kind": cls["record_kind"],
                "meta": {"record_group": cls["record_group"], "content_type_guess": cls["content_type_guess"],
                         "acquire_content": acquire, "discovered_via": sid}})
            added += 1
        ids = {S.nara_source_id(f["url"]) for f in files}
        assert len(ids) == len(files), "source-id collision in portal inventory"
        self.ev("source.inventory_parsed", sid, {
            "files_linked": len(files), "unique_source_ids": len(ids), "release_summaries": summaries,
            "published_pages_total": sum(s["pages"] for s in summaries),
            "note": "published page totals are NARA's figures; files linked are hrefs counted on the page"})
        return 0

    # ------------------------------------------------------------------ classify
    def classify(self, r):
        sid, ns = r["source_id"], r["namespace"]
        n = classify_claims(self.L, ns)
        cl = self.L.q("SELECT eligibility, COUNT(*) n FROM claims WHERE source_id=? GROUP BY eligibility", (sid,))
        r2 = self.src(sid)
        if r2["page_count"] and (r2["pages_extracted"] or 0) < r2["page_count"]:
            # extracted pages have flowed through normalize → claims; remaining pages wait for OCR budget
            self.ev("source.extract_requeued", sid, {
                "pages_extracted": r2["pages_extracted"], "page_count": r2["page_count"],
                "claims_by_eligibility": {c["eligibility"]: c["n"] for c in cl},
                "note": "remaining pages queued for the next run's OCR budget"}, ns=ns)
            return
        self.ev("source.classified", sid, {"claims_by_eligibility": {c["eligibility"]: c["n"] for c in cl}}, ns=ns)

    def run(self, max_steps=None, crash_after=None):
        steps = 0
        while True:
            if max_steps is not None and steps >= max_steps:
                break
            if not self.step():
                # wait briefly for retry_wait items whose backoff is short
                pend = self.L.one("SELECT MIN(next_attempt_at) t FROM sources WHERE ingestion_state='retry_wait'")
                if pend and pend["t"]:
                    wait = (dt.datetime.strptime(pend["t"], "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=dt.timezone.utc) - _now()).total_seconds()
                    if wait < 20:
                        time.sleep(max(0.0, wait) + 0.05)
                        continue
                break
            steps += 1
        return steps


# the two 1937 Navy/Coast Guard search-report files acquired in full for BUILD-001
TARGETED_CONTENT = {
    "080_PC31-22_146_07_Report_of_Earhart_Search_by_U.S._Navy_and_U.S._Coast_Guard_July_2_18_1937.pdf",
    "080_PC31-22_146_08_Report_of_Earhart_Search_by_U.S._Navy_and_U.S._Coast_Guard_July_2_18_1937.pdf",
}


# ---------------------------------------------------------------------- claim classification
def classify_claims(L, ns):
    """Model-eligibility classification. Emits claim.conflict / claim.classified only on change."""
    rows = L.q("SELECT c.*, s.original_url, s.sha256 AS src_sha, s.display_policy FROM claims c "
               "JOIN sources s ON s.source_id=c.source_id WHERE c.namespace=? AND c.status='active'", (ns,))
    # conflicts: same param, values outside tolerance, among non-rejected claims
    byp = {}
    for c in rows:
        if c["param_key"] in C.PARAMS and c["normalized_value"] is not None and c["unit"] and c["review_state"] != "rejected":
            byp.setdefault(c["param_key"], []).append(c)
    for pk, cs in byp.items():
        tol = C.PARAMS[pk]["tolerance"]
        for i in range(len(cs)):
            for j in range(i + 1, len(cs)):
                a, b = cs[i], cs[j]
                if abs(a["normalized_value"] - b["normalized_value"]) > tol * max(a["normalized_value"], b["normalized_value"]):
                    if b["claim_id"] not in json.loads(a["contradiction_ids_json"]):
                        L.append("claim.conflict", "claim", f"{a['claim_id']}|{b['claim_id']}", {
                            "claim_ids": [a["claim_id"], b["claim_id"]], "param_key": pk,
                            "values": [a["normalized_value"], b["normalized_value"]],
                            "note": f"differ by more than {tol:.0%}"}, namespace=ns)
    rows = {c["claim_id"]: c for c in L.q("SELECT c.*, s.original_url, s.sha256 AS src_sha FROM claims c JOIN sources s ON "
                                         "s.source_id=c.source_id WHERE c.namespace=? AND c.status='active'", (ns,))}
    changed = 0
    for cid, c in rows.items():
        reasons = []
        if not c["param_key"] or c["param_key"] not in C.PARAMS:
            elig = "display-only"
            reasons.append("context observation; no mapped model parameter")
        elif not c["original_url"]:
            elig = "ineligible"
            reasons.append("untraceable: source has no original URI/provenance")
        elif not c["unit"]:
            elig = "ineligible"
            reasons.append("ambiguous: unit missing")
        elif c["review_state"] == "rejected":
            elig = "rejected"
            reasons.append("rejected in review")
        else:
            open_conf = [x for x in json.loads(c["contradiction_ids_json"])
                         if x in rows and rows[x]["review_state"] != "rejected"]
            if open_conf:
                elig = "blocked"
                reasons.append("unresolved contradiction with " + ", ".join(open_conf))
            elif c["review_state"] == "accepted_science":
                elig = "eligible-science"
                reasons.append("accepted for scientific promotion")
            elif c["review_state"] == "accepted_candidate":
                elig = "eligible-candidate"
                reasons.append("accepted for candidate preview only")
            elif c["review_state"] == "needs_human":
                elig = "pending-review"
                reasons.append("flagged for MZ.Human")
            else:
                elig = "pending-review"
                reasons.append("unreviewed")
        if elig != c["eligibility"] or canon(reasons) != c["eligibility_reasons_json"]:
            L.append("claim.classified", "claim", cid, {"eligibility": elig, "reasons": reasons}, namespace=ns)
            changed += 1
    return changed
