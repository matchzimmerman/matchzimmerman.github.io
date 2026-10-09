#!/usr/bin/env python3
"""Embed a ledger JSON into index.html (between the <script id="ledger"> tags)."""
import re, sys, json
html_path, ledger_path = (sys.argv + [None, None])[1:3]
html_path = html_path or "index.html"; ledger_path = ledger_path or "ledger/haril-practice.json"
html = open(html_path).read()
led = json.dumps(json.load(open(ledger_path)), separators=(",", ":")).replace("</", "<\\/")
new, n = re.subn(r'(<script id="ledger" type="application/json">)(.*?)(</script>)', lambda m: m.group(1) + led + m.group(3), html, count=1, flags=re.S)
assert n == 1, "ledger block not found"
open(html_path, "w").write(new)
print(f"embedded {len(led)} bytes")
