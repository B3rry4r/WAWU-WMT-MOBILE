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
2. **No task is bigger than two days.** Anything bigger is split before work
   starts.
3. **A check is an exit code, not an opinion.** Gates, tests, analyze and
   migrations pass or fail on their own. A model reviewing code can find
   problems, but it never decides "pass".
4. **Compare pictures with pictures.** Render the artboard
   (`python3 scripts/design/render_design.py <ID>`) and screenshot the built
   screen at the same width, in both themes, and look at both images. Reading
   design markup while looking at the app is not a comparison.
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
You are the BUILDER for task M-04. Open tasks/M-04.md and follow it.
You are the VERIFIER for task M-04. Open tasks/M-04.md and follow it.
You are the AUDITOR for Stage 3. Open docs/roles/AUDITOR.md and follow it.
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
| 1 | **Ticket** | Owner (or lane lead, owner approves) | `tasks/<ID>.md` exists, `python3 scripts/tasks/check_tasks.py` passes, status `ready` |
| 2 | **Build** | Builder session, on branch `wmt/<ID>` | Code and tests written inside the ticket's scope. Builder report written into the task file |
| 3 | **Gates** | Machine | `npm run check` (or the repo's equivalent) exits 0 and no gate count went up (counts recorded before and after) |
| 4 | **Verify** | Verifier session, fresh, never the builder | Every pass in the ticket's `passes` list is run and reported |
| 5 | **Fix loop** | Builder, then verifier | Every defect is fixed or accepted by the owner. At most 2 rounds, then the task goes to the owner |
| 6 | **Review** | Owner | The owner has looked at the screenshots and the evidence pack in the PR |
| 7 | **Merge and live check** | Owner, then machine | Deployed to staging; a real login sees a value only the server has; flags widened in steps |

Status values in a task file, in order: `queued` (its stage hasn't started),
`blocked` (needs the named fact), `ready`, `building`, `verifying`, `review`,
`done`.

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
| **V1 Gates** | No placeholders, fake data, copied components, raw colours, dead buttons, unbacked promises, banned copy | `npm run check` in this repo (typecheck, lint, tests, `scripts/gates/run.py`, task check). Check "files scanned"; exit 2 means nothing was scanned, which is a fail. Backend: `tsc`, lint, its own gates and tests |
| **V2 Contract** | The endpoint does what its contract says, including refusing the wrong user | Contract tests from the registry entry, including one input in an unexpected format (a phone written `080...` instead of `+234...`) |
| **V3 Regression** | Everything live still behaves the same | The protected route suite (task M-01), before and after |
| **V4 Field trace** | Data one person writes reaches every screen that reads it | For each field: writer, storage, every reader. Data that crosses between users (a creator's price shown to a buyer) is checked on both sides |
| **V5 Picture** | The screen looks like the design | `python3 scripts/design/render_design.py <ID>` beside a screenshot of the built screen (web export or simulator) at 390 px wide, light and dark |
| **V6 States** | Every state can actually be reached | Trigger each drawn state, plus loading, empty and error, through its real cause. A capture showing the app's generic error screen is a failed capture |
| **V7 Flow walk** | A real person gets from start to finish | Walk the path as each user type the ticket names (new, existing without wallet, unverified, KYC pending, verified, creator, buyer), from a cold start and from resume |
| **V8 Money attack** | Money cannot be lost, doubled or stolen | Same request twice (one debit only); double-tap; wrong PIN 5 times (locks); insufficient funds (clear shortfall); webhook replayed (no double credit) and forged (rejected); a failed transfer reverses; ledger equals Fintava balance |
| **V9 Live seam** | The app really talks to the real backend | On staging: sign in through the real login (no injected token), see a value only the server has, create something and read it back through the API |
| **V10 Device** | The release build works, not just debug | A signed release build on a real Android phone and a real iPhone: network, camera, push, deep links |
| **V11 Stage audit** | Nothing was missed across a stage | `docs/roles/AUDITOR.md`, at every stage exit |

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
stage on the tester build, and on any task touching permissions, push, the
camera or deep links.

---

## 6. Keeping the live product safe

**Add, move, then remove.** Each is its own task.

1. **Add.** Only new tables, new nullable columns and new routes. Nothing the
   web uses today is renamed, retyped or widened. V3 proves it.
2. **Move.** Clients switch one at a time, behind a feature flag (task Y-04).
   The old way keeps working.
3. **Remove.** Only after the logs show no calls to the old way for two weeks,
   in a `removal` task.

**Before any money work:** staging exists (task Y-03), feature flags exist
(task Y-04), and the nightly ledger check against Fintava runs (task M-18).
Fintava's balance is always the truth. Never add up our own records and show
that as a balance.

**Payments move one at a time, safest first:** credits, tips, unlocks, ticks,
paid DMs, event tickets, bills, legal, school fees. Each one: staging with the
sandbox, then real money for staff only, then everyone on mobile. The web stays
on Flutterwave until Stage 9.

**People who already have accounts** have no BVN and no wallet. Every money
screen handles "this user has no wallet yet" and sends them through "open your
wallet" (task M-12). Test every money flow with an existing-user account, not
just a new one.

---

## 7. Stages

A stage ends when its exit gate is green, the stage audit (V11) has run, and
the owner has signed off (tasks `G-0` to `G-9`). Tasks of the next stage stay
`queued` until then.

| Stage | Weeks | What | Exit gate |
|-------|-------|------|-----------|
| 0 Safety nets | 1 | Repo, canvas, renderer, gates, CI, protected routes, staging, flags, Fintava sandbox | Every artboard renders with Alan Sans; regression suite green on production code; gates pass in all repos; staging deploys from its own branch |
| 1 Contracts | 1-2 | Conventions, contract entries for every new endpoint, field trace, D1-D4 ruled | Conflict list empty; contract frozen; every decision for the next two stages has its task |
| 2 Frame | 2-3 | App shell, design-system components, PIN and pay sheets | Every component compared against its render (V5) in both themes |
| 3 Screens on today's backend | 3-6 | Feed, explore, profiles, events browse, professionals, settings, sign-in; Shop retired | V9 with the seeded creator; stage audit; first tester build on real phones (V10) |
| 4 Backend additions, no money | 4-8 | Likes, following, search, profile fields, settings, push, realtime, chat, inbox, schools browse | Regression green after every merge; every new field has writer and reader |
| 5 Identity and wallets (sandbox) | 5-9 | Fintava connection, BVN sign-up, accounts, PIN, ledger, existing-user wallet | New and existing user each have wallet, PIN and a balance matching Fintava on staging; three clean nightly checks; owner approves staff-live |
| 6 Payments move | 8-13 | Pay-from-wallet, then each payment path, wallet screens | Per path: one debit under replay, refunds land, ledger matches, a week of staff real-money use with no mismatch |
| 7 New products | 11-15 | School enrolment, tracked links, ads, TGIF social, receipts, statements, QR, admin screens | V7 on every flow and user type; stage audit |
| 8 Release | 15-18 | Full audit, release builds on devices, store submission, staged rollout | Every artboard compared or ruled; no open defects; release builds checked on devices |
| 9 Web follows, Flutterwave goes | 19+ | Web ports, Flutterwave removal, creator balance cutover | No Flutterwave calls in the logs; regression suite rebuilt; final web audit |

---

## 8. The evidence pack (every pull request)

- The ticket's capability checks, each with passed, failed or NOT RUN and where
  the proof is
- Gate, analyze and test counts before and after, from the verifier's own run
- Design and app screenshots side by side, light and dark (screen tasks)
- For money: sandbox requests and responses, the replay result, the ledger check
- Every finding and how it was closed; every check not run, and why

No evidence pack, no merge. The owner's own tasks are verified the same way.

---

## 9. When work stops and goes to the owner

- The design states a fee, limit, rate, legal line or system behaviour the
  system doesn't match.
- A task would change something live: a rename, a type change, a widened
  response, anything in the login path.
- The regression suite goes red, or any suite is flaky.
- Any mismatch between our ledger and Fintava, of any size.
- Something on the web isn't in the design (decision D14). It is neither kept
  nor cut until the owner rules.
- A verifier cannot run a required pass (no device, staging down).
- A task needs a third fix round.
- Anyone believes they need a destructive git command or migration.
