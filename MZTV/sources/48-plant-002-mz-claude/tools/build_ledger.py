#!/usr/bin/env python3
"""
48 PLANT — environmental ledger builder (MZ.Claude build, specimen 001)

Turns the activity record of a body of creative practice into a compact,
privacy-safe event stream that the organism experiences as weather.

Inputs (any subset):
  --site   path to a git clone of matchzimmerman/matchzimmerman.github.io
  --repo   path to a git clone of matchzimmerman/mz-archive (private; only
           timestamps, path classes and message *kinds* leave it)
  --timeline path to timeline_meta.json (HARIL SHARED TIMELINE metadata)

Output: a ledger JSON (schema mz-48plant-ledger/1). No commit messages, titles,
file names or text leave this script; only:
  minute timestamp · source · actor class · branch · kind · magnitude · flags

Usage:
  python3 build_ledger.py --site ../../../.. --repo ~/mz-archive \
      --timeline ../ledger/timeline_meta.json --out ../ledger/haril-practice.json

Other specimens: point --site/--repo at other repositories, or write your own
adapter that emits the same event rows (see SCHEMA below).
"""
import argparse, datetime as dt, hashlib, json, math, re, subprocess, sys
from collections import Counter, defaultdict

SCHEMA = "mz-48plant-ledger/1"
BRANCHES = ["MZTV", "OBAS", "SONIC LAB", "FIELD ENGINE", "MAGPIE", "HARIL / PIECE",
            "ARCHIVE / RCF", "SEALS", "LEARNING / EDUCATION", "CAREER / OPPORTUNITIES",
            "SPATIAL SOUND", "SITE"]
ACTORS = ["human", "claude", "gpt", "other_agent", "process"]
KINDS = ["create", "revision", "correction", "contradiction", "rejection", "archive",
         "breakthrough", "decision", "system", "report", "handoff", "digest", "intake"]
SOURCES = ["site", "archive_repo", "timeline", "live", "forced"]
F_NOVEL, F_REACT = 1, 2
REACTIVATION_GAP_DAYS = 45

# path → branch (first match wins); case-insensitive
SITE_RULES = [
    (r"^(mztv|MZTV)/sources/field-engine", "FIELD ENGINE"),
    (r"^(mztv|MZTV)/sources/score-engine", "SONIC LAB"),
    (r"^(mztv|MZTV)/", "MZTV"),
    (r"magpie|field-station|fs magpie", "MAGPIE"),
    (r"haril|rcf_live|conversational-interaction|coordinated-agreements", "HARIL / PIECE"),
    (r"^archive/|moving-image-archive|youtube-corpus|archival-retrieval|^data/archive", "ARCHIVE / RCF"),
    (r"sonic-lab|field-audio|obas-voice|tidal-cycles|despacito", "SONIC LAB"),
    (r"field-engine|evolutionary-field", "FIELD ENGINE"),
    (r"obas|primitive-divisions|random-tiling|infinite-gradient|endless-shape|starfield", "OBAS"),
    (r"woods|kaaterskill|seals|wildlife", "SEALS"),
    (r"haril-school|labz|f1-lab|learning", "LEARNING / EDUCATION"),
    (r"shop-api|mzsite|preview|systems", "CAREER / OPPORTUNITIES"),
    (r"spatial", "SPATIAL SOUND"),
]
REPO_RULES = [
    (r"^research/mztv", "MZTV"),
    (r"^research/sonic", "SONIC LAB"),
    (r"^(scripts|derived|reports)/", "ARCHIVE / RCF"),
    (r"^(docs|field-log)/", "HARIL / PIECE"),
    (r"^(STATE|FINDINGS|PROTOCOL|ENTITY_REGISTRY)", "HARIL / PIECE"),
]


def classify(path, rules):
    p = path.lower()
    for rx, b in rules:
        if re.search(rx, p, re.I):
            return b
    return "SITE"


def project_key(path, repo):
    parts = path.split("/")
    if repo == "site":
        if parts[0].lower() == "mztv" and len(parts) > 2 and parts[1] == "sources":
            k = "mztv/" + parts[2]
        else:
            k = parts[0]
    else:
        k = "mza/" + (parts[1] if parts[0] in ("research", "docs") and len(parts) > 2 else parts[0])
    k = k.lower()
    k = re.sub(r"\.(html?|zip|md|json|js|css)$", "", k)
    k = re.sub(r"([_-]v\d+[a-z_0-9-]*)$", "", k)  # versions are revisions of one project
    return k


def msg_kind(msg, statuses):
    m = msg.lower()
    if re.search(r"\brevert", m): return "contradiction"
    if re.search(r"\b(fix|repair|restore|correct|hotfix|bug)", m): return "correction"
    if re.search(r"\b(remove|delete|drop|retire|deprecat)", m): return "rejection"
    c = Counter(statuses)
    if c and c.get("D", 0) > 0.6 * sum(c.values()): return "rejection"
    if re.search(r"\b(add|create|new|initial|launch|build|first)", m): return "create"
    if c and c.get("A", 0) > 0.6 * sum(c.values()): return "create"
    return "revision"


def actor_of(author, body):
    a, b = author.lower(), body.lower()
    if "archive process" in a or "recovery process" in a or "github-actions" in a: return "process"
    if a == "claude" or "co-authored-by: claude" in b or "[claude]" in b or "claude.ai/code" in b: return "claude"
    if "[gpt]" in b or "[codex]" in b or "codex" in a: return "gpt"
    return "human"


def git_events(path, repo):
    sep = "\x1e"
    out = subprocess.run(["git", "-C", path, "log", "--reverse", "--name-status",
                          f"--format={sep}%H\x1f%aI\x1f%an\x1f%B\x1f"],
                         capture_output=True, text=True, check=True).stdout
    rules = SITE_RULES if repo == "site" else REPO_RULES
    evs = []
    for chunk in out.split(sep)[1:]:
        head, _, files = chunk.partition("\x1f\n") if "\x1f\n" in chunk else chunk.rpartition("\x1f")
        h, t, author, body = (head.split("\x1f") + ["", "", "", ""])[:4]
        rows = [l.split("\t") for l in files.strip().splitlines() if "\t" in l]
        statuses = [r[0][0] for r in rows]
        paths = [r[-1] for r in rows]
        if not paths:
            continue
        actor = actor_of(author, body)
        bc = Counter(classify(p, rules) for p in paths)
        branch = bc.most_common(1)[0][0]
        kind = "archive" if actor == "process" else msg_kind(body.split("\n")[0], statuses)
        if author.lower().startswith("mzfs system intake"): kind = "intake"
        mag = min(9, int(round(math.log2(1 + len(paths)))))
        keys = sorted(set(project_key(p, repo) for p in paths))
        evs.append(dict(t=dt.datetime.fromisoformat(t), src="site" if repo == "site" else "archive_repo",
                        actor=actor, branch=branch, kind=kind, mag=mag, keys=keys))
    return evs


TL_KIND = {"Milestone": "breakthrough", "Decision": "decision", "System Change": "system",
           "Build Report": "report", "Handoff": "handoff", "Submission": "breakthrough",
           "Research Update": "report", "Weekly Digest": "digest"}
TL_ACTOR = {"MZ.Human": "human", "MZ.Claude": "claude", "MZ.GPT": "gpt"}


def timeline_events(fn):
    d = json.load(open(fn))
    evs = []
    for created, agent, branches, etype, conf, status, date in d["rows"]:
        c = dt.datetime.fromisoformat(created.replace("Z", "+00:00"))
        day = dt.datetime.fromisoformat(date + "T18:00:00+00:00")
        t = c if (c - day).days <= 1 else day  # back-filled entries go to their stated date
        n = len(branches)
        for i, b in enumerate(branches):
            evs.append(dict(t=t + dt.timedelta(seconds=i), src="timeline", actor=TL_ACTOR.get(agent, "other_agent"),
                            branch=b if b in BRANCHES else "SITE", kind=TL_KIND.get(etype, "report"),
                            mag=max(1, int(round(6 / math.sqrt(n)))), keys=["tl/" + b.lower()]))
    return evs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site"); ap.add_argument("--repo"); ap.add_argument("--timeline")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    evs, provenance = [], {}
    for path, repo in ((a.site, "site"), (a.repo, "archive_repo")):
        if path:
            e = git_events(path, "site" if repo == "site" else "repo")
            head = subprocess.run(["git", "-C", path, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
            provenance[repo] = dict(head=head, commits=len(e))
            evs += e
    if a.timeline:
        e = timeline_events(a.timeline)
        provenance["timeline"] = dict(sha256=hashlib.sha256(open(a.timeline, "rb").read()).hexdigest(), rows=len(e))
        evs += e
    evs.sort(key=lambda e: e["t"])
    # novelty / reactivation flags per project key
    last_seen = {}
    rows = []
    for e in evs:
        flags = 0
        for k in e["keys"]:
            if k not in last_seen:
                flags |= F_NOVEL
            elif (e["t"] - last_seen[k]).days >= REACTIVATION_GAP_DAYS:
                flags |= F_REACT
            last_seen[k] = e["t"]
        if e["actor"] == "process" and flags & F_NOVEL and e["kind"] == "archive":
            flags &= ~F_NOVEL  # automated archive records are not new directions
        tmin = int(e["t"].timestamp() // 60)
        rows.append([tmin, SOURCES.index(e["src"]), ACTORS.index(e["actor"]), BRANCHES.index(e["branch"]),
                     KINDS.index(e["kind"]), e["mag"], flags])
    payload = dict(schema=SCHEMA, specimen="002", built=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                   built_by="MZ.Claude", body="HARIL distributed practice (site repo + mz-archive + HARIL SHARED TIMELINE)",
                   branches=BRANCHES, actors=ACTORS, kinds=KINDS, sources=SOURCES,
                   row=["t_unix_min", "source", "actor", "branch", "kind", "mag", "flags(1=novel,2=reactivation)"],
                   provenance=provenance, events=rows)
    body = json.dumps(rows, separators=(",", ":"))
    payload["events_sha256"] = hashlib.sha256(body.encode()).hexdigest()
    json.dump(payload, open(a.out, "w"), separators=(",", ":"))
    c = Counter((BRANCHES[r[3]]) for r in rows)
    k = Counter((KINDS[r[4]]) for r in rows)
    print(f"{len(rows)} events  {rows[0][0]}..{rows[-1][0]}", file=sys.stderr)
    print(dict(c), file=sys.stderr); print(dict(k), file=sys.stderr)
    print("novel", sum(1 for r in rows if r[6] & 1), "react", sum(1 for r in rows if r[6] & 2), file=sys.stderr)


if __name__ == "__main__":
    main()
