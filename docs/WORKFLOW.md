# WMT workflow

How every task in this project is built, checked and shipped. Every session
reads this before starting a task. It applies to every repo the task touches
(`wawu-wmt-mobile`, `wawu-backend`, `wawu-id`, `wawuafrica`, `wawu-dashboard`).

If something here conflicts with a task file, this file wins. If something
here conflicts with `DECISIONS.md`, the decision wins.

---

## 1. Why it works this way

Every rule below comes from something that already went wrong on WAWU or a
sibling project:

- Uploads broke while every test was green.
- Buyers could not see creators' DM prices, with both sides' tests passing.
- An "EVG score" was shown on four screens and nothing ever wrote it.
- The web and the backend disagreed about free first uploads, so no new creator
  could publish (fixed 1 Oct 2026).
- 188 screenshots were each certified "matches the design" by the agent that
  built them. The owner found ten defects in an hour.

Each of these passed a check that only looked at one side, or was "verified" by
whoever wrote it.

---

## 2. The rules

1. **Nothing certifies its own work.** The session that builds a task never
   verifies it. Verification is a fresh session, and its output is findings.
   Fixing them is the builder's job.
2. **Every task is small.** One screen group, one endpoint or one payment
   path: small enough to build and verify in one sitting. Anything bigger is
   split before work starts.
3. **A check is an exit code, not an opinion.** Gates, tests, analyze and
   migrations pass or fail on their own. A model reviewing code can find
   problems, but it never decides "pass".
4. **Compare pictures with pictures.** Render the artboard
   (`python3 scripts/design/render_design.py <ID>`) and screenshot the built
   screen at the same width, in both themes, and look at both images. Reading
   design markup while looking at the app is not a comparison. The renderer
   needs `pip install -r scripts/design/requirements.txt` (playwright, Pillow)
   and a Chromium; it needs no network (React and Alan Sans are vendored in
   `scripts/design/vendor/`).
5. **Prove what a user can do, not that nothing crashed.** Write checks as "a
   user can ...", never "the screen renders" or "no error appears".
6. **The live product keeps working at every step.** Backend changes only add
   until nothing uses the old way: add, then move, then remove (section 6).
7. **The design decides the UI, never the facts.** Layout, flow and wording
   follow the canvas. Money amounts, fees, limits, rates, legal text and claims
   about what the system does (holds, refunds, notifications, settlement times)
   are confirmed against the real system first. If they disagree, stop and ask
   the owner.
8. **Every decision names the task that carries it out. Every blocker names
   the fact that unblocks it.** "Blocked until `POST /wallet/pay` accepts
   `pin`" can be checked by anyone. "Blocked on backend" cannot. Adding
   something new also removes what it replaces, in the same task.
9. **Report what ran and what didn't.** A check that was not run is reported
   as NOT RUN with the reason, never left out.

---

## 3. How a session starts

The owner gives each session a one-line prompt that names a role and a task:

```
You are the BUILDER for task MONEY-06. Open tasks/MONEY-06.md and follow it.
You are the VERIFIER for task MONEY-06. Open tasks/MONEY-06.md and follow it.
You are the AUDITOR for CHECK-1. Open docs/roles/AUDITOR.md and follow it.
```

The task file lists everything to read first. `CLAUDE.md` loads by itself. A
session reads only what the task file lists, plus this file and its role file,
so it starts with the right context and nothing stale.

**Backend, identity and web tasks** are done in those repos, but their task
files live here. Start those sessions with both repos attached (for example
`wawu-backend` and `wawu-wmt-mobile`).

---

## 4. The life of one task

Every task goes through these seven steps in order. Step 5 can loop back to
step 2. No step is skipped.

| # | Step | Who | Done when |
|---|------|-----|-----------|
| 1 | **Ticket** | Owner, or the feature owner with the owner's approval | `tasks/<ID>.md` exists, `python3 scripts/tasks/check_tasks.py` passes, status `ready` |
| 2 | **Build** | Builder session, on branch `wmt/<ID>` | Code and tests written inside the ticket's scope. Builder report written into the task file |
| 3 | **Gates** | Machine | `npm run check` (or the repo's equivalent) exits 0 and no gate count went up (counts recorded before and after) |
| 4 | **Verify** | Verifier session, fresh, never the builder | Every pass in the ticket's `passes` list is run and reported |
| 5 | **Fix loop** | Builder, then verifier | Every defect is fixed or accepted by the owner. At most 2 rounds, then the task goes to the owner |
| 6 | **Review** | Owner | The owner has looked at the screenshots and the evidence pack in the PR |
| 7 | **Merge and live check** | Owner, then machine | Run against the local backend; a real login sees a value only the server has |

Status values in a task file, in order: `todo`, `building`, `verifying`,
`review`, `done`. A builder starts a task only when every `depends_on` task is
`review` or `done` (built and verified; the owner's sign-off never blocks the next task).

### Shared files (fenced)

A task never edits these unless the ticket says so. If it needs a change, it
adds a row to `SHARED-CHANGES.md` with the exact change and builds everything
else. The owner applies the queue between waves.

- Mobile: `src/theme/**`, `src/api/**`, `src/app/_layout.tsx` and any other
  `_layout.tsx` (the route graph), `src/components/**` (shared components),
  `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`,
  `scripts/**`, `design/**`
- Backend: `prisma/schema.prisma` (except an additive migration the ticket
  names), `src/common/**`, `src/app.module.ts`, auth guards, `contract/**`
  (regenerated, never hand-edited)

### Never

- `git stash`, `git reset --hard`, `git checkout -- .`, or force-push to a
  branch someone else uses. If you think you need one, stop and report.
- Editing a gate, a test or the baseline to make a check pass.
- `TODO`, `for now`, `out of scope` or `later` comments. A gap goes to
  `BACKEND_GAPS.md` or the report.
- A number with nothing that writes it. Leave it out and report it.
- Inventing a fee, limit, rate or legal line.

---

## 5. Verification passes

The ticket lists which passes apply. The verifier runs every one of them and
reports each as passed, failed, or NOT RUN with the reason.

| Pass | Proves | How |
|------|--------|-----|
| **V1 Gates** | No placeholders, fake data, copied components, raw colours (any hex, rgb/hsl, named colour), literal spacing and radii, dead buttons, unbacked promises, banned copy | `npm run check` in this repo (typecheck, lint, tests, `scripts/gates/run.py`, task check). Check "files scanned"; exit 2 means nothing was scanned, which is a fail. Backend: `tsc`, lint, its own gates and tests |
| **V2 Contract** | The endpoint does what its contract says, including refusing the wrong user | Contract tests from the registry entry, including one input in an unexpected format (a phone written `080...` instead of `+234...`) |
| **V3 Regression** | Everything live still behaves the same | The protected route suite (task MONEY-01), before and after |
| **V4 Field trace** | Data one person writes reaches every screen that reads it | For each field: writer, storage, every reader. Data that crosses between users (a creator's price shown to a buyer) is checked on both sides |
| **V5 Picture** | The screen looks like the design | `python3 scripts/design/render_design.py <ID>` beside a screenshot of the built screen (web export or simulator) at 390 px wide, light and dark |
| **V6 States** | Every state can actually be reached | Trigger each drawn state, plus loading, empty and error, through its real cause. A capture showing the app's generic error screen is a failed capture |
| **V7 Flow walk** | A real person gets from start to finish | Walk the path as each user type the ticket names (new, existing without wallet, unverified, KYC pending, verified, creator, buyer), from a cold start and from resume |
| **V8 Money attack** | Money cannot be lost, doubled or stolen | Same request twice (one debit only); double-tap; wrong PIN 5 times (locks); insufficient funds (clear shortfall); webhook replayed (no double credit) and forged (rejected); a failed transfer reverses; ledger equals Fintava balance |
| **V9 Live seam** | The app really talks to the real backend | Against the local backend: sign in through the real login (no injected token), see a value only the server has, create something and read it back through the API |
| **V10 Device** | The release build works, not just debug | A signed release build on the owner's Android phone: network, camera, push, deep links. Testing is Android first (DECISIONS R-24); an iPhone joins when a tester has one (RELEASE-03) |
| **V11 Checkpoint audit** | Nothing was missed so far | `docs/roles/AUDITOR.md`, at CHECK-1, CHECK-2 and CHECK-3 |

### Which passes each task type needs

`scripts/tasks/check_tasks.py` refuses a ticket whose `passes` list is missing
any of these.

| Type | Required passes |
|------|-----------------|
| `setup` | V1 |
| `contract` | V1 |
| `ops` | none (owner work; the ticket's checks are the evidence) |
| `component` | V1 V5 V6 |
| `mobile-screen` | V1 V4 V5 V6 V9 |
| `flow` | V1 V6 V7 V9 |
| `backend-endpoint` | V1 V2 V3 V4 V9 |
| `migration` | V1 V3 V4 V9 |
| `third-party` | V1 V2 V3 V6 V8 V9 |
| `money-path` | V1 V2 V3 V4 V6 V7 V8 V9 |
| `removal` | V1 V3 V4 V7 V9 |
| `admin-screen` | V1 V6 V7 V9 |
| `web-port` | V1 V3 V4 V5 V6 V7 V9 |

A mobile screen that takes money also lists V7 and V8. V10 runs once per
checkpoint on the tester build, and on any task touching permissions, push, the
camera or deep links.

---

## 6. Keeping the live product safe

**Add, move, then remove.** Each is its own task.

1. **Add.** Only new tables, new nullable columns and new routes. Nothing the
   web uses today is renamed, retyped or widened. V3 proves it.
2. **Move.** Clients switch to the new way one at a time. The old way keeps
   working until nothing calls it.
3. **Remove.** Only after the logs show no calls to the old way for two weeks,
   in a `removal` task.

**Testing runs locally.** The backend runs on the builder's machine with a
local `.env` holding the Fintava sandbox keys (wawu-backend `scripts/local/up.sh`, OPS-03), with seeded data;
the live server isn't touched. There is no staging and no "test backend" (DECISIONS R-25): production is the
DigitalOcean droplet, deployed by GitHub Actions. Checks run through the web
build or an emulator; tester builds on phones talk to the live services
(tester builds are not pointed at a local backend, and there is no standing tunnel), so money paths
run on a phone only once OPS-10 has put the live Fintava setup on the
droplet. Fintava's webhooks can't reach `localhost`: locally they are
sent to the local endpoint as payloads built from Fintava's documented format and signed with the local secret (MONEY-07); real payloads are recorded once OPS-10 registers the production webhook URL. A task's phone check (V10) runs on a tester build once the backend it needs is deployed to the droplet; until then V10 is NOT RUN with that reason. A development build on the same Wi-Fi as the local backend (`docs/LOCAL.md`, OPS-03) may run it earlier. Money and identity checks that charge (BVN, selfie) never run against live Fintava before OPS-10. The nightly ledger check
(MONEY-16) runs before money goes live.
Fintava's balance is always the truth. Never add up our own records and show
that as a balance.

**Payments are tested one at a time, safest first:** credits, tips, unlocks,
ticks, paid DMs, event tickets, bills, legal, school fees. Each one is tested
locally against the sandbox, then with a small real payment, and all of them launch
with the app (R-20). The web stays on Flutterwave until after launch.

**Nobody has a wallet until they open one** (R-6): identity checks happen
then, not at sign-up. Every money screen handles "this user has no wallet yet"
and sends them through "Open your wallet" (task MONEY-13). Test every money
flow with an account that has no wallet, as well as one that does.

---

## 7. Order of work

There is no calendar here; the owner sets the pace. `tasks/INDEX.md` has one
list per person, and each person works down theirs top to bottom.

- A task never comes before something it depends on (`order` in each task
  file; `scripts/tasks/check_tasks.py` refuses anything else).
- Where a task needs the other person's work first, the list says so.
- Open decisions never block work: each has a default to build now
  (`DECISIONS.md`), and its numbers go into config marked provisional.
- Each person owns whole features: the screens and the backend behind them,
  including that feature's payment path. The money core (Fintava, PIN, ledger,
  pay-from-wallet) is one owner's, and every payment path calls it.

Checkpoints sit in the owner's list where they fall. Each is a task the owner
signs:

- **CHECK-0**: safe to start building (setup verified, protected routes,
  Fintava sandbox keys working locally)
- **CHECK-1**: the app talks to the real backend, and the screens built so far
  match the design
- **CHECK-2**: every payment path attacked and reconciled (V8)
- **CHECK-3**: full verification and QA; nothing new is built
- **RELEASE-02**: QA fixes only, each re-verified; then store submission

"After launch" tasks (`priority: after-launch`) can wait: cards, dollar and
crypto accounts (dollar when Fintava sends that API), card top-up, USSD top-up, statements, receipt images and
PDFs, QR, school sign-up commissions, account limits, Flutterwave removal, the web port, the iOS release. Ads,
bill reminders, My courses, applying on a school's site and Share receipt through the phone's share sheet are
launch work (R-15, R-33). Every launch task is ordered before CHECK-3; `scripts/tasks/check_tasks.py` refuses
anything else.

### Links between screens

No placeholders, no dead buttons, no feature flags (DECISIONS R-27).

- A hub or menu task (a home screen, a menu, a list whose rows open other screens) builds only the rows,
  tiles, tabs and buttons whose destination screen already exists.
- The task that builds a destination screen also adds its entry row or button to the hub, exactly as the
  artboard draws it, and owns the check "a user can reach X from Y". Its task file says so ("this task adds
  it, as drawn") and depends on the hub's task.
- Lead default for ordering (not part of the rule): where the hub and the destination have the same owner and
  money doesn't block, the destination is listed first, so the hub wires it.
- An entry whose destination is an after-launch task is not built at launch; that task adds it, and
  `docs/designer/BRIEF.md` lists it under "Not built at launch".
- CHECK-3 confirms every hub matches its artboard in full.

### The designer brief is part of the design

Every screen task lists `docs/designer/BRIEF.md` under Read first, and its text and checks use the brief's
version (DECISIONS R-29). Where the brief changes an artboard, the task builds the brief's version; a screen that
doesn't is a defect.

Every money task is built against the real Fintava sandbox. No mocks. Money
launches with the app (R-20).

## 8. Branches, pulling and merging

Four people and many AI sessions work at once. These rules keep branches from
colliding.

1. **Start from the newest main.** `git pull origin main`, then
   `git checkout -b wmt/<ID>`. One task, one branch, one session at a time.
2. **Stay inside your task's files.** Shared files (theme, components, API
   client, layouts, route graph; section 4) are fenced: ask in
   `SHARED-CHANGES.md` instead of editing. This is what prevents most
   conflicts.
3. **Before handing over for verification,** bring main in:
   `git fetch origin && git merge origin/main` (a merge, never a rebase or a
   force-push), then `npm run tasks -- --write` and `npm run check`. Push the
   branch.
4. **The verifier checks the branch as it will land:** the branch with the
   newest main merged in. If main moved during verification, merge it in again
   and re-run `npm run check` before the pull request.
5. **Generated files are never fixed by hand.** `tasks/INDEX.md`,
   `docs/PROGRESS.md`, `src/api/schema.generated.ts`,
   `src/theme/tokens.generated.ts`: on a conflict take either side, then run
   `npm run tasks -- --write`, `npm run api` or `npm run tokens`. Anyone who
   changes a task's `status` (builder or verifier) also runs
   `npm run tasks -- --write` and commits the regenerated files with it.
6. **`docs/LOG.md` can't conflict:** `.gitattributes` merges it as a union, so
   both sides' lines are kept.
7. **Merging is the owner's (or the orchestrating session's) job:** one pull
   request at a time into main, with a merge commit, only when CI is green and
   the branch is up to date with main. After each merge, every other open
   branch merges main in again before its own merge (step 3).
8. **Backend merges deploy the live server.** Batch backend pull requests
   where you can, so it restarts once.

Recommended GitHub settings on `main` in each repo: require a pull request,
require the CI checks, and require branches to be up to date before merging.
Then GitHub enforces steps 3 and 7.

## 9. The evidence pack (every pull request)

- The ticket's capability checks, each with passed, failed or NOT RUN and where
  the proof is
- Gate, analyze and test counts before and after, from the verifier's own run
- Design and app screenshots side by side, light and dark (screen tasks)
- For money: sandbox requests and responses, the replay result, the ledger check
- Every finding and how it was closed; every check not run, and why

No evidence pack, no merge. The owner's own tasks are verified the same way.

---

## 10. When work stops and goes to the owner

- The design states a fee, limit, rate, legal line or system behaviour the
  system doesn't match.
- A task would change something live: a rename, a type change, a widened
  response, anything in the login path.
- The regression suite goes red, or any suite is flaky.
- Any mismatch between our ledger and Fintava, of any size.
- Something on the web isn't in the design: the app doesn't build it, and the web keeps it until its own
  port after launch (R-34). Only a web feature holding user money or user data needing migration goes to the
  owner.
- A verifier cannot run a required pass (no device, backend not running).
- A task needs a third fix round.
- Anyone believes they need a destructive git command or migration.
