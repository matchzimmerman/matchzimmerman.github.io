#!/usr/bin/env python3
"""Generate the BUILD-001 DEMO fixture corpus (20 files).

Every fixture is SYNTHETIC, authored for pipeline tests. None is a historical
document, and every file says so in its first line. Values are chosen to
exercise mechanics (duplicate, corruption, unsupported type, conflict, retry,
rights block, ambiguity, untraceable provenance, volume), not to assert facts.

Usage: python3 engine/make_fixtures.py [--volume N]   (N extra context-only docs)
"""
import json
import os
import sys
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ROOT = Path(os.environ.get("LF_ROOT", Path(__file__).resolve().parents[1]))
OUT = ROOT / "fixtures" / "demo"
HDR = "DEMO / SYNTHETIC FIXTURE — NOT A HISTORICAL DOCUMENT — authored for BUILD-001 pipeline tests"


def pdf(path, pages):
    c = canvas.Canvas(str(path), pagesize=letter, invariant=1)
    for lines in pages:
        y = 740
        c.setFont("Courier", 10)
        for ln in [HDR] + lines:
            c.drawString(54, y, ln)
            y -= 16
        c.showPage()
    c.save()


def txt(path, lines):
    path.write_text("\n".join([HDR] + lines) + "\n", encoding="utf-8")


def main(volume=0):
    OUT.mkdir(parents=True, exist_ok=True)
    F = []

    def add(fid, title, file, kind, expect, **kw):
        F.append(dict(fixture_id=fid, title=title, file=file, content_type=kind, expect=expect,
                      original_url=kw.pop("original_url", f"demo://fixtures/{file}"), **kw))

    # D01–D02: PDFs with multiple pages and context-only observations
    pdf(OUT / "D01_demo_radio_log.pdf", [
        ["DEMO radio log sheet 1", "DEMO entry: signal heard on 3105 kilocycles at 1912 GCT", "DEMO entry: weak carrier, no bearing"],
        ["DEMO radio log sheet 2", "DEMO entry: operator reports line 157-337 in message", "DEMO entry: 7500 kc tried at 2025 GCT"]])
    add("D01", "radio log (two-page PDF, context only)", "D01_demo_radio_log.pdf", "application/pdf", "classified; display-only claims")
    pdf(OUT / "D02_demo_weather_note.pdf", [["DEMO forecast note", "DEMO: scattered showers expected, winds light", "DEMO: issued 0600 GCT"]])
    add("D02", "weather note (PDF, context only)", "D02_demo_weather_note.pdf", "application/pdf", "classified; display-only claims")
    # D03, D05: agreeing airspeed claims → DEMO candidate after DEMO review
    txt(OUT / "D03_demo_performance_memo.txt", ["DEMO performance memo", "DEMO: the aircraft cruised at 130 knots true airspeed on the test leg.",
                                                 "DEMO: no other figures given."])
    add("D03", "performance memo A (airspeed 130 kt)", "D03_demo_performance_memo.txt", "text/plain", "accepted (DEMO reviewer) → candidate",
        demo_review={"airspeed": ["accept", "science", "DEMO reviewer: consistent with D05"]})
    txt(OUT / "D04_demo_fuel_sheet.txt", ["DEMO fuel sheet", "DEMO: the machine left with a total of 1100 gallons on board."])
    add("D04", "fuel sheet A (1100 gal)", "D04_demo_fuel_sheet.txt", "text/plain", "conflicts with D07 → blocked")
    pdf(OUT / "D05_demo_cruise_report.pdf", [["DEMO cruise report", "DEMO: average speed held near 130 knots in cruise."]])
    add("D05", "cruise report B (airspeed 130 kt)", "D05_demo_cruise_report.pdf", "application/pdf", "accepted (DEMO reviewer) → candidate",
        demo_review={"airspeed": ["accept", "science", "DEMO reviewer: consistent with D03"]})
    # D06: unsafe airspeed claim rejected in review → no mutation
    txt(OUT / "D06_demo_rumour.txt", ["DEMO hearsay note", "DEMO: someone said she cruised at 175 knots the whole way."])
    add("D06", "hearsay note (175 kt, rejected)", "D06_demo_rumour.txt", "text/plain", "rejected in review → no mutation",
        demo_review={"airspeed": ["reject", "science", "DEMO reviewer: hearsay, untraceable speaker; unsafe for model input"]})
    # D07: conflicting fuel
    txt(OUT / "D07_demo_fuel_sheet_b.txt", ["DEMO fuel sheet B", "DEMO: departure load recorded as 950 gallons, total."])
    add("D07", "fuel sheet B (950 gal, conflicts with D04)", "D07_demo_fuel_sheet_b.txt", "text/plain", "conflicts with D04 → blocked")
    # D08: exact duplicate of D03
    (OUT / "D08_demo_performance_memo_copy.txt").write_bytes((OUT / "D03_demo_performance_memo.txt").read_bytes())
    add("D08", "duplicate of D03 (byte-identical)", "D08_demo_performance_memo_copy.txt", "text/plain", "duplicate")
    # D09: corrupted PDF (truncated, no trailer)
    full = (OUT / "D05_demo_cruise_report.pdf").read_bytes()
    (OUT / "D09_demo_truncated.pdf").write_bytes(full[: len(full) // 3])
    add("D09", "truncated PDF", "D09_demo_truncated.pdf", "application/pdf", "corrupt")
    # D10: unsupported binary
    (OUT / "D10_demo_spreadsheet.xls").write_bytes(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + bytes(range(256)) * 4)
    add("D10", "legacy spreadsheet (unsupported)", "D10_demo_spreadsheet.xls", "application/vnd.ms-excel", "unsupported")
    # D11: transient acquisition failures then success
    txt(OUT / "D11_demo_flaky_scan.txt", ["DEMO flaky mirror", "DEMO: carrier heard briefly on 6210 kc."])
    add("D11", "flaky mirror (fails twice, then succeeds)", "D11_demo_flaky_scan.txt", "text/plain", "retry ×2 then classified", fail_first_n=2)
    # D12: rights-restricted → metadata only
    txt(OUT / "D12_demo_restricted.txt", ["DEMO restricted item", "DEMO: content must not be acquired."])
    add("D12", "rights-restricted item", "D12_demo_restricted.txt", "text/plain", "blocked_rights (metadata only)",
        display_policy="blocked", rights="DEMO · RESTRICTED (authored test of rights block)")
    # D13: ambiguous (unit missing)
    txt(OUT / "D13_demo_ambiguous.txt", ["DEMO engineering scrap", "DEMO: a burn of 52 was planned for the long leg."])
    add("D13", "ambiguous burn figure (no unit)", "D13_demo_ambiguous.txt", "text/plain", "claim ineligible: ambiguous unit")
    # D14: untraceable provenance
    txt(OUT / "D14_demo_untraceable.txt", ["DEMO anonymous note", "DEMO: fuel burn 44 gallons per hour."])
    add("D14", "anonymous note (no provenance)", "D14_demo_untraceable.txt", "text/plain", "claim ineligible: untraceable", original_url=None)
    # D15–D20: volume, context only
    for i in range(15, 21):
        name = f"D{i}_demo_volume_{i}.txt"
        txt(OUT / name, [f"DEMO volume document {i}", f"DEMO: routine traffic at {1800 + i:04d} GCT on 3105 kc.", "DEMO: nothing else."])
        add(f"D{i}", f"volume document {i} (context only)", name, "text/plain", "classified; display-only")
    for i in range(volume):
        fid = f"V{i + 1:04d}"
        name = f"{fid}_demo_volume.txt"
        txt(OUT / name, [f"DEMO bulk volume document {fid}", f"DEMO: routine traffic at {i % 2400:04d} GCT."])
        add(fid, f"bulk volume {fid} (context only)", name, "text/plain", "classified; display-only")
    manifest = {"label": "DEMO / SYNTHETIC — BUILD-001 fixture corpus", "count": len(F), "fixtures": F}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(F)} DEMO fixtures to {OUT}")


if __name__ == "__main__":
    vol = int(sys.argv[sys.argv.index("--volume") + 1]) if "--volume" in sys.argv else 0
    main(vol)
