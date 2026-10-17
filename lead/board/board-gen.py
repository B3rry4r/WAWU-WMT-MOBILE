#!/usr/bin/env python3
"""Render the owner's build board from ONE facts file, lead/board/board.json.

FOLDERS: reads LEAD_SCRATCH (default: a `scratch/` folder next to the repo). Output goes to $LEAD_SCRATCH/board/.

    python3 board-gen.py                 build $LEAD_SCRATCH/board/board.html (bumps lead/board/.version)
    python3 board-gen.py --json X --out Y [--no-bump]   build from another facts file

Read LIVE at build time (they override board.json):
  * every PR in `prs` (and every card `pr`): open, merged or closed (gh api repos/<repo>/pulls/<n>)
  * every card in Ready to merge / Merging now that names a `branch`: head already in main?
  * "Updated" = date -u, "app main" = the mobile repo's main head (git ls-remote)

A merged PR's cards leave Ready to merge, Merging now and Waiting on you and appear in
Merged recently; chain nodes of those tasks turn done. Stale facts are refused: the build
prints each failure, exits 1 and writes nothing. Only read-only GETs are made on GitHub.
"""
import argparse, concurrent.futures as cf, datetime as dt, html, json, os, re, subprocess, sys, tempfile
import urllib.parse

# FOLDERS: this tool reads LEAD_SCRATCH (the lead's working folder; default: a `scratch/` folder next to the repo,
# i.e. <repo>/../scratch). Inputs stay in the repo beside this file (board.json, head.html, .version); everything it
# writes (board.html, last-build.*, .cache) goes to $LEAD_SCRATCH/board/.
HERE = os.path.dirname(os.path.abspath(__file__))                          # <repo>/lead/board
REPO = os.path.dirname(os.path.dirname(HERE))
SCRATCH = os.path.abspath(os.environ.get("LEAD_SCRATCH") or os.path.join(os.path.dirname(REPO), "scratch"))
B = os.path.join(SCRATCH, "board")
os.makedirs(B, exist_ok=True)

# ---------------------------------------------------------------- icons and tones
def svg(size, inner):
    return ('<svg class="i" width="%d" height="%d" viewBox="0 0 20 20" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, inner))

IC = {
    "check": '<path d="M5 10.5l3.2 3.2L15 7" />',
    "merge": '<path d="M7 5v10M7 9c4 0 6 1 6 6" /><circle cx="13" cy="5" r="1.6" />',
    "build": '<path d="M10 4v3M10 13v3M4 10h3M13 10h3" />',
    "look": '<circle cx="9" cy="9" r="4" /><path d="M12 12l4 4" />',
    "dot": '<circle cx="10" cy="10" r="1.4" />',
    "alert": '<path d="M10 6v5M10 14v.01" />',
    "arrow": '<path d="M4 10h9M10 6l4 4-4 4" />',
    "clock": '<circle cx="10" cy="10" r="6" /><path d="M10 7v3.2l2 1.4" />',
    "stop": '<path d="M6.5 6.5h7v7h-7z" />',
}
TONE = {
    "ok": ("var(--positive)", "var(--positive-tint)"),
    "run": ("var(--accent-fg)", "var(--accent-tint)"),
    "info": ("var(--info)", "var(--info-tint)"),
    "bad": ("var(--danger)", "var(--danger-tint)"),
    "mute": ("var(--text-muted)", "var(--surface-sunken)"),
}
STATE = {  # chain node state -> (tone, icon)
    "done": ("ok", "check"), "merging": ("ok", "arrow"), "ready": ("ok", "merge"),
    "queued": ("info", "clock"), "checking": ("info", "look"), "building": ("run", "build"),
    "blocked": ("bad", "alert"), "todo": ("mute", "dot"),
}
COLS = [  # key, title, tone, icon  (fixed set, in page order)
    ("building", "Building", "run", "build"),
    ("checking", "Checking", "info", "look"),
    ("check_queued", "Check queued", "info", "clock"),
    ("merging", "Merging now", "ok", "arrow"),
    ("ready", "Ready to merge", "ok", "merge"),
    ("waiting", "Waiting on you", "bad", "alert"),
    ("queued", "Queued next", "mute", "dot"),
    ("stopped", "Stopped", "mute", "stop"),
]
MOVE_FROM = ("ready", "merging", "waiting")      # columns a merged card leaves
BRANCH_COLS = ("ready", "merging")               # columns whose branches are checked
NOTE_TONES = ("accent-fg", "positive", "info", "warning", "danger")
EMDASH = re.compile("\u2014|&mdash;|&#0*8212;|&#x0*2014;", re.I)

# text nodes keep quotes raw (like the published page); attributes are fully escaped
et = lambda s: html.escape(str(s), quote=False)
ea = lambda s: html.escape(str(s), quote=True)
norm = lambda s: re.sub(r"\s+", " ", str(s)).strip().lower()
tid_norm = lambda s: re.sub(r"\s+", " ", str(s)).strip().upper()

# ---------------------------------------------------------------- live reads (GET only)
class LiveError(Exception):
    pass

def sh(cmd, timeout=90, retries=2):
    last = ""
    for _ in range(retries + 1):
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            last = "timed out"; continue
        if r.returncode == 0:
            return r.stdout
        last = (r.stdout + r.stderr).strip()
        if '"status":"404"' in last or "HTTP 404" in last:
            break
    raise LiveError(last[:300] or "failed")

def gh_get(path):
    assert path.startswith("repos/"), path        # only ever a read-only GET of a repo path
    return json.loads(sh(["gh", "api", path]))

def utc_now():
    return dt.datetime.strptime(sh(["date", "-u", "+%Y-%m-%dT%H:%M:%S"], retries=0).strip(), "%Y-%m-%dT%H:%M:%S")

def parse_branch(s):
    m = re.match(r"^\s*(\S+/\S+)\s+(\S.*?)\s*$", s)
    if not m:
        raise LiveError("bad branch field %r (want 'owner/repo branch')" % s)
    return m.group(1), m.group(2)

def parse_pr(s):
    m = re.match(r"^\s*(\S+/[^#\s]+)#(\d+)\s*$", s)
    if not m:
        raise LiveError("bad pr field %r (want 'owner/repo#123')" % s)
    return m.group(1), int(m.group(2))

class Live:
    """Everything read from the outside world, so the rules below can be tested on a fixture."""
    def __init__(self):
        self.now = None
        self.prs = {}        # (repo, n) -> {"state","merged","merged_at","title"} or {"error": ...}
        self.branches = {}   # (repo, branch) -> "merged" | "open" | "missing" | "error: ..."
        self.app_main = None

def fetch_live(data, prs_needed, branches_needed):
    live = Live()
    live.now = utc_now()
    mobile = data["meta"]["mobile_repo"]
    url = "https://github.com/%s.git" % mobile

    def one_pr(key):
        repo, n = key
        if repo == mobile:
            return key, {"error": "PRs of the app repo cannot be read here; name the card's branch instead"}
        try:
            j = gh_get("repos/%s/pulls/%d" % (repo, n))
            return key, {"state": j["state"], "merged": bool(j.get("merged")), "merged_at": j.get("merged_at"),
                         "title": j.get("title", "")}
        except (LiveError, ValueError, KeyError) as ex:
            return key, {"error": str(ex)}

    def one_branch_gh(key):
        repo, br = key
        try:
            j = gh_get("repos/%s/compare/main...%s?per_page=1" % (repo, urllib.parse.quote(br, safe="/")))
            return key, "merged" if j.get("status") in ("identical", "behind") else "open"
        except LiveError as ex:
            if "404" in str(ex) or "No commit found" in str(ex) or "Not Found" in str(ex):
                return key, "missing"
            return key, "error: %s" % ex

    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        for key, info in ex.map(one_pr, sorted(prs_needed)):
            live.prs[key] = info
        gh_branches = sorted(k for k in branches_needed if k[0] != mobile)
        for key, res in ex.map(one_branch_gh, gh_branches):
            live.branches[key] = res

    # the app repo: git only (gh cannot read it); a bare treeless cache keeps this fast
    mob = sorted(k for k in branches_needed if k[0] == mobile)
    try:
        refs = ["refs/heads/main"] + ["refs/heads/%s" % b for _, b in mob]
        out = sh(["git", "ls-remote", url] + refs)
        heads = {}
        for line in out.splitlines():
            sha, ref = line.split("\t")
            heads[ref] = sha
        if "refs/heads/main" not in heads:
            raise LiveError("no main on the app repo")
        live.app_main = heads["refs/heads/main"]
        if mob:
            cache = os.path.join(B, ".cache", "mobile.git")
            if not os.path.isdir(cache):
                os.makedirs(os.path.dirname(cache), exist_ok=True)
                sh(["git", "init", "-q", "--bare", cache], retries=0)
            specs = ["+refs/heads/main:refs/remotes/m/main"]
            for _, b in mob:
                if "refs/heads/%s" % b in heads:
                    specs.append("+refs/heads/%s:refs/remotes/m/b/%s" % (b, b))
            sh(["git", "--git-dir", cache, "fetch", "-q", "--filter=tree:0", "--no-tags", url] + specs, timeout=300)
            for _, b in mob:
                key = (mobile, b)
                if "refs/heads/%s" % b not in heads:
                    live.branches[key] = "missing"; continue
                r = subprocess.run(["git", "--git-dir", cache, "merge-base", "--is-ancestor",
                                    "refs/remotes/m/b/%s" % b, "refs/remotes/m/main"], capture_output=True, text=True)
                live.branches[key] = "merged" if r.returncode == 0 else ("open" if r.returncode == 1 else "error: " + r.stderr.strip())
    except LiveError as ex:
        live.app_main = live.app_main or None
        for _, b in mob:
            live.branches.setdefault((mobile, b), "error: %s" % ex)
        if live.app_main is None:
            live.app_main_error = str(ex)
    return live

# ---------------------------------------------------------------- facts: load and validate
def load_facts(path):
    errs = []
    try:
        data = json.load(open(path, encoding="utf8"))
    except (OSError, ValueError) as ex:
        return None, ["board.json cannot be read: %s" % ex]
    need_top = ["meta", "stats", "needs", "chains", "columns", "news", "areas", "merged", "questions", "prs"]
    for k in need_top:
        if k not in data:
            errs.append("board.json: missing '%s'" % k)
    if errs:
        return None, errs
    qids = set()
    for q in data["questions"]:
        for f in ("id", "text", "status"):
            if not q.get(f):
                errs.append("question %s: missing '%s'" % (q.get("id", "?"), f))
        if q.get("id") in qids:
            errs.append("question id %s appears twice" % q.get("id"))
        qids.add(q.get("id"))
        if q.get("status") not in ("open", "answered"):
            errs.append("question %s: status must be open or answered" % q.get("id"))
        if q.get("status") == "answered" and not (q.get("answer") and q.get("date")):
            errs.append("question %s is answered but has no answer or date" % q.get("id"))
    for i, n in enumerate(data["needs"], 1):
        if not n.get("title"):
            errs.append("needs item %d has no title" % i)
        for p in n.get("pills", []):
            if isinstance(p, dict) and p.get("q") not in qids:
                errs.append("needs item %d names unknown question %s" % (i, p.get("q")))
        if n.get("q") and n["q"] not in qids:
            errs.append("needs item %d names unknown question %s" % (i, n["q"]))
    cols = data["columns"]
    for key, *_ in COLS:
        if key not in cols or not isinstance(cols[key], list):
            errs.append("columns: missing list '%s'" % key)
    for key in cols:
        if key not in [c[0] for c in COLS]:
            errs.append("columns: unknown column '%s'" % key)
    for key, lst in cols.items():
        for c in lst if isinstance(lst, list) else []:
            if not c.get("id") or not c.get("title"):
                errs.append("column %s: a card has no id or title" % key)
            if c.get("q") and c["q"] not in qids:
                errs.append("card %s names unknown question %s" % (c.get("id"), c["q"]))
    for ch in data["chains"]:
        if not ch.get("nodes"):
            errs.append("chain '%s' has no nodes" % ch.get("title"))
        for nd in ch.get("nodes", []):
            if nd.get("state") not in STATE:
                errs.append("chain '%s' node %s: state %r is not one of %s" % (ch.get("title"), nd.get("id"), nd.get("state"), "/".join(STATE)))
            if not nd.get("id") or not nd.get("label"):
                errs.append("chain '%s': a node has no id or label" % ch.get("title"))
    for n in data["news"]:
        try:
            dt.date.fromisoformat(n["date"])
        except (KeyError, ValueError):
            errs.append("news %r: date must be YYYY-MM-DD" % n.get("text", "?")[:40])
        if n.get("tone") not in NOTE_TONES:
            errs.append("news %r: tone must be one of %s" % (n.get("text", "?")[:40], "/".join(NOTE_TONES)))
    for a in data["areas"]:
        if not (isinstance(a.get("done"), int) and isinstance(a.get("total"), int) and 0 <= a["done"] <= a["total"] and a["total"] > 0):
            errs.append("area %s: need 0 <= done <= total, total > 0" % a.get("name"))
    for p in data["prs"]:
        if not (p.get("repo") and isinstance(p.get("number"), int) and isinstance(p.get("tasks"), list)):
            errs.append("prs: each needs repo, number (int) and tasks (list): %r" % p)
        elif p["repo"] == data["meta"]["mobile_repo"]:
            errs.append("prs: %s#%d is on the app repo, which gh cannot read; name the card's branch instead" % (p["repo"], p["number"]))
    for k in ("launch_done", "launch_total"):
        if not isinstance(data["stats"].get(k), int):
            errs.append("stats.%s must be a number" % k)
    return (None if errs else data), errs

# ---------------------------------------------------------------- the rules
def card_branches(c):
    b = c.get("branch")
    return [] if not b else ([b] if isinstance(b, str) else list(b))

def needed_live(data):
    prs, branches = set(), set()
    for p in data["prs"]:
        prs.add((p["repo"], p["number"]))
    for lst in data["columns"].values():
        for c in lst:
            if c.get("pr"):
                prs.add(parse_pr(c["pr"]))
    for n in data["needs"]:
        if n.get("pr"):
            prs.add(parse_pr(n["pr"]))
    for key in BRANCH_COLS:
        for c in data["columns"][key]:
            for b in card_branches(c):
                branches.add(parse_branch(b))
    return prs, branches

def apply_live(data, live, log):
    """Return (resolved data, failures). `data` is not modified."""
    fails = []
    d = json.loads(json.dumps(data))
    cols = d["columns"]
    qs = {q["id"]: q for q in d["questions"]}

    # --- PR facts
    pr_tasks = {}                 # (repo,n) -> set of task ids (prs entries plus cards naming the PR)
    for p in d["prs"]:
        pr_tasks.setdefault((p["repo"], p["number"]), set()).update(tid_norm(t) for t in p["tasks"])
    for key, lst in cols.items():
        for c in lst:
            if c.get("pr"):
                pr_tasks.setdefault(parse_pr(c["pr"]), set()).add(tid_norm(c["id"]))
    merged_task = {}              # task id -> (repo, n, merged_at)
    closed_task = {}              # task id -> (repo, n)
    for key, tasks in pr_tasks.items():
        info = live.prs.get(key, {"error": "not read"})
        if "error" in info:
            fails.append("cannot read PR %s#%d: %s" % (key[0], key[1], info["error"]))
            continue
        if info["merged"]:
            for t in tasks:
                merged_task[t] = (key[0], key[1], info.get("merged_at") or "")
        elif info["state"] == "closed":
            for t in tasks:
                closed_task[t] = key

    # --- branch facts (Ready to merge, Merging now)
    branch_merged = {}
    for key in BRANCH_COLS:
        for c in cols[key]:
            bl = card_branches(c)
            if not bl:
                continue
            states = []
            for b in bl:
                try:
                    rb = parse_branch(b)
                except LiveError as ex:
                    fails.append("%s: %s" % (c["id"], ex)); states.append("error"); continue
                s = live.branches.get(rb, "error: not read")
                if s == "missing":
                    fails.append("%s: branch %s %s not found on GitHub; if it merged and was deleted, give the card its PR; otherwise fix the name" % (c["id"], rb[0], rb[1]))
                elif s.startswith("error"):
                    fails.append("%s: cannot read branch %s %s (%s)" % (c["id"], rb[0], rb[1], s))
                states.append(s)
            if states and all(s == "merged" for s in states):
                branch_merged[tid_norm(c["id"])] = True

    # --- move merged cards
    auto = []                     # merged recently entries made now
    moved_ids = set()
    for key in MOVE_FROM:
        keep = []
        for c in cols[key]:
            t = tid_norm(c["id"])
            if t in merged_task:
                repo, n, at = merged_task[t]
                auto.append({"id": c["id"], "text": "%s (merged)" % c["title"], "at": at})
                log("moved %s from %s to Merged recently (PR %s#%d merged)" % (c["id"], dict((k, ti) for k, ti, *_ in COLS)[key], repo, n))
                moved_ids.add(t)
            elif t in branch_merged:
                auto.append({"id": c["id"], "text": "%s (merged)" % c["title"], "at": ""})
                log("moved %s from %s to Merged recently (branch already in main)" % (c["id"], dict((k, ti) for k, ti, *_ in COLS)[key]))
                moved_ids.add(t)
            else:
                keep.append(c)
        cols[key] = keep
    # chain nodes of merged work turn done
    for ch in d["chains"]:
        for nd in ch["nodes"]:
            t = tid_norm(nd["id"])
            if (t in merged_task or t in moved_ids) and nd["state"] != "done":
                nd["state"] = "done"; nd["note"] = "merged"; nd.pop("live", None)
                log("chain node %s is done (merged)" % nd["id"])
    # needs items tied to a PR that is no longer open go away
    keepn = []
    for n in d["needs"]:
        if n.get("pr"):
            info = live.prs.get(parse_pr(n["pr"]), {})
            if info and "error" not in info and (info["merged"] or info["state"] == "closed"):
                log("dropped Needs you item %r (its PR is %s)" % (n["title"], "merged" if info["merged"] else "closed"))
                continue
        keepn.append(n)
    d["needs"] = keepn
    # merged recently: new ones first (newest merge first), then the stored list, no repeats
    auto.sort(key=lambda a: a["at"], reverse=True)
    seen = {tid_norm(m["id"]) for m in d["merged"]}
    fresh = []
    for a in auto:
        if tid_norm(a["id"]) not in seen:
            fresh.append({"id": a["id"], "text": a["text"]}); seen.add(tid_norm(a["id"]))
    d["merged"] = (fresh + d["merged"])[: d["meta"].get("merged_show", 20)]

    # ---------------- stale checks on what is left
    # 1. answered question still shown as a need
    def q_stale(where, q):
        fails.append("answered question %s (%s) still shown in %s" % (q["id"], q["text"], where))
    answered_text = {norm(q["text"]): q for q in d["questions"] if q["status"] == "answered"}
    for i, n in enumerate(d["needs"], 1):
        label = "Needs you item %d" % i
        if n.get("q") and qs[n["q"]]["status"] == "answered":
            q_stale(label, qs[n["q"]])
        elif norm(n["title"]) in answered_text:
            q_stale(label, answered_text[norm(n["title"])])
        for p in n.get("pills", []):
            if isinstance(p, dict):
                if qs[p["q"]]["status"] == "answered":
                    q_stale(label, qs[p["q"]])
            elif norm(p) in answered_text:
                q_stale(label, answered_text[norm(p)])
    for key, lst in cols.items():
        for c in lst:
            if c.get("q") and qs[c["q"]]["status"] == "answered":
                fails.append("card %s (%s) still waits on answered question %s" % (c["id"], key, c["q"]))
    # 2. task in two columns
    where = {}
    for key, title, *_ in COLS:
        for c in cols[key]:
            where.setdefault(tid_norm(c["id"]), []).append(title)
    for t, w in sorted(where.items()):
        if len(w) > 1:
            fails.append("task %s appears %d times: %s" % (t, len(w), ", ".join(w)))
    # 3. merged or closed PR / merged branch still shown as open work
    titles = {k: t for k, t, *_ in COLS}
    for key in cols:
        for c in cols[key]:
            t = tid_norm(c["id"])
            if t in merged_task:
                repo, n, _ = merged_task[t]
                fails.append("%s is in '%s' but PR %s#%d is merged" % (c["id"], titles[key], repo, n))
            elif t in closed_task and key in MOVE_FROM:
                repo, n = closed_task[t]
                fails.append("%s is in '%s' but PR %s#%d was closed without merging" % (c["id"], titles[key], repo, n))
    # 4. news
    news = d["news"]
    today = live.now.date()
    maxage = d["meta"].get("news_max_age_days", 7)
    if not news:
        fails.append("What's new is empty")
    else:
        dates = [dt.date.fromisoformat(n["date"]) for n in news]
        if dates[0] < today - dt.timedelta(days=maxage):
            fails.append("news at the top is %d days old (%s: %s); the limit is %d" % ((today - dates[0]).days, news[0]["date"], news[0]["text"][:50], maxage))
        for i, x in enumerate(dates):
            if x > today:
                fails.append("news dated in the future: %s %s" % (news[i]["date"], news[i]["text"][:50]))
            if i and x > dates[i - 1]:
                fails.append("news is not newest first at %s %s" % (news[i]["date"], news[i]["text"][:50]))
    # 5. counts
    s = d["stats"]
    sd, st = sum(a["done"] for a in d["areas"]), sum(a["total"] for a in d["areas"])
    if s["launch_done"] != sd:
        fails.append("stats.launch_done is %d but the areas add up to %d" % (s["launch_done"], sd))
    if s["launch_total"] != st:
        fails.append("stats.launch_total is %d but the areas add up to %d" % (s["launch_total"], st))
    if live.app_main is None:
        fails.append("cannot read the app repo's main head (%s)" % getattr(live, "app_main_error", "?"))
    return d, fails

# ---------------------------------------------------------------- render
def fmt_day(iso):
    x = dt.date.fromisoformat(iso)
    return "%d %s" % (x.day, x.strftime("%b"))

def render(d, live, version):
    cols = d["columns"]
    s = d["stats"]
    done, total = s["launch_done"], s["launch_total"]
    pct = round(100 * done / total)
    dash = round(2 * 3.141592653589793 * 52 * done / total, 1)
    agents = len(cols["building"]) + len(cols["checking"])
    need_n = len(d["needs"])
    blocked = len(cols["waiting"])
    stamp = "%d %s, %s UTC" % (live.now.day, live.now.strftime("%b"), live.now.strftime("%H:%M"))
    qs = {q["id"]: q for q in d["questions"]}
    out = []
    A = out.append
    A('<main class="wrap">')
    A('<header class="top"><span class="mark">W</span><h1>Build board</h1>')
    A('<span class="sub"><span class="chip">Updated %s</span><span class="chip">app main %s</span></span></header>' % (stamp, live.app_main[:7]))
    A('')
    A('<section class="hero">')
    A('<div class="card launch"><div class="ringbox"><svg viewBox="0 0 120 120" class="ring" aria-hidden="true"><circle cx="60" cy="60" r="52" class="rt"/><circle cx="60" cy="60" r="52" class="rv" stroke-dasharray="%s 326.7"/></svg><b>%d%%</b></div>' % (dash, pct))
    A('<div class="lt"><strong>Launch work done</strong><span>%d of %d launch tasks built and checked</span></div></div>' % (done, total))
    A('<div class="card stat run"><span class="big">%d</span><span class="lbl">Agents working now</span></div>' % agents)
    A('<div class="card stat alert"><span class="big">%d</span><span class="lbl">Need you</span></div>' % need_n)
    A('<div class="card stat wait"><span class="big">%d</span><span class="lbl">Blocked</span></div>' % blocked)
    A('</section>')
    A('')

    # needs you
    rows = []
    for i, n in enumerate(d["needs"], 1):
        extra = "".join('<a class="btn" href="%s">%s</a>' % (ea(b["href"]), et(b["text"])) for b in n.get("buttons", []))
        if n.get("pills"):
            pills = "".join('<span class="pill" style="--fg:var(--text-secondary);--bg:var(--surface-card)">%s</span>'
                            % et(qs[p["q"]]["text"] if isinstance(p, dict) else p) for p in n["pills"])
            inner = '<span class="legend">%s</span>' % pills
        else:
            inner = '<span>%s</span>' % et(n.get("sub", ""))
        rows.append('<li class="need"><span class="nn">%d</span><span class="nt"><b>%s</b>%s</span>%s</li>' % (i, et(n["title"]), inner, extra))
    A('<section class="card needs"><p class="eyebrow">Needs you</p><ol>' + "".join(rows) + '</ol></section>')
    A('')

    # goals in motion
    def step(nd):
        tone, icon = STATE[nd["state"]]
        fg, bg = TONE[tone]
        note = ('<span class="nnote">%s</span>' % et(nd["note"])) if nd.get("note") else ""
        return ('<li class="step"><div class="node%s" style="--fg:%s;--bg:%s"><span class="dot">%s</span>'
                '<span class="ntext"><span class="nid">%s</span><span class="nl">%s</span>%s</span></div></li>'
                % (" live" if nd.get("live") else "", fg, bg, svg(18, IC[icon]), et(nd["id"]), et(nd["label"]), note))
    chains = []
    for ch in d["chains"]:
        n = sum(1 for x in ch["nodes"] if x["state"] == "done")
        m = len(ch["nodes"])
        steps = "".join(step(x) for x in ch["nodes"] if not x.get("hidden"))
        chains.append('<section class="card chain"><header class="ch"><h3>%s</h3><span class="frac">%d<span>/%d</span></span></header>'
                      '<div class="track"><span style="width:%d%%"></span></div><ol class="steps">%s</ol></section>'
                      % (et(ch["title"]), n, m, round(100 * n / m), steps))
    A('<section><p class="eyebrow">Goals in motion</p><div class="chains">' + "".join(chains) + '</div></section>')
    A('')

    # task board
    def card(c):
        note = ""
        if c.get("note"):
            note = '<span class="tnote"%s>%s</span>' % ("" if c.get("alert") else ' style="color:var(--text-muted)"', et(c["note"]))
        return ('<li class="task"><span class="tid">%s</span><span class="tl">%s</span>%s'
                '<span class="who" style="--h:var(--accent)" title="Lead">L</span></li>' % (et(c["id"]), et(c["title"]), note))
    colhtml = []
    for key, title, tone, icon in COLS:
        fg, bg = TONE[tone]
        cards = cols[key]
        colhtml.append('<section class="col" style="--fg:%s;--bg:%s"><header><span class="cdot">%s</span><h3>%s</h3><span class="count">%d</span></header><ul>%s</ul></section>'
                       % (fg, bg, svg(14, IC[icon]), et(title), len(cards), "".join(card(c) for c in cards)))
    A('<section><p class="eyebrow">Task board</p><div class="board">')
    A("\n".join(colhtml) + '</div></section>')
    A('')

    # what's new and areas
    shown = d["news"][: d["meta"].get("news_show", 12)]
    li = "".join('<li style="--k:var(--%s)"><time>%s</time><span>%s</span></li>' % (n["tone"], fmt_day(n["date"]), et(n["text"])) for n in shown)
    A('<div class="duo">')
    A('<section class="card news"><p class="eyebrow">What\'s new</p><ol>' + li + '</ol></section>')
    al = "".join('<li><span class="an">%s</span><span class="bar"><span style="width:%d%%"></span></span><span class="af">%d<span>/%d</span></span></li>'
                 % (et(a["name"]), round(100 * a["done"] / a["total"]), a["done"], a["total"]) for a in d["areas"])
    A('<section class="card areas"><p class="eyebrow">Launch progress by area</p><ul>' + al + '</ul></section>')
    A('</div>')
    A('')

    # merged recently
    dl = "".join('<li><span class="tid">%s</span>%s</li>' % (et(m["id"]), et(m["text"])) for m in d["merged"])
    A('<section class="card done"><p class="eyebrow">Merged recently</p><ul>' + dl + '</ul></section>')
    A('</main>')
    return "\n".join(out), stamp

def audit(body, d, fails):
    """Re-read the finished page and check every printed number against the list it counts."""
    hero = dict((lbl, int(n)) for n, lbl in re.findall(r'<span class="big">(\d+)</span><span class="lbl">([^<]*)', body))
    cols_html = re.findall(r'<section class="col".*?<h3>([^<]*)</h3><span class="count">(\d+)</span></header><ul>(.*?)</ul></section>', body, re.S)
    got = {t: (int(c), len(re.findall(r'<li class="task">', ul))) for t, c, ul in cols_html}
    for t, (c, n) in got.items():
        if c != n:
            fails.append("column '%s' says %d but lists %d" % (t, c, n))
    if len(got) != len(COLS):
        fails.append("the page has %d columns, expected %d" % (len(got), len(COLS)))
    if hero.get("Agents working now") != got.get("Building", (0, 0))[1] + got.get("Checking", (0, 0))[1]:
        fails.append("Agents working now says %s but Building + Checking list %d" % (hero.get("Agents working now"), got.get("Building", (0, 0))[1] + got.get("Checking", (0, 0))[1]))
    if hero.get("Blocked") != got.get("Waiting on you", (0, 0))[1]:
        fails.append("Blocked says %s but Waiting on you lists %d" % (hero.get("Blocked"), got.get("Waiting on you", (0, 0))[1]))
    nrows = len(re.findall(r'<li class="need">', body))
    if hero.get("Need you") != nrows:
        fails.append("Need you says %s but %d items are listed" % (hero.get("Need you"), nrows))
    nums = [int(x) for x in re.findall(r'<span class="nn">(\d+)</span>', body)]
    if nums != list(range(1, nrows + 1)):
        fails.append("Needs you numbering is %s" % nums)
    # chains: printed n/m equals the node list
    for ch, (fn, fm) in zip(d["chains"], [(int(a), int(b)) for a, b in re.findall(r'class="frac">(\d+)<span>/(\d+)', body)]):
        n = sum(1 for x in ch["nodes"] if x["state"] == "done")
        if (fn, fm) != (n, len(ch["nodes"])):
            fails.append("chain '%s' says %d/%d but its nodes are %d/%d" % (ch["title"], fn, fm, n, len(ch["nodes"])))
    if len(re.findall(r'class="frac"', body)) != len(d["chains"]):
        fails.append("the page shows %d chains, facts have %d" % (len(re.findall(r'class="frac"', body)), len(d["chains"])))
    # areas add up to the launch figures
    af = [(int(a), int(b)) for a, b in re.findall(r'<span class="af">(\d+)<span>/(\d+)</span>', body)]
    m = re.search(r'<span>(\d+) of (\d+) launch tasks built and checked', body)
    if not m or (sum(a for a, _ in af), sum(b for _, b in af)) != (int(m.group(1)), int(m.group(2))):
        fails.append("the launch figure %s does not equal the area rows (%d of %d)" % (m.group(0) if m else "?", sum(a for a, _ in af), sum(b for _, b in af)))
    pct = re.search(r'<b>(\d+)%</b>', body)
    if m and (not pct or int(pct.group(1)) != round(100 * int(m.group(1)) / int(m.group(2)))):
        fails.append("the ring percentage does not match the launch figure")
    # no em-dash anywhere in what is shown
    for mm in EMDASH.finditer(body):
        ctx = re.sub(r"<[^>]*>", " ", body[max(0, mm.start() - 40): mm.end() + 40])
        fails.append("em-dash in visible text: ...%s..." % re.sub(r"\s+", " ", ctx).strip())

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default=os.path.join(HERE, "board.json"))
    ap.add_argument("--out", default=os.path.join(B, "board.html"))
    ap.add_argument("--head", default=os.path.join(HERE, "head.html"))
    ap.add_argument("--no-bump", action="store_true", help="do not advance lead/board/.version")
    args = ap.parse_args()
    default_out = os.path.abspath(args.out) == os.path.join(B, "board.html")
    notes = []
    log = notes.append

    data, errs = load_facts(args.json)
    if errs:
        for e_ in errs:
            print("FAIL " + e_, file=sys.stderr)
        return 1
    try:
        prs, branches = needed_live(data)
        live = fetch_live(data, prs, branches)
        head = open(args.head, "rb").read()
        if not head.endswith(b"</style>\n") or b"<main" in head:
            raise LiveError("head.html must end at </style> and hold no <main>")
    except (LiveError, OSError) as ex:
        print("FAIL %s" % ex, file=sys.stderr)
        return 1
    d, fails = apply_live(data, live, log)
    verfile = os.path.join(HERE, ".version")
    try:
        cur = int(open(verfile).read().strip())
    except (OSError, ValueError):
        cur = 0
    version = cur + 1
    body = ""
    if live.app_main:
        body, stamp = render(d, live, version)
        audit(body, d, fails)
    if fails:
        for f in fails:
            print("FAIL " + f, file=sys.stderr)
        print("board not written (%d stale or broken fact%s)" % (len(fails), "" if len(fails) == 1 else "s"), file=sys.stderr)
        return 1
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(args.out)), prefix=".board-", suffix=".tmp")
    with os.fdopen(fd, "wb") as fh:
        fh.write(head + body.encode("utf8") + b"\n\n</body></html>")
    os.replace(tmp, args.out)
    if default_out and not args.no_bump:
        open(verfile, "w").write("%d\n" % version)
    log_path = os.path.join(B, "last-build.log")
    if default_out:
        with open(log_path, "w", encoding="utf8") as fh:
            fh.write("v%d %s\n" % (version, stamp))
            for n in notes:
                fh.write("  auto: %s\n" % n)
    for n in notes:
        print("auto: " + n, file=sys.stderr)
    print("OK v%d %s" % (version, stamp))
    return 0

if __name__ == "__main__":
    sys.exit(main())
