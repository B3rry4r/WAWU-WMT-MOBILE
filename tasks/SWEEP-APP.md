---
id: SWEEP-APP
title: App sweep: test gaps and small differences across the app
owner: YOU
area: SWEEP
order: 283
priority: after-launch
repo: all
type: component
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# SWEEP-APP · App sweep: test gaps and small differences across the app

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 12, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** nothing (every source task is merged).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Findings that belong to no one area: flaky or racy tests (FIX tasks), SCHOOLS, and the CHECK-1 audit's shell and profile lows. Mobile only, except the four ME-04 rows, which name the Hub where they mean it. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| FIX-31 | 1 | LegalChatScreen has racy tests that read before an answer lands (three races; LEGAL-02's tests). | `tasks/FIX-31.md`, Verifier report, round 2, line 261 |
| FIX-31 | 2 | Explore "the refusal line stays up for 4 seconds" fails under delay seeds 0 and 21. | `tasks/FIX-31.md`, Verifier report, round 2, line 262 |
| FIX-31 | 3 | `requestsAnswered()` does not itself check that a request was sent. Note, low. | `tasks/FIX-31.md`, Verifier report, round 2, line 263 |
| FIX-32 | 2 | hostScreens "shows a skeleton": the stall is not a deterministic "before". | `tasks/FIX-32.md`, Verifier report, line 107 |
| SCHOOLS-03 | V2-1 | Test gaps: `Fee` with `kobo < 100` instead of `kobo === 0` survives; no screen test uses a fee between 1 and 99 kobo. | `tasks/SCHOOLS-03.md`, Verifier report, round 2, line 254 |
| SCHOOLS-03 | V2-2 | The Kiritimati date-test label is wrong (UTC+14 is never behind UTC). Note. | `tasks/SCHOOLS-03.md`, Verifier report, round 2, line 255 |
| CHECK-1 | F-1 | A production web export shows Expo's default "Unmatched Route" page for any unknown route and `/_sitemap` lists every route file. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 49 |
| CHECK-1 | F-7 | M8's `wawu/<handle>` preview is hidden for a handle with a hyphen, which the Hub would also refuse. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 55 |
| ME-04 | R2-1 | Hub: the storage quota is check-then-insert (`src/storage/storage.service.ts` presign: `usageAndTick` is read, then the row is written), so parallel presigns overshoot the limit. Twelve parallel 300 MB presigns against 1 GB: main accepted 7 (2.1 GB reserved), the branch 4. Pre-existing on main. Fix in the Hub with one conditional write or a lock per account. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/ME-04.md`, "Pre-existing on main" (a note under the findings) |
| ME-04 | R2-2 | Hub: `POST /uploads/presign` has no creator check (any signed-in account reserves `content/*` space), and none on the upload count. Changing it changes a route the website calls (protected registry), so it waits for the lead's ruling; the app already gates its own routes. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/ME-04.md`, finding 5 |
| ME-04 | R2-3 | App: a release that fails (offline, 503) is dropped, as ruled, so the file keeps counting and the person cannot ask again once it is out of the draft. An upload cut off mid-way (the person leaves the screen, a failed PUT) has no key in the app at all; the Hub's 15 minute reconcile settles one that never landed, not one that did. A retry queue, or a Hub-side sweep of `content/*` rows no listing claimed after a day, would close both. | `tasks/ME-04.md`, Builder report, round 2 |
| ME-04 | R2-4 | Hub: `POST /content` takes any URL as `previewAsset` and `fullAsset`; it does not check that each is the caller's own upload or that its row is not `abandoned`. A released (deleted) or another person's key is accepted. ME-08 sends these, so it should check them (the photo-set frames already do: `ownedFrameKeys`). | `tasks/ME-04.md`, Builder report, round 2 |
| ME-04 | R3-1 | Hub: release and create are not atomic, and create never reads the row. Forty parallel rounds of `POST /content` with a piece naming key K and `POST /uploads/release` for K: 39 times both answered success (a listing on a deleted file, the row `abandoned`), once 409; a create sent up to 20 ms after a release is accepted 25 times of 25. Self-harm only (the caller's own key). Fix with R2-4: `content-piece.service.ts` create refuses an `abandoned` row, as the photo-set frames already do. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/ME-04.md`, finding 2 (`scripts/a3.py`) |
| ME-04 | R3-2 | App and Hub: a draft walked away from keeps its file counted. Sign-out empties the draft by ruling, and an app reload mid-draft loses it; no release is sent, the row stays `pending` (counted) and the 15 minute reconcile makes it `confirmed`, with no key left to release. Round 3's late-file sweep removes only files of rows already released or abandoned, so it does not reach this. Needs a ruling: a Hub sweep of `content/*` rows no listing claimed after a day, or a release on sign-out when the files are not yet claimed. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/ME-04.md`, finding 3 (`scripts/c3b.py`) |
| ME-04 | R3-3 | Hub: the late-file sweep looks at a row once (`sweptAt`). A PUT that began inside the link's life and is still sending when the margin (15 minutes by default, `UPLOAD_SWEEP_MARGIN_SECONDS`) passes lands after the sweep found nothing, and is not counted or seen again. Closing it means asking about absent rows for hours (more HEADs), so it waits for a ruling on how long a trickle upload may run. | `tasks/ME-04.md`, Builder report, round 3 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
