# since.py <ISO time, UTC, e.g. 2026-10-14T00:00:00>: what this lead session and its agents cost since that time,
# at API list prices, read from the session transcripts (usage once per message id). Read-only; prints one line.
# FOLDERS: finds the transcripts from LEAD_SCRATCH. A Claude Code scratch folder looks like
#   /tmp/claude-<uid>/<project-dir>/<session-id>/scratchpad
# and the transcripts are at ~/.claude/projects/<project-dir>/<session-id>.jsonl plus .../<session-id>/subagents/agent-*.jsonl.
# If your layout differs, set CLAUDE_TRANSCRIPTS=<~/.claude/projects/<project-dir>/<session-id>> instead.
import json, glob, os, sys

P = {'opus': (5, 25, 0.5, 6.25, 10), 'sonnet': (3, 15, 0.3, 3.75, 6), 'haiku': (1, 5, 0.1, 1.25, 2), 'fable': (10, 50, 1, 12.5, 20)}
if len(sys.argv) < 2:
    sys.exit('usage: LEAD_SCRATCH=<folder> python3 since.py 2026-10-14T00:00:00')
since = sys.argv[1]
base = os.environ.get('CLAUDE_TRANSCRIPTS')
if not base:
    scr = os.environ.get('LEAD_SCRATCH')
    if not scr:
        sys.exit('set LEAD_SCRATCH (or CLAUDE_TRANSCRIPTS)')
    scr = os.path.abspath(scr)
    session = os.path.basename(os.path.dirname(scr))
    project = os.path.basename(os.path.dirname(os.path.dirname(scr)))
    base = os.path.join(os.path.expanduser('~'), '.claude', 'projects', project, session)
files = glob.glob(base + '/subagents/agent-*.jsonl') + [base + '.jsonl']
files = [f for f in files if os.path.exists(f)]
if not files:
    sys.exit('no transcripts under ' + base)
tot = {'opus': 0, 'sonnet': 0, 'other': 0}
for f in files:
    seen = set()
    for line in open(f, errors='ignore'):
        try:
            d = json.loads(line)
        except Exception:
            continue
        if d.get('type') != 'assistant' or (d.get('timestamp') or '') < since:
            continue
        m = d.get('message') or {}
        mid = m.get('id')
        u = m.get('usage')
        if not u or mid in seen:
            continue
        seen.add(mid)
        mo = m.get('model') or ''
        k = next((x for x in P if x in mo), None)
        if not k:
            continue
        i, o, cr, cw5, cw1 = P[k]
        cc = u.get('cache_creation') or {}
        w1 = cc.get('ephemeral_1h_input_tokens', 0)
        w5 = cc.get('ephemeral_5m_input_tokens', u.get('cache_creation_input_tokens', 0) - w1)
        c = (u.get('input_tokens', 0) * i + u.get('output_tokens', 0) * o + u.get('cache_read_input_tokens', 0) * cr + w5 * cw5 + w1 * cw1) / 1e6
        tot[k if k in tot else 'other'] += c
print({k: round(v) for k, v in tot.items()}, 'sum', round(sum(tot.values())))
