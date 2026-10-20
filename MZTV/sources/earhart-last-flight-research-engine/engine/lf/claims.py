"""Atomic claim extraction (machine) and normalization.

Extraction is deliberately narrow: quantities that could map to a model
parameter (departure fuel, fuel burn, airspeed) plus context-only observations
(radio frequencies, clock times, the 157/337 line of position). Every claim is
linked to an exact page/line locator. Machine extraction never sets a claim as
accepted; review is a separate, attributed event.
"""
import hashlib
import re

IMP_TO_US = 1.200950
MPH_TO_KT = 0.868976

# model parameter keys understood by the surrogate (MZLastFlight.normalizedConfig)
PARAMS = {
    "fuelStart": {"unit": "US_gal", "tolerance": 0.02, "label": "departure fuel",
                  "expected": "endurance rises by about Δfuel ÷ burn hours; terminal positions move further along the flown track"},
    "burn": {"unit": "US_gal/h", "tolerance": 0.04, "label": "fuel burn",
             "expected": "endurance falls as burn rises (endurance = fuel ÷ burn); shorter tracks"},
    "airspeed": {"unit": "kt", "tolerance": 0.03, "label": "cruise airspeed",
                 "expected": "earlier arrival near the Howland line; same endurance, longer track"},
}

DEPARTURE_CTX = re.compile(r"\b(left|leaving|carried|departure|depart|take ?off|took off|total|loaded|on board)\b", re.I)
CRUISE_CTX = re.compile(r"\b(cruis\w*|air ?speed|true speed|average speed|speed)\b", re.I)

RE_BURN = re.compile(r"(?<![\d,.])(\d{2,3}(?:\.\d)?)\s*(?:U\.?\s?S\.?\s*)?(?:gallons|gals?\.?)\s*(?:per|an|a|/)\s*(?:hour|hr|h)\b", re.I)
RE_FUEL = re.compile(r"(?<![\d.])(\d{1,2},\d{3}|\d{3,4})\s*(?:U\.?\s?S\.?\s*|imperial\s*|imp\.?\s*)?(?:gallons|gals?\.?)(?!\s*(?:per|an hour|/))", re.I)
RE_SPEED = re.compile(r"(?<![\d.])(\d{2,3})\s*(knots|kts?\.?|m\.?\s?p\.?\s?h\.?|miles per hour)\b", re.I)
RE_AMBIG_BURN = re.compile(r"\b(?:burn|consumption)\s+(?:of|was|at|about)\s+(\d{2,3})\b(?!\s*(?:U\.?S\.?\s*)?(?:gal|gph|gallons|%|percent))", re.I)
RE_FREQ = re.compile(r"(?<![\d.])(\d{3,4}(?:\.\d)?)\s*(?:kilocycles|kcs?\.?|kc/s)\b", re.I)
RE_TIME = re.compile(r"\b([0-2]\d[0-5]\d)\s*(GCT|GMT|Z)\b")
RE_LOP = re.compile(r"\b157\s*[-–/ ]\s*337\b")


def _num(s):
    return float(s.replace(",", ""))


def claim_id(source_id, page, line, k):
    h = hashlib.sha256(source_id.encode()).hexdigest()[:8]
    return f"CLM-{h}-p{page:04d}-l{line:04d}-{k}"


def extract_from_lines(source_id, page, lines, method, excerpt_policy):
    """Yield claim dicts for one page of normalized lines (1-based line numbers)."""
    out = []
    for ln_no, line in enumerate(lines, 1):
        k = 0
        nxt = lines[ln_no] if ln_no < len(lines) else ""
        # two-line window: a quantity may wrap onto the next line; it is located on the line where it starts
        win = line + " " + nxt
        L = len(line)
        own = lambda m: m.start() < L
        masked = win
        found = []
        for m in RE_BURN.finditer(win):
            if not own(m):
                continue
            found.append(("burn", _num(m.group(1)), "US_gal/h", m.group(0), None))
            masked = masked[:m.start()] + " " * (m.end() - m.start()) + masked[m.end():]
        for m in RE_FUEL.finditer(masked):
            if not own(m):
                continue
            raw = m.group(0)
            v = _num(m.group(1))
            unit = "US_gal"
            note = None
            if re.search(r"imperial|imp\.", raw, re.I):
                v = round(v * IMP_TO_US, 1)
                note = "converted from imperial gallons ×1.20095"
            tail = win[m.end():m.end() + 14].lower()
            ctx = DEPARTURE_CTX.search(win)
            # departure load only: ≥300 gal, departure context, not oil
            pk = "fuelStart" if (ctx and v >= 300 and "oil" not in tail) else None
            found.append((pk, v, unit, raw, note))
        for m in RE_SPEED.finditer(win):
            if not own(m):
                continue
            v = _num(m.group(1))
            u = m.group(2).lower()
            note = None
            if u.startswith("m") or "miles" in u:
                v = round(v * MPH_TO_KT, 1)
                note = "converted from mph ×0.868976"
            pk = "airspeed" if CRUISE_CTX.search(line) else None
            found.append((pk, v, "kt", m.group(0), note))
        for m in RE_AMBIG_BURN.finditer(win):
            if own(m):
                found.append(("burn", _num(m.group(1)), None, m.group(0), "unit missing — ambiguous"))
        for m in RE_FREQ.finditer(line):
            found.append(("ctx:radio_frequency", _num(m.group(1)), "kc", m.group(0), None))
        for m in RE_TIME.finditer(line):
            found.append(("ctx:clock_time", None, m.group(2), m.group(0), "time reference; native notation retained"))
        for m in RE_LOP.finditer(line):
            found.append(("ctx:line_of_position", None, "deg", m.group(0), "157/337 line of position"))
        for pk, v, unit, raw, note in found:
            k += 1
            is_param = pk in PARAMS
            line_sha = hashlib.sha256(line.encode("utf-8")).hexdigest()
            if excerpt_policy == "link-only":
                excerpt = None
                pol = f"not stored (third-party transcription) · locator line sha256 {line_sha[:16]}"
            elif excerpt_policy == "metadata-only":
                excerpt = None
                pol = "not stored (rights restricted)"
            else:
                excerpt = line[:160]
                pol = excerpt_policy
            out.append({
                "claim_id": claim_id(source_id, page, ln_no, k),
                "source_id": source_id,
                "page": page, "line": ln_no, "locator": f"p{page}:l{ln_no}",
                "excerpt": excerpt, "excerpt_policy": pol, "locator_sha256": line_sha,
                "quantity": re.sub(r"\\s+", " ", raw.strip()),
                "normalized_value": v,
                "unit": unit,
                "param_key": pk if is_param else (pk or None),
                "time_ref": raw.strip() if (pk == "ctx:clock_time") else None,
                "coordinate": None,
                "confidence_band": "Speculative" if ("ocr" in method.lower()) else "Inferred",
                "extraction_method": method,
                "normalization_note": note,
                "dependencies": [],
            })
    return out


def normalize_lines(text):
    """Whitespace-normalize; keep original spelling and notation."""
    lines = []
    for raw in text.replace("\r", "").split("\n"):
        s = re.sub(r"[ \t ]+", " ", raw).strip()
        if s:
            lines.append(s)
    return lines
