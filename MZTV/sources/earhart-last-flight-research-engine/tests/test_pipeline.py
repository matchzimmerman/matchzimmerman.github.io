#!/usr/bin/env python3
"""BUILD-001 acceptance tests for the ingest / promotion engine (DEMO sandboxes only).

Run: python3 tests/test_pipeline.py -v
Every test works in a throwaway LF_ROOT; the committed ledger is never touched.
"""
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[1]
CLI = [sys.executable, str(ENGINE / "engine" / "lastflight.py")]
sys.path.insert(0, str(ENGINE / "engine"))
from lf.ledger import Ledger, ChainError  # noqa: E402


def sandbox(volume=0):
    d = Path(tempfile.mkdtemp(prefix="lf-test-"))
    env = dict(os.environ, LF_ROOT=str(d))
    subprocess.run([sys.executable, str(ENGINE / "engine" / "make_fixtures.py")] + (["--volume", str(volume)] if volume else []),
                   env=env, check=True, capture_output=True)
    return d, env


def cli(env, *args, check=True):
    p = subprocess.run(CLI + list(args), env=env, capture_output=True, text=True)
    if check and p.returncode != 0:
        raise AssertionError(f"{args} failed ({p.returncode}): {p.stdout}\n{p.stderr}")
    return p


def snap(root):
    return json.loads((root / "feed" / "snapshot.json").read_text())


def states(root):
    return {s["source_id"]: s["ingestion_state"] for s in snap(root)["sources"]}


class Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root, cls.env = sandbox()
        cli(cls.env, "init")
        cli(cls.env, "discover", "--demo")
        cli(cls.env, "work")
        cls.s = snap(cls.root)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.root, ignore_errors=True)

    def test_20_fixtures_reach_distinct_terminal_states(self):
        st = states(self.root)
        self.assertEqual(len(st), 20)
        self.assertEqual(st["DEMO-D08"], "duplicate")
        self.assertEqual(st["DEMO-D09"], "corrupt")
        self.assertEqual(st["DEMO-D10"], "unsupported")
        self.assertEqual(st["DEMO-D12"], "blocked_rights")
        self.assertEqual(sum(1 for v in st.values() if v == "classified"), 16)

    def test_counters_have_denominators(self):
        c = self.s["namespaces"]["demo"]["counters"]
        self.assertEqual(c["known_targets"], 20)
        self.assertEqual(c["content_acquired"], 19)          # D12 blocked before acquisition
        self.assertEqual(c["duplicates"], 1)
        self.assertEqual(c["corrupt"], 1)
        self.assertEqual(c["unsupported"], 1)
        self.assertEqual(c["blocked"], 1)
        self.assertEqual(self.s["namespaces"]["demo"]["acquire_failures_logged"], 2)  # D11 failed twice
        self.assertGreaterEqual(c["pages_extracted"], 17)
        self.assertEqual(self.s["namespaces"]["real"]["counters"]["known_targets"], 0)  # namespaces never mix

    def test_retry_then_success(self):
        d11 = next(s for s in self.s["sources"] if s["source_id"] == "DEMO-D11")
        self.assertEqual(d11["attempts"], 3)
        self.assertEqual(d11["ingestion_state"], "classified")

    def test_conflict_ambiguity_untraceable(self):
        cl = {c["claim_id"]: c for c in self.s["claims"]}
        fuel = [c for c in cl.values() if c["param_key"] == "fuelStart"]
        self.assertEqual(sorted(c["normalized_value"] for c in fuel), [950.0, 1100.0])
        self.assertTrue(all(c["eligibility"] == "blocked" and c["contradiction_ids"] for c in fuel))
        amb = [c for c in cl.values() if c["source_id"] == "DEMO-D13" and c["param_key"] == "burn"]
        self.assertTrue(amb and amb[0]["eligibility"] == "ineligible" and "ambiguous" in amb[0]["eligibility_reasons"][0])
        unt = [c for c in cl.values() if c["source_id"] == "DEMO-D14" and c["param_key"] == "burn"]
        self.assertTrue(unt and unt[0]["eligibility"] == "ineligible" and "untraceable" in unt[0]["eligibility_reasons"][0])

    def test_every_claim_traces_to_source_and_locator(self):
        srcs = {s["source_id"] for s in self.s["sources"]}
        for c in self.s["claims"]:
            self.assertIn(c["source_id"], srcs)
            self.assertRegex(c["locator"], r"^p\d+:l\d+$")

    def test_chain_and_projection(self):
        p = cli(self.env, "verify")
        self.assertIn("MATCHES", p.stdout)


class Promotion(unittest.TestCase):
    def setUp(self):
        self.root, self.env = sandbox()
        for a in (["init"], ["discover", "--demo"], ["work"]):
            cli(self.env, *a)

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def test_unreviewed_claims_never_propose_or_promote(self):
        cli(self.env, "propose")
        s = snap(self.root)
        self.assertEqual(s["candidates"], [])
        self.assertEqual(s["namespaces"]["demo"]["pointer"]["baseline_model"], "DEMO/LF-0.1.0")

    def test_candidate_scope_cannot_promote(self):
        s = snap(self.root)
        for c in s["claims"]:
            if c["source_id"] in ("DEMO-DEMO-D03", "DEMO-D03", "DEMO-D05", "DEMO-D06") and c["param_key"] == "airspeed":
                dec = "reject" if c["source_id"] == "DEMO-D06" else "accept"
                cli(self.env, "review", "--claim", c["claim_id"], "--decision", dec, "--scope", "candidate",
                    "--reviewer", "DEMO-REVIEWER (synthetic)", "--note", "test")
        cli(self.env, "propose", "--ns", "demo")
        s = snap(self.root)
        self.assertEqual(len(s["candidates"]), 1)
        cand = s["candidates"][0]
        self.assertTrue(cand["tests"]["passed"])
        p = cli(self.env, "approve", "--ns", "demo", "--candidate", cand["candidate_id"], "--actor", "TEST-HARNESS",
                "--authorization", "controlled test", check=False)
        self.assertEqual(p.returncode, 3)
        self.assertIn("not accepted at science scope", p.stdout)
        self.assertEqual(snap(self.root)["namespaces"]["demo"]["pointer"]["baseline_model"], "DEMO/LF-0.1.0")

    def test_rejected_claim_does_not_mutate(self):
        cli(self.env, "demo-review")      # D06 (175 kt) rejected; D03/D05 accepted
        cli(self.env, "propose", "--ns", "demo")
        cand = snap(self.root)["candidates"][0]
        self.assertEqual(cand["params_changed"], [{"base": 124, "key": "airspeed", "proposed": 130.0, "unit": "kt"}])
        rej = [c for c in snap(self.root)["claims"] if c["source_id"] == "DEMO-D06" and c["param_key"] == "airspeed"][0]
        self.assertNotIn(rej["claim_id"], cand["evidence_claim_ids"])

    def test_same_seeds_reproduce_and_diff_is_on_identical_seeds(self):
        cli(self.env, "demo-review")
        cli(self.env, "propose", "--ns", "demo")
        cand = snap(self.root)["candidates"][0]
        d = cand["diff"]
        self.assertTrue(d["same_seeds"])
        self.assertEqual(len(d["per_trial"]), d["count"])
        names = {c["name"]: c["ok"] for c in cand["tests"]["checks"]}
        self.assertTrue(names["baseline reproduces (same seeds → identical output hash)"])
        self.assertTrue(names["candidate reproduces (same seeds → identical output hash)"])
        # re-running the runner in a fresh process gives the same hash
        art = json.loads((self.root / "ledger" / "models" / "DEMO_LF-0.2.0-c1.json").read_text())
        params = {k: v["value"] for k, v in art["parameters"].items()}
        out = subprocess.run(["node", str(ENGINE / "model" / "runner.js"), "--params", json.dumps(params)],
                             capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(out.stdout)["output_hash"], d["candidate_output_hash"])
        # proposing again does not create a second candidate
        cli(self.env, "propose", "--ns", "demo")
        self.assertEqual(len(snap(self.root)["candidates"]), 1)

    def test_gated_promotion_and_rollback_without_data_loss(self):
        cli(self.env, "demo-review")
        cli(self.env, "propose", "--ns", "demo")
        cid = snap(self.root)["candidates"][0]["candidate_id"]
        bad = cli(self.env, "approve", "--ns", "demo", "--candidate", cid, "--actor", "MZ.Claude", "--authorization", "x", check=False)
        self.assertEqual(bad.returncode, 3)
        cli(self.env, "approve", "--ns", "demo", "--candidate", cid, "--actor", "TEST-HARNESS",
            "--authorization", "BUILD-001 controlled test")
        s = snap(self.root)
        self.assertEqual(s["namespaces"]["demo"]["pointer"]["baseline_model"], "DEMO/LF-0.2.0-c1")
        self.assertIn("not science", s["namespaces"]["demo"]["pointer"]["approval_label"])
        self.assertEqual(s["namespaces"]["real"]["pointer"]["baseline_model"], "LF-0.1.0")
        n_models = len(s["models"])
        cli(self.env, "rollback", "--ns", "demo", "--actor", "TEST-HARNESS", "--authorization", "BUILD-001 controlled test")
        s = snap(self.root)
        self.assertEqual(s["namespaces"]["demo"]["pointer"]["baseline_model"], "DEMO/LF-0.1.0")
        self.assertEqual(len(s["models"]), n_models)  # nothing deleted
        self.assertTrue((self.root / "ledger" / "models" / "DEMO_LF-0.2.0-c1.json").exists())
        kinds = [p["kind"] for p in s["promotions"]]
        self.assertEqual(kinds, ["refused", "approved", "rolled_back"])

    def test_real_namespace_requires_mz_human(self):
        p = cli(self.env, "review", "--claim", snap(self.root)["claims"][0]["claim_id"], "--decision", "accept",
                "--scope", "science", "--reviewer", "MZ.Human", "--note", "x", check=False)
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("only be recorded by MZ.Human", p.stderr)


class Volume(unittest.TestCase):
    def test_volume_alone_never_mutates_baseline(self):
        root, env = sandbox(volume=300)
        try:
            for a in (["init"], ["discover", "--demo"], ["work"], ["propose"]):
                cli(env, *a)
            s = snap(root)
            self.assertEqual(s["namespaces"]["demo"]["counters"]["known_targets"], 320)
            self.assertGreater(s["namespaces"]["demo"]["counters"]["claims"], 150)  # invalid clock times (e.g. "0060 GCT") are correctly not extracted
            self.assertEqual(s["candidates"], [])
            self.assertEqual(s["namespaces"]["demo"]["pointer"]["baseline_model"], "DEMO/LF-0.1.0")
        finally:
            shutil.rmtree(root, ignore_errors=True)


class Recovery(unittest.TestCase):
    def test_crash_resume_equals_clean_run(self):
        clean, cenv = sandbox()
        crash, xenv = sandbox()
        try:
            for a in (["init"], ["discover", "--demo"], ["work"]):
                cli(cenv, *a)
            for a in (["init"], ["discover", "--demo"]):
                cli(xenv, *a)
            crashes = 0
            for n in (7, 13, 29, 41, 17, 23, 31):   # kill the worker at several points, logged-but-not-projected
                p = cli(xenv, "work", "--crash-after", str(n), check=False)
                if p.returncode == 9:
                    crashes += 1
            cli(xenv, "work")
            self.assertGreaterEqual(crashes, 5)
            a, b = snap(clean), snap(crash)
            self.assertEqual(states(clean), states(crash))
            self.assertEqual(sorted(c["claim_id"] for c in a["claims"]), sorted(c["claim_id"] for c in b["claims"]))
            self.assertEqual(len({s["source_id"] for s in b["sources"]}), 20)    # no dropped / duplicated IDs
            for k in ("known_targets", "content_acquired", "duplicates", "corrupt", "unsupported", "blocked", "claims"):
                self.assertEqual(a["namespaces"]["demo"]["counters"][k], b["namespaces"]["demo"]["counters"][k], k)
            runs = b["runs"]
            self.assertTrue(any(r["status"] == "interrupted" for r in runs))
            self.assertEqual(runs[-1]["status"], "ok")
            self.assertIn("MATCHES", cli(xenv, "verify").stdout)
            # no phantom in-flight work after recovery
            self.assertFalse(any(s["ingestion_state"] in ("acquiring", "extracting") for s in b["sources"]))
        finally:
            shutil.rmtree(clean, ignore_errors=True)
            shutil.rmtree(crash, ignore_errors=True)

    def test_projection_deleted_is_rebuilt(self):
        root, env = sandbox()
        try:
            for a in (["init"], ["discover", "--demo"], ["work"]):
                cli(env, *a)
            before = snap(root)["namespaces"]
            (root / "data" / "state.sqlite").unlink()
            p = cli(env, "export")
            self.assertIn("recovery: replayed", p.stdout)
            self.assertEqual(snap(root)["namespaces"], before)
        finally:
            shutil.rmtree(root, ignore_errors=True)

    def test_torn_tail_and_tamper(self):
        root, env = sandbox()
        try:
            cli(env, "init")
            cli(env, "discover", "--demo")
            log = root / "ledger" / "events.jsonl"
            with open(log, "a") as f:
                f.write('{"seq": 999, "trunc')          # torn write (power loss mid-line)
            p = cli(env, "status")
            self.assertIn("torn tail dropped=True", p.stdout)
            lines = log.read_text().splitlines()
            ev = json.loads(lines[5])
            ev["data"]["title"] = "tampered"
            lines[5] = json.dumps(ev, sort_keys=True, separators=(",", ":"))
            log.write_text("\n".join(lines) + "\n")
            L = Ledger(root)
            with self.assertRaises(ChainError):
                L.verify_chain()
        finally:
            shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
