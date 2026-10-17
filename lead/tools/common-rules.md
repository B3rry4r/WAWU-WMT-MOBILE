#LEADNOTE Folders: {SCRATCH} below is replaced by mk.py with $LEAD_SCRATCH (default <repo>/../scratch); {SESSION_URL} by $LEAD_SESSION_URL. mk.py drops #LEADNOTE lines.
#LEADNOTE Machine facts (repo paths under /home/user, ports, memory, Postgres, Playwright) describe the first lead's container. On a new machine, edit the Machine section here before writing briefs.
# Rules every agent follows (lead's common rules, rewritten 10 Oct 2026 after a container restart)

The container restarted at 13:11 UTC on 10 Oct. Everything local was wiped: worktrees, databases, scratch files.
Branches on GitHub are intact. If your brief continues earlier work, start from the branch on origin, never from a
local copy that no longer exists.

## Machine
- 15 GB of memory shared with up to 8 other agents. Start a heavy job (a full `npm run check`, a full backend suite,
  a web export, a second Hub) only when `free -g` shows at least 5 GB available; otherwise wait a minute and look
  again (a loop with `sleep 60` inside one command, never a bare long sleep). Run single test files while you work;
  keep the full check for the end. Stop every server you started as soon as you no longer need it.
- Repos (always fetch first: `git fetch -q origin '+refs/heads/*:refs/remotes/origin/*'`):
  - mobile: `/home/user/wawu-wmt-mobile` (origin MOXN-AFRICA/wawu-wmt-mobile, the same repo as B3rry4r/WAWU-WMT-MOBILE)
  - backend: `/home/user/wawu-backend` (a link to /home/user/WAWU-Backend; origin B3rry4r/WAWU-Backend)
  - web: `/home/user/wawuafrica` (a link to /home/user/WAWUAfrica). Web work is paused (R-49).
  Never change the checked-out branch of these three directories. Work only in your own worktrees under
  `/home/user/wt/` (`git -C <repo> worktree add --detach /home/user/wt/<name> <ref>`), and remove them at the end.
- node_modules: mobile from `/home/user/wawu-wmt-mobile/node_modules`, backend from
  `/home/user/wt/shared-be/node_modules`, hard-linked: `cp -al <source>/node_modules <worktree>/node_modules`.
  Backend worktrees then run `npx prisma generate`. If a branch's package-lock differs from main's, run `npm ci`
  in your worktree instead.
- Postgres 16 runs at localhost:5432, user `postgres`, password `postgres`. If it is down: `service postgresql start`.
  Create only databases with your brief's prefix and a name containing `test`; drop them at the end. Never touch
  another database.
- Use only the ports your brief gives you.
- Playwright Chromium is at /opt/pw-browsers (never `playwright install`). Pictures of app screens come from the web
  export at 390 px, light and dark, beside the rendered artboard (`python3 scripts/design/render_design.py <ids>`).

## Never
- Never call a real payment or identity provider (live.fintavapay.com, api.nuvion.co, api.nuvion.dev unless the
  brief allows it, Flutterwave), the production Hub (api.wawuafrica.com), any wawuafrica.com host, exp.host, or
  any AI provider. There are no provider keys on this machine; use the stand-ins and mocks the repos provide.
- Never `pkill`, `killall` or `pgrep -f`. Kill only processes you started, by their PID number.
- Never `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, rebase, amend or force-push.
- Never edit a gate, a test you did not write, or a baseline to make a check pass.
- Never put a credential, a full BVN, NIN or phone number in a commit, a report or a picture name (mask them).
- Never address the owner. Report to the lead in your hand-back.
- No em-dashes in anything a user reads (copy, errors, notification text).

## Pushing
- Push only to the branch your brief names, with retries on network errors (5, 10, 20, 40, 60 s), and confirm with
  `git ls-remote origin refs/heads/<branch>`.
- Gate every push on the check log's own last line (`EXIT 0`), never on a background job's exit code.
- Commit trailers:
  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
  Claude-Session: {SESSION_URL}

## Product rules you will meet
- R-47: a part of a screen whose task is not done is not drawn (no do-nothing buttons, no placeholder rows).
- R-49: the app comes first; web work is paused; wawuafrica.com serves only /join.
- Naira only; kobo on the wire; WAWU Credits are a count, never naira; one split, 85/15.
- The mobile repo's DECISIONS.md outranks every other document.

## The identity service
- wawu-id is at `/home/user/wawu-id` (origin B3rry4r/wawu-id, main fb8717e, a shallow clone). Never change its branch;
  make your own worktree, run its own `npm ci` there, and give it its own database with your prefix.

## Web exports (found 10 Oct by the INBOX-05 verifier)
- Metro's transform cache (/tmp/metro-cache by default) is shared by every agent and bakes EXPO_PUBLIC_API_URL and
  EXPO_PUBLIC_ID_URL into the cached src/api/env.ts, so an export can point at ANOTHER agent's ports. Always export
  with your own cache: `TMPDIR=<your scratch>/tmp npx expo export ...` (or `--clear`), then grep the bundle for
  `localhost:` and confirm only your own ports appear before you take a single picture or sign in.

## Full checks under load (10 Oct)
- The machine has 4 CPUs shared by up to 9 agents (load average 20 to 28), so jest timing tests flake. Run the mobile
  full check as the same steps with two jest workers, in one command, and gate on its EXIT line:
  `(npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks; echo "EXIT $?") > <log> 2>&1`

## Out of memory (10 Oct, 19:45)
- The machine's memory limit is killing node processes (kernel: "Memory cgroup out of memory"). A test suite that
  fails with "A jest worker process ... was terminated by another process: signal=SIGKILL" or a server that dies
  with no error was killed for memory, not by your code: wait for `free -g` to show 5 GB available, then run it
  again. Keep at most one Hub, one wawu-id and one web export of yours running at a time, and stop each the moment
  you are done with it.

## Before you hand back: no server left running (added 11 Oct 2026)
Every process you started must be stopped by its PID before you hand back: Hubs, stand-ins, the mock WAWU ID and any wrapper script that started it (stop the wrapper and its child), database bridges, static servers. Removing a worktree does not stop a process running from it. Check with `ss -ltnp` on your ports that nothing of yours is still listening, and say so in your hand-back.

## The website is dark only (owner, 12 Oct 2026)
"The website never had light mode ... I dont want to see a light mode." The website (`wawuafrica`) is dark only. Never add, enable, check or picture a light mode there; take website pictures in dark only. (The app's light and dark rules are unchanged.)

## Spend less, check the same (owner, 15 Oct 2026; measured on 126 agent runs)
Every step you take re-reads everything already in your context. 66% of agent spend was re-reading old command
output, and a run of 200+ steps costs 2.5x more per step than a short one. So:
1. Quiet output. Every test run, build, check, server log or long command writes its FULL output to a log file in
   your scratch folder and prints only the end: `(cmd; echo "EXIT $?") > $S/logs/x.log 2>&1; tail -n 15 $S/logs/x.log`.
   On a failure, `grep -n -m 20 -E "FAIL|Error|✕" $S/logs/x.log` and read the lines you need. Never cat a whole log,
   never print a whole diff (`git diff --stat`, then `git diff -- <one file>`), read files by line range
   (`sed -n 120,180p`, or Read with offset/limit), and cut wide lines (`| cut -c1-200`).
2. Never sit idle more than 4 minutes. After about 5 minutes without a step your whole context is written again at
   the expensive rate. If you must wait on something, look again within 4 minutes (one command with
   `timeout 230 bash -c 'until grep -q "^EXIT" log; do sleep 20; done'; tail -n 5 log`), never one long sleep.
3. GitHub runs the full suites. Push your branch: CI runs the full backend suite, gates, baseline, protected routes
   and contract:build on every push to `wmt/**` (once task OPS-CI lands; until then the brief says what to run).
   You run only the specs for the files you touched, plus typecheck and lint. Do not run the full suite twice.
4. Step budget. Your brief names one (about 150 steps for a build, 120 for a check). Past it, finish what is open,
   push, and hand back with a short note of what remains, instead of carrying on.
5. Severity decides rounds (owner, 15 Oct 2026). A verifier's verdict is `merge` when nothing is medium or worse.
   Blocker, high and medium findings get a fix round. Low findings go to the area's sweep list, not a new round.

## The local test stack (OPS-STACK, 16 Oct 2026)
Never hand-build a Hub, mock WAWU ID, wawu-id, web build or mobile export again. Use the backend's
`scripts/dev/stack.sh up --name <your prefix> --ports <your range> [--with id,web,mobile] --scratch {SCRATCH}/stacks`, then
`status` and `down` with the same `--name` and `--scratch`. ALWAYS pass that exact `--scratch`: the guards against
two stacks sharing a name or a checkout only see stacks in the same scratch folder, and `down` drops databases by name.
`. {SCRATCH}/stacks/<name>/env.sh` points a spec at the stack. Run long commands through `scripts/dev/quiet.sh <name> -- <cmd>`.
`down` before you hand back, every time.

## Your own scratch folder (16 Oct 2026, after two agents overwrote each other's logs)
Write every log, picture and script under your own folder, {SCRATCH}/<your task id in lower case>-<b or v>/ (for example
{SCRATCH}/fix-26-b/logs/mobile-check.log). Never write files at the scratchpad root or in a folder another agent uses: a
shared name like mobile-check.log was overwritten by another agent and its results were wrong.

## Never hold a transaction, a connection or a lock across a network call (lead, 16 Oct 2026)
Two tasks (ME-04 round 4, SETTINGS-06 round 5) held a database transaction, a pooled connection and a per-person lock
while calling the bucket or the wallet provider. Under a burst that filled the pool: 500s, and other people's requests
stalled 15 to 27 seconds. Pattern instead: decide and mark under a short lock; call the provider or bucket holding
nothing, with a short timeout; record the result under a short lock (or put the row back). Provider calls must be
idempotent. Verifiers measure it: 20 parallel requests for one person with a 3 s provider answer, and another
person's GET /users/me must stay under 1 s.

Never disable or bypass git hooks (no core.hooksPath override, no --no-verify), even when the repo has none today.

Hand-back: if the SubagentHandback tool is refused (the session may not be in auto mode), do not retry it; make your report your final message instead.
