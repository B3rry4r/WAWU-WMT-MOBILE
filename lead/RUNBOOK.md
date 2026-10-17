# RUNBOOK: how to be the lead of this build

You orchestrate. You do not write task code. Builders and verifiers are Sonnet agents; you brief them, read their
reports, rule, merge (with the owner's approval) and keep the owner's board true. Read HANDOFF.md first for where
things stand; this file is how to run it. Tools are in `tools/` and `board/`; history is in `history/`.

## 1. The owner's rules (paste this section into the new account's global CLAUDE.md)
- Every agent and subagent is started with `model: "sonnet"`. Never Opus, never an unset model (unset inherits Opus).
  A resumed agent keeps its model, so an Opus agent is never resumed. Reason: the owner's plan limit burned on Opus fleets.
- At most about 5 agents at once (formula min(CPUs + 1, GB / 2.5); 4 CPUs and 15 GB gave 5). Past it, builds fail on
  timeouts and memory kills and need reruns (LESSONS D9).
- The lead writes no task code. The lead (Opus) only orchestrates, rules and merges.
- Show only what is built (R-47, 9 Oct): no do-nothing button, no placeholder row or tile for an unbuilt screen. The task
  that builds a screen adds its entry. Finished sections stay drawn with their designed empty state.
- Pages for the owner are visual (steppers, boards, bars, timelines), short labels, no paragraphs, in the WAWU design:
  Alan Sans, WAWU Purple #9411C9 as the one accent, WAWU tokens, dark first with a light theme. The owner does not
  read write-ups; an ugly or text-heavy page is a defect.
- The app comes first (R-49, 10 Oct): the backend it needs follows, money core first. Web work is paused;
  wawuafrica.com serves only the registration link /join. Every open developer task is the lead's; continue branches,
  never restart them.
- The website is dark only (12 Oct): never add or picture a light mode there. The app keeps light and dark.
- Gate every push on the check log's own last line (`EXIT 0`), never on a background job's exit code.
- No em-dashes in anything a person reads (R-5). Agents never address the owner; they report to you.
- The mobile repo's DECISIONS.md outranks every other document. Quote the owner's own words in a brief; ask when a
  phrase can be read two ways; never claim what you cannot see (LESSONS B6).

## 2. Where things live (mobile repo, MOXN-AFRICA/wawu-wmt-mobile)
- `DECISIONS.md`: rulings R-1 to R-69 and counting, with who and when. Add each new owner answer as the next R-number.
- `tasks/<ID>.md`: one file per task (Current state, how to verify, builder and verifier report). `tasks/INDEX.md` is
  generated (`npm run tasks`, never by hand). `tasks/DESIGN-V2-CUT.md`: the 38 new-design tasks in 6 waves.
- `BACKEND_GAPS.md`: gaps and the owner questions (G-numbers). `SHARED-CHANGES.md`: every change to a fenced file
  (`prisma/schema.prisma`, `src/common/**`, `src/app.module.ts`, auth guards, `contract/**`) gets a row.
- `tasks/SWEEP-APP|AUTH|EVENTS|INBOX|JOIN|MONEY|WEB.md`: where low findings go (no new round for a low).
- `docs/WORKFLOW.md`: the build and verify rules for every repo. `docs/contract/`: the API contract (kobo, `+234`,
  one error shape, `Idempotency-Key`, cursor pages). Backend `CLAUDE.md` and the mobile `CLAUDE.md` hold the repo rules.
- `lead/history/verify/*.md`: every check report. `lead/history/merge-notes.md`: the running log, newest at the end.
  `lead/history/owner-answers-16oct.md`: the 28 answers of 16 Oct. `lead/LESSONS.md`: what the first 16 days taught.

## 3. The loop: builder, independent verifier, severity, rulings
1. Brief: `LEAD_SCRATCH=<folder> python3 lead/tools/mk.py b|v ID "TITLE" BUDGET "PORTS" STAMP "EXTRA" [FROMNOTE] [SUFFIX]`
   writes `$LEAD_SCRATCH/prompts/{b|v}-ID[-SUFFIX].txt` from the templates and renders common-rules.md there. Give
   the agent one line: read that file. EXTRA is where the lead's rulings and the branch heads go. Never put backticks
   in a double-quoted EXTRA argument (the shell runs them). Rounds use the SUFFIX `r2`, `r3`.
2. The builder works branch `wmt/<ID>` in each repo it changes, in its own worktrees, with its own ports and stamp,
   runs only the specs it touched, pushes, and hands back in 15 lines (heads per repo, stamp, checks, CI run ids).
3. A different, fresh agent verifies. The builder's report is a list of claims to test, not to trust. The verifier
   attacks (parallel requests, replays, wrong role, old input, pictures at 390 px light and dark), compares to main
   (a failure also on main is pre-existing), writes `verify/<ID>.md`, and ends with `merge` or `fix`.
4. Severity decides (owner, 15 Oct): blocker, high, medium get a fix round; low goes to the area's sweep list.
   `merge` means nothing medium or worse. Small UI work still gets a verifier (LESSONS B2). Lean verifiers for small tasks.
5. Rulings: when a finding needs a decision, you decide, then write it into the next round's brief (EXTRA) and add the
   line "Lead ruling" to merge-notes. A ruling that changes product behaviour is told to the owner and goes into
   DECISIONS.md when they confirm. Owner questions go to the board (`questions`, `needs`), never an interactive ask.
6. After every launch, hand-back, verdict, deploy or owner answer: one line in merge-notes.md AND the board facts,
   in the same step (LESSONS E6). Take the time from `date -u`, never from memory.
7. If SubagentHandback is refused (session not in auto mode), read the agent's final text from its task output.
8. Never pkill or pgrep -f. Agents stop what they started by PID. After each hand-back, check nothing of theirs
   still listens (`ss -ltnp`) and remove stray worktrees under `/home/user/wt/`.

## 4. Stacking batches and merging (one PR per batch, owner approves)
- Each batch is built on the previous batch's head and opens only after the previous PR merged (two PRs on the same
  files cost the owner a conflict, LESSONS E8). A MERGE-n builder stacks the verified branches one at a time onto the
  base: renames each migration so it sorts after main's last, regenerates `contract/openapi.json`, adds SHARED-CHANGES
  rows, resolves conflicts, runs the full check, and pushes `wmt/MERGE-n` (mobile) and the batch branch (backend).
- Backend: GitHub runs shards, Gates, Protected routes (V3) and contract on every `wmt/**` push. Gates compare with
  main (the recorded baseline lines). A PR that changes a protected route needs the owner's `relock-approved` label:
  only the owner applies it, never us (EVENTS-11 #83 and OPS-08 #26 wait for it). Comment once per PR with the gate
  comparison. Merge with merge_method `merge` and the full 40-character sha, and only when the owner approves the
  prompt (merges are blocked by the Auto-mode classifier; with the owner away, stack and wait; never merge or push
  main alone).
- Deploy watch: `tools/watch_deploy.sh B3rry4r/WAWU-Backend <sha> "Deploy Hub API" https://api.wawuafrica.com/api/hub/health`
  (workflow "Deploy Hub API"); expect `success` and `health 200`. CI wait: `tools/wait_ci.sh <owner/repo> <sha> [min_runs]`
  (prints `CI GREEN` or `CI RED: names`). Both cost no tokens while they wait; run them in the background.
- wawu-id: when a task needs it, open the wawu-id PR for the owner first and let it deploy before the backend.
- App main: after the batch's deploy is green and the MERGE-n full check (`npm run typecheck && lint && test
  --maxWorkers=2 && gates && tasks`) ends `EXIT 0`, fast-forward the mobile repo's main to `wmt/MERGE-n`, again with
  the owner's approval prompt. Regenerate `tasks/INDEX.md` and `npm run api` at that step.
- GitHub cannot run mobile CI (billing): mobile checks run locally by the builder; the lead trusts only the log's EXIT line.
- Agents never call live providers or production hosts. The lead alone makes read-only live checks.

## 5. The board (the owner's one page)
- `board/board.json` is the only source: needs, chains, columns, news, areas, merged, questions, prs.
- Edit board.json, then run `LEAD_SCRATCH=<folder> board/board-refresh.sh`. It reads GitHub (PR state, branch heads,
  app main), refuses stale facts (a merged card still "ready", an answered question, an old news line), takes the time
  from `date -u`, renders at 390 and 1280 px, checks there is no sideways scroll and prints `OK v<n> <time>`.
- Publish `$LEAD_SCRATCH/board/board.html` with the Artifact tool as "Who Made This progress". The first account's
  artifact (https://claude.ai/artifact/2GCtXgV2hRKhpCpZEVexcU) belongs to the owner's first account; a lead on another
  account publishes a new one and puts its link in HANDOFF.md.
- Move a card at every event; rebuild at least hourly even when nothing happened (the hourly check-in does this).

## 6. Pace and the capacity guard
- Launch the next task when a slot opens, by wave (`tasks/DESIGN-V2-CUT.md`), money core first. Check `free -g` (5 GB
  free before a heavy job) and the port and stamp registry in HANDOFF.md before you give out a range.
- Spend: measure from transcripts (usage per message id under the account's `.claude/projects/**/subagents/*.jsonl`,
  at API prices). A plan-week was about $2,300 measured on Max 20x. Stop launching new builders near 80% of a
  plan-week; keep the rest for orchestration and the handoff. Say so on the board.
- Cheaper agents: a lean brief (exact cases, a file map, a step budget) cost $28 against $93 to $201 (LESSONS A7).
  Quiet output to log files, look back within 4 minutes, no idle sleeps.

## 7. The hourly check-in (a scheduled task bound to your session; the old one belongs to the old account)
Prompt text used overnight: "Hourly lead check-in. Read notifications first. Check the agents in flight and the
branches (merge-notes.md has the state). Keep work moving: act on finished reports (verifier, next fix round, next
task by wave), up to 5 agents at once, every agent on Sonnet. Never merge a pull request or push to any main while the
owner is away: stack verified work into the next batch and leave the merge for the morning. Questions for the owner
go to the board. Keep the board current. Capacity guard: stop launching builders near 80% of the plan-week. If
nothing changed and nothing is due, do nothing and say nothing." Create it with a minute that is not :00.

## 8. The hand-off ritual (account change, or the capacity guard)
1. Stop launching. Let running agents finish and read their reports; do not start a round you cannot verify.
2. Bring merge-notes.md and board.json up to date; run board-refresh; publish the board.
3. In the worktree of branch `lead` (from the lead's clone of the mobile repo: `git worktree add`), copy fresh:
   merge-notes.md, owner answers, verify/*.md, board.json and the tools you changed; keep the `LEAD_SCRATCH` edits.
4. Rewrite HANDOFF.md from merge-notes (newest entries), board.json and `git ls-remote` of the three repos, with the
   time from `date -u`. Keep it one page; every head must match ls-remote at that moment.
5. Search lead/ for secrets and PII (`AIza`, `sk-`, `ghp_`, `Bearer `, `PRIVATE KEY`, `password=`, `_API_KEY=`, long
   digit runs); remove them. Keys never travel in the repo: the owner re-issues them to the new account.
6. Commit with the trailers, push only `lead` (new branch, then fast-forward; never force; never main). No PR.
7. Tell the owner: the branch name and "start at lead/HANDOFF.md". Disable the old hourly check-in; the new lead
   creates its own. The new lead checks `git ls-remote` against HANDOFF.md before acting.

## 9. Traps that cost the most
- A merge does not happen in Auto mode; a push to main is refused as "Merge Without Review" (16 Oct).
- Never hold a transaction, a connection or a lock across a network call (ME-04 r5, SETTINGS-06 r5/r6 each lost a round).
- A flaky test gets its own small FIX task; never edit a test, gate or baseline to pass.
- Metro's shared cache bakes another agent's ports into a web export; every export uses its own TMPDIR.
- Resources: one Hub, one wawu-id, one export per agent; the stack is `scripts/dev/stack.sh` only (backend repo).
- A stale board made the owner ask twice (LESSONS E6, E9): the board is generated whole, never patched by hand.
