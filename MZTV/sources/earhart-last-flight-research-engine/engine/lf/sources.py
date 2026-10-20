"""Source connectors: discovery + acquisition, and rights classification.

Real connectors fetch with curl (honours the system proxy / CA settings and is
present on macOS and Linux). Only small, permitted fetches happen here; large
files are acquired one at a time by the worker with bounded retries.
"""
import html
import json
import re
import subprocess
import urllib.parse
from pathlib import Path

NARA_PORTAL = "https://www.archives.gov/research/ameliaearhart"
NARA_BASE = "https://www.archives.gov"

# Two contemporary Lae accounts (HDD E-002, E-003). Third-party transcriptions:
# link + locator only; content is hashed transiently and never retained.
LAE_ACCOUNTS = [
    {
        "source_id": "SRC-TIGHAR-CHATER-1937",
        "original_url": "https://tighar.org/Projects/Earhart/Archives/Documents/Chater_Report.html",
        "provider": "TIGHAR (transcription)",
        "title": "Eric H. Chater report, Guinea Airways, Lae (transcription)",
        "original_date": "1937-07-25",
        "hdd_ref": "E-002",
    },
    {
        "source_id": "SRC-TIGHAR-COLLOPY-1937",
        "original_url": "https://tighar.org/Projects/Earhart/Archives/Documents/Collopy_Letter.html",
        "provider": "TIGHAR (transcription)",
        "title": "James A. Collopy letter, District Superintendent of Civil Aviation, Lae (transcription)",
        "original_date": "1937-08-28",
        "hdd_ref": "E-003",
    },
]


class FetchError(Exception):
    def __init__(self, msg, transient=True, status=None):
        super().__init__(msg)
        self.transient = transient
        self.status = status


def curl(url, out_path=None, head=False, timeout=120):
    """Return (status, headers dict, body bytes or None)."""
    args = ["curl", "-sS", "-L", "--max-time", str(timeout), "-D", "-"]
    if head:
        args.append("-I")
    if out_path:
        args += ["-o", str(out_path)]
    args.append(url)
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout + 15)
    except subprocess.TimeoutExpired:
        raise FetchError(f"timeout after {timeout}s", transient=True)
    if p.returncode != 0:
        raise FetchError(f"curl exit {p.returncode}: {p.stderr.decode(errors='replace')[:200]}", transient=True)
    raw = p.stdout
    # split header blocks (may be several with redirects / proxy CONNECT)
    status, headers, body = None, {}, b""
    data = raw
    while True:
        m = re.match(rb"HTTP/[\d.]+ (\d{3})[^\r\n]*\r?\n", data)
        if not m:
            break
        end = data.find(b"\r\n\r\n")
        sep = 4
        if end < 0:
            end = data.find(b"\n\n"); sep = 2
        if end < 0:
            break
        block = data[:end].decode("latin-1")
        status = int(m.group(1))
        headers = {}
        for ln in block.split("\n")[1:]:
            if ":" in ln:
                k, v = ln.split(":", 1)
                headers[k.strip().lower()] = v.strip()
        data = data[end + sep:]
        if status not in (100, 101, 301, 302, 303, 307, 308) and not (status == 200 and "connection established" in block.lower()):
            break
    body = data if not out_path else None
    if status is None:
        raise FetchError("no HTTP status parsed", transient=True)
    if status >= 500 or status == 429:
        raise FetchError(f"HTTP {status}", transient=True, status=status)
    if status >= 400:
        raise FetchError(f"HTTP {status}", transient=False, status=status)
    return status, headers, body


# ------------------------------------------------------------------ rights / record kind
def classify_nara_file(fname):
    """Heuristic rights + record-kind classification from the release filename.

    Every result is marked heuristic; nothing here is a legal determination.
    """
    f = fname.lower()
    group, kind = "unknown", "undetermined"
    if fname.startswith("080_"):
        group = "RG 80 · General Records of the Department of the Navy"
    elif fname.startswith("026_"):
        group = "RG 26 · Records of the U.S. Coast Guard"
    elif fname.startswith("457_"):
        group = "RG 457 · Records of the National Security Agency"
    elif fname.startswith("pl-") or fname.startswith("PL"):
        group = "Presidential Library holdings"
    elif re.match(r"^\d{2,3}-hq-", f):
        group = "FBI file series"
    elif re.match(r"^\d{8}_", fname):
        group = "CIA CREST-numbered document"
    news_words = ("washington_post", "times_herald", "article", "_says", "book", "blog", "news_brief",
                  "wtop", "chronicler", "paper_says", "is_this_what", "the_true_story", "sinister", "secret",
                  "called_spy", "bones", "vindication", "reveals", "backed", "clue", "clew", "denies")
    if "1937" in f and ("report_of_earhart_search" in f or "itasca" in f):
        kind = "contemporaneous 1937 record (candidate primary)"
    elif any(w in f for w in news_words):
        kind = "later secondary / press material"
    elif "oral_hist" in f or "tape_recorded" in f:
        kind = "later recollection (oral history)"
    if f.endswith(".mp3"):
        ctype = "audio/mpeg"
    elif f.endswith(".pdf"):
        ctype = "application/pdf"
    else:
        ctype = "application/octet-stream"
    if kind == "later secondary / press material":
        rights = "THIRD-PARTY COPYRIGHT POSSIBLE (press clipping inside federal file)"
        policy = "metadata-only"
    elif ctype == "audio/mpeg":
        rights = "RIGHTS UNVERIFIED (historical audio inside federal release)"
        policy = "metadata-only"
    else:
        rights = "U.S. FEDERAL RECORD · NARA public release · no known copyright (verify per item)"
        policy = "short-excerpt-after-review"
    return {
        "record_group": group,
        "record_kind": kind,
        "content_type_guess": ctype,
        "rights": rights,
        "rights_basis": "heuristic from release filename + record group; NOT a legal determination",
        "display_policy": policy,
    }


def parse_nara_portal(html_text):
    """Return (files, release_summaries). Files are de-duplicated hrefs under /releases/."""
    hrefs = re.findall(r'href="(/files3/research/ameliaearhart/releases/(\d{4})/(\d{4})/([^"]+))"', html_text)
    seen, files = set(), []
    for href, y, md, fname in hrefs:
        if href in seen:
            continue
        seen.add(href)
        fname_dec = html.unescape(urllib.parse.unquote(fname))
        path = html.unescape(urllib.parse.unquote(href))
        files.append({
            "href": href,
            "url": NARA_BASE + urllib.parse.quote(path, safe="/-_.~"),
            "release_date": f"{y}-{md[:2]}-{md[2:]}",
            "filename": fname_dec,
        })
    text = html.unescape(re.sub(r"<[^>]+>", " ", html_text))
    text = re.sub(r"\s+", " ", text)
    summaries = []
    for m in re.finditer(r"([A-Z][a-z]+ \d{1,2}, 20\d\d)[^.]{0,160}?([\d,]+) pages", text):
        summaries.append({"date_text": m.group(1), "pages": int(m.group(2).replace(",", ""))})
    return files, summaries


def nara_source_id(url):
    """Unique, stable ID: readable slug + 10 hex of the file URL (a slug alone can collide)."""
    fname = urllib.parse.unquote(url.rsplit("/", 1)[-1])
    stem = re.sub(r"\.[a-z0-9]+$", "", fname, flags=re.I)
    stem = re.sub(r"[^A-Za-z0-9]+", "-", stem).strip("-")
    import hashlib
    return "SRC-NARA-" + stem[:40].upper().strip("-") + "-" + hashlib.sha256(url.encode()).hexdigest()[:10]


def html_to_lines(raw_bytes):
    t = raw_bytes.decode("utf-8", errors="replace")
    t = re.sub(r"(?is)<(script|style).*?</\1>", "", t)
    t = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</h\d>|</li>|</tr>", "\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return [ln.strip() for ln in t.split("\n") if ln.strip()]


# ------------------------------------------------------------------ demo fixtures
def load_fixture_manifest(root):
    p = Path(root) / "fixtures" / "demo" / "manifest.json"
    return json.loads(p.read_text(encoding="utf-8"))
