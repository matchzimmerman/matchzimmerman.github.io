"""HARIL SPECIMEN 001 · INFLUENCE — signal extraction.

Reads corpus.txt (the conversational material) and lineage.json (the macro packet),
measures each unit and sentence, and writes packet.json, which the piece embeds.
Everything here is plain counting and vector similarity: no model, no API.
Run:  python3 extract.py   (deterministic)
"""
import json, math, re, collections, hashlib, os

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- lexicons (interpretation enters here)
STOP = set("""a an the and or but if so of to in on at by for with from as is are was were be been being it its it's this that these those
there here then than too very also just not no yes do does did done can could would should will shall may might must i me my we our us you your
he she they them their his her what which who whom whose when where why how all any each every some such only own same other into over under out
up down about after before again further once more most less few many much both either neither nor own per via vs one two three four five six
seven eight nine ten first last next new now still even like um uh yeah okay ok right gonna let let's i'm i'll i've you've you're we're don't
can't it'll that's what's there's isn't doesn't won't i'd we'd so-called get got make made build built keep kept use used using way thing things
bit lot really actually maybe kind sort going want wants need needs see seen give gives say says said put take takes know think doing
something them itself between through while because across around without within along until upon against among onto off around back away
whether rather instead otherwise however therefore thus become becomes have has had work works high each often ideally simply merely actual itself already isn't aren't nothing something everything anything""".split())

CONSTRAINT = r"\b(must|should|never|do not|don't|avoid|only|always|exactly|no more than|at least|keep|not too|definitely not|required?|requirements?)\b"
CORRECTION = r"\b(too|cheesy|repetitive|painful|jump out|reluctant|remove|instead|rather than|not tied|doesn't need|don't care|fix(ed)?|broken|roar|self-oscillated|did not decay|honest answer|mostly is the same|gone)\b"
ACCEPT = r"\b(great|good stuff|sounds great|grasped|yes|nicely|strong|that's good|fully)\b"
EXPLORE = r"\b(maybe|could|might|interesting|what if|i think|imagine|possib\w*|explore|examples?|perhaps|would be|so cool|i'd be down|wonder)\b"
EXACT = r"(\d|\bdb\b|\bhz\b|\bkhz\b|\bbpm\b|\bl\d\d|\br\d\d|\bbars?\b|\bexactly\b|\bsample)"
META = r"\b(system\w*|architecture|recurs\w*|influence|layer|engine|data\w*|arbitrary|branch\w*|archive|haril|observer|authorship|substrate|signals?|mappings?|cybernetic\w*|feedback|self-description|practice|agents?|conversation\w*|dataset|control)\b"
CREATIVE = r"\b(sound\w*|groove|pads?|strings?|bass|kick|snare|echo|dub|funk|stereo|tempo|melod\w*|chord\w*|reverb|saturat\w*|colou?r|visual\w*|image|film|clip|video|shot|ambient|orchestra\w*|theme|voices?|membrane|field|scene|motif\w*)\b"
QUESTION = r"\?"
BRANCH = r"\b(branch\w*|new|another|extension|fork|separate|variant|instead of|inverts?)\b"

def rx(p, s): return len(re.findall(p, s, flags=re.I))

# ---------------------------------------------------------------- read corpus
units = []
cur = None
for line in open(os.path.join(HERE, "corpus.txt"), encoding="utf-8"):
    if line.startswith("#"):
        continue
    if line.startswith("=== "):
        f = [x.strip() for x in line[4:].split("|")]
        cur = dict(id=f[0], who=f[1], date=f[2], src=f[3], basis=f[4], text="")
        units.append(cur)
    elif cur is not None:
        cur["text"] += line
for u in units:
    u["text"] = re.sub(r"\s+", " ", u["text"]).strip()

def tokens(s):
    out = []
    for w in re.findall(r"[a-zA-Z][a-zA-Z\-']+", s.lower()):
        w = w.strip("-'")
        if len(w) < 3 or w in STOP:
            continue
        if w.endswith("ies") and len(w) > 5: w = w[:-3] + "y"
        elif w.endswith("s") and not w.endswith("ss") and len(w) > 4: w = w[:-1]
        out.append(w)
    return out

def sentences(s):
    parts = re.split(r"(?<=[.?!])\s+(?=[A-Z\"'])", s)
    return [p.strip() for p in parts if len(p.strip()) > 2]

# ---------------------------------------------------------------- concepts: recurring content terms
df = collections.Counter()
tf_unit = []
for u in units:
    t = tokens(u["text"]); tf_unit.append(collections.Counter(t)); df.update(set(t))
N = len(units)
# a concept recurs across units (df >= 3) and is not ubiquitous
cands = [(w, d) for w, d in df.items() if 3 <= d <= int(N * 0.6)]
# rank by spread over the conversation x total frequency
tot = collections.Counter(); [tot.update(c) for c in tf_unit]
cands.sort(key=lambda wd: -(wd[1] * math.log(1 + tot[wd[0]])))
CONCEPTS = [w for w, _ in cands[:28]]
try:
    _old = [c["w"] for c in json.load(open(os.path.join(HERE, "packet.json")))["concepts"]]
    if set(_old) == set(CONCEPTS): CONCEPTS = _old
except Exception:
    pass
cidx = {w: i for i, w in enumerate(CONCEPTS)}

# ---------------------------------------------------------------- tf-idf vectors, similarity
idf = {w: math.log(N / df[w]) for w in df}
def vec(c):
    v = {w: n * idf[w] for w, n in c.items() if idf[w] > 0}
    nrm = math.sqrt(sum(x * x for x in v.values())) or 1
    return {w: x / nrm for w, x in v.items()}
vecs = [vec(c) for c in tf_unit]
def cos(a, b): return sum(x * b.get(w, 0) for w, x in a.items())
SIM = [[round(cos(vecs[i], vecs[j]), 3) if i != j else 0 for j in range(N)] for i in range(N)]

# ---------------------------------------------------------------- per-sentence and per-unit features
first_seen = {}
out_units = []
gid = 0
for ui, u in enumerate(units):
    sents = []
    for s in sentences(u["text"]):
        toks = tokens(s); words = len(s.split())
        cs = sorted({cidx[t] for t in toks if t in cidx})
        novel = []
        for t in toks:
            if t in cidx and t not in first_seen:
                first_seen[t] = (ui, u["who"]); novel.append(cidx[t])
        f = dict(
            w=words,
            q=rx(QUESTION, s),
            con=rx(CONSTRAINT, s), cor=rx(CORRECTION, s), acc=rx(ACCEPT, s),
            exp=rx(EXPLORE, s), exa=rx(EXACT, s), meta=rx(META, s), cre=rx(CREATIVE, s),
            br=rx(BRANCH, s), c=cs, nov=sorted(set(novel)))
        sents.append(f); gid += 1
    W = sum(s["w"] for s in sents) or 1
    def rate(k): return sum(s[k] for s in sents) / W * 100  # per 100 words
    out_units.append(dict(
        id=u["id"], who=u["who"], date=u["date"], src=u["src"], basis=u["basis"],
        w=W, s=sents,
        con=rate("con"), cor=rate("cor"), acc=rate("acc"), exp=rate("exp"), exa=rate("exa"),
        meta=rate("meta"), cre=rate("cre"), q=rate("q"), br=rate("br"),
        c=sorted({c for s in sents for c in s["c"]}),
        nov=sorted({c for s in sents for c in s["nov"]}),
    ))

# normalise unit-level rates to 0..1 against the corpus (5th..95th percentile), so any corpus drives full range
def norm(key):
    vals = sorted(u[key] for u in out_units)
    lo = vals[int(0.05 * (N - 1))]; hi = vals[int(0.95 * (N - 1))] or 1
    for u in out_units:
        u[key + "N"] = round(max(0, min(1, (u[key] - lo) / (hi - lo if hi > lo else 1))), 3)
for k in ["con", "cor", "acc", "exp", "exa", "meta", "cre", "q", "br"]:
    norm(k)

# ratification / locking: a unit whose following unit, by the other party, accepts it
for i, u in enumerate(out_units):
    nxt = out_units[i + 1] if i + 1 < N else None
    u["locked"] = bool(nxt and nxt["who"] != u["who"] and nxt["acc"] > 0.4)
    # pacing: short turns between long ones read as dense, rapid exchange
    nb = [out_units[j]["w"] for j in (i - 1, i + 1) if 0 <= j < N]
    u["dens"] = round(max(0, min(1, (sum(nb) / len(nb)) / (u["w"] + 40) / 3)), 3) if nb else 0.3
    # human vs machine initiation of what this unit carries
    u["init"] = sum(1 for c in u["nov"])

# dormancy and return: gaps (in units) between successive appearances of each concept
occ = collections.defaultdict(list)
for i, u in enumerate(out_units):
    for c in u["c"]:
        occ[c].append(i)
returns = []
for c, lst in occ.items():
    for a, b in zip(lst, lst[1:]):
        if b - a >= 5:
            returns.append(dict(c=c, at=b, gap=b - a))
for u in out_units:
    u["ret"] = [r["c"] for r in returns if out_units[r["at"]] is u]

# bridges: strongly similar units far apart in the conversation or from different sources
bridges = []
for i in range(N):
    for j in range(i + 1, N):
        far = (j - i) >= 6 or out_units[i]["src"] != out_units[j]["src"]
        if far and SIM[i][j] >= 0.09:
            bridges.append([i, j, SIM[i][j]])
bridges.sort(key=lambda b: -b[2])

concepts = []
for w in CONCEPTS:
    i = cidx[w]
    fs = first_seen.get(w, (0, "R"))
    h = int(hashlib.sha1(w.encode()).hexdigest(), 16)
    concepts.append(dict(
        w=w, df=df[w], tot=tot[w], born=fs[0], by=fs[1], occ=occ[i],
        # a stable, data-derived home in the field (no layout algorithm: the word decides)
        x=round(0.12 + 0.76 * ((h % 9973) / 9973), 4), y=round(0.14 + 0.72 * (((h // 9973) % 9967) / 9967), 4),
        # a pitch in the mode, from where and by whom it was born
        deg=(fs[0] * 3 + (0 if fs[1] == "H" else 2 if fs[1] == "M" else 4) + h % 2) % 7,
    ))

lineage = json.load(open(os.path.join(HERE, "lineage.json"), encoding="utf-8"))

packet = dict(
    v=1, made="2026-10-06",
    units=out_units, concepts=concepts, sim=SIM, bridges=bridges[:40], returns=returns,
    lineage=lineage,
    stats=dict(units=N, sentences=gid, words=sum(u["w"] for u in out_units),
               byWho={k: sum(1 for u in out_units if u["who"] == k) for k in "HMR"},
               wordsByWho={k: sum(u["w"] for u in out_units if u["who"] == k) for k in "HMR"},
               bridges=len(bridges), returns=len(returns)),
)
json.dump(packet, open(os.path.join(HERE, "packet.json"), "w"), separators=(",", ":"))

# human-readable provenance report
L = []
L.append(f"units {N}  sentences {gid}  words {packet['stats']['words']}  by who {packet['stats']['byWho']}  words by who {packet['stats']['wordsByWho']}")
L.append("concepts (word df tot born-by-unit origin):")
for c in concepts:
    L.append(f"  {c['w']:<14} df={c['df']:<3} tot={c['tot']:<3} born u{c['born']:<3} by {c['by']}  deg {c['deg']}")
L.append(f"returns (dormant >=5 units): {len(returns)}")
for r in returns[:30]:
    L.append(f"  {CONCEPTS[r['c']]:<14} returns at {out_units[r['at']]['id']} after {r['gap']} units")
L.append(f"bridges: {len(bridges)}")
for i, j, s in bridges[:15]:
    L.append(f"  {out_units[i]['id']} <-> {out_units[j]['id']}  {s}")
L.append("units:")
for u in out_units:
    L.append(f"  {u['id']} {u['who']} w={u['w']:<4} con={u['conN']:.2f} cor={u['corN']:.2f} acc={u['accN']:.2f} exp={u['expN']:.2f} exa={u['exaN']:.2f} meta={u['metaN']:.2f} cre={u['creN']:.2f} dens={u['dens']:.2f} locked={int(u['locked'])} nov={len(u['nov'])} ret={len(u['ret'])}")
open(os.path.join(HERE, "provenance.txt"), "w").write("\n".join(L) + "\n")
print("\n".join(L[:60]))
