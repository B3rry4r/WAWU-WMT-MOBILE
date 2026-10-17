---
id: SWEEP-AUTH
title: Auth sweep: the low findings of sign-up and sign-in
owner: YOU
area: SWEEP
order: 252
priority: launch
repo: all
type: component
status: verifying
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# SWEEP-AUTH · Auth sweep: the low findings of sign-up and sign-in

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 15.
- **Status:** merging (lead). Built by the W4b sweep builder (Sonnet) on `wmt/SWEEP-W4b`; verifier PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SWEEP-W4b.md`: the 16 fixed rows check out, 12 red before and green after, the ruled-no reasons read hold). Stacked in batch 15 by MERGE-15 (backend, mobile and WAWU ID `wmt/MERGE-15`); not on main.
- **Branches:** mobile `wmt/SWEEP-W4b`; backend `wmt/SWEEP-W4b`; wawu-id `wmt/SWEEP-W4b` (heads in the hand-back; the last column of the table names the commit or ruling for each row).
- **Rows:** 4 fixed, 2 ruled no with the reason in the row, 0 waiting; 3 more rows were added at MERGE-13 and stay open (last column); 1 more row added at MERGE-15 from the verifiers' reports, open (last column).
- **Next:** the batch 15 pull request (the lead). The verifier's lows are rows of this table (last column Open).

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Sign-up, sign-in and account recovery screens: AUTH tasks, and the findings of the CHECK-1 audit that belong to them. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report | Closed by |
|---|---|---|---|---|
| AUTH-07 | N-2 | `knownSignupChannel()` is last-writer-wins at module level, so a late answer from an earlier visit can set what a newly mounted A3 draws first. | `tasks/AUTH-07.md`, Verifier report, round 4, line 517 | Fixed, mobile `c2f6cb5c`: only the latest ask of `signupChannel` sets what A3 draws first. New `auth-signup-channel.test.ts` (4 cases, 3 fail before) and N-1 in `auth-signup.test.tsx` now expects the latest answer to stand. |
| AUTH-07 | N-3 | Nit: `sign-up.tsx`'s header comment says the line is asked on arrival; it is asked on each focus. | `tasks/AUTH-07.md`, Verifier report, round 4, line 518 | Fixed, mobile `c2f6cb5c`: the comment in `sign-up.tsx` says each focus. |
| CHECK-1 | F-6 | A3's heading sits 9 px lower than the render, the phone number is not grouped as drawn, A8's button carries an arrow the render does not. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 54 | No: moot. DV2-05 rebuilt A3 to the 16 Oct design (`492385d7`, `960c40d3`, MERGE-8) and A8's arrow is gone (`OpenWalletEnd` gets no `actionIcon`). The board's grouped phone is a sample value; grouping a typed number changes the string sent to WAWU ID, not worth the risk in sign-up. |
| CHECK-1 | F-8 | An account whose email was never confirmed signs in to a message with no screen to finish confirming. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 56 | No: `EMAIL_NOT_VERIFIED` comes only from web sign-ups whose emailed code was never entered (WAWU ID `auth.service.ts` login); the web is paused and the app's own sign-ups end in a code that `PHONE_NOT_CONFIRMED` resumes. A confirm screen needs a new WAWU ID resend route. The message already says to create the account again. |
| SETTINGS-08 | L1 | A sign-in that waits behind another can be handed an access token that is already dead (`deletion-window.service.ts:171-174` returns the restored account at once on `not_pending`, while only the claimer waits for `sessionsRevokedAt`, `:221-224`). 5 of 18 tokens were 401 SESSION_INVALID in 3 parallel sign-ins within one second; the refresh token works and the new access token opens (self-heals). Make the `not_pending` branch wait for `sessionsRevokedAt` too. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-08.md`, low 1 | Fixed, wawu-id `3a281d2`: the `not_pending` branch waits for `sessionsRevokedAt` as the claimer does. Spec in `deletion-window.spec.ts` (fails before, 28 pass after). |
| SETTINGS-08 | L2 | G-SETTINGS-08-2 stays low: the Hub accepts a pre-delete token for its 15 minutes, and a direct `POST /account/cancel-deletion` with it leaves WAWU ID `pending_deletion`; if the person never signs in, the right password after WAWU ID's day 30 gives 403 PERIOD_ENDED for an account the Hub holds as live. Needs a hand-made call plus 30 days away. Add the lock-out sentence to the gap row. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-08.md`, low 2 | Fixed, mobile `c2f6cb5c`: the lock-out sentence is on the G-SETTINGS-08-2 row. |
| SETTINGS-05 | L1 | G-SETTINGS-05-2 is filed wrongly. `BACKEND_GAPS.md` says Android's back signs out on Z8 and that a phone closed without Done keeps its session. The route swallows back (`src/app/settings/delete-account/scheduled.tsx:18`, `useSystemBack(() => undefined)`), and wawu-id revokes refresh tokens when the deletion is scheduled (a refresh after scheduling answers 401, a control account 200), so such a phone is signed out when its access token ends. Fix the gap text. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-05.md`, Findings 1 | Open: added at MERGE-13, after this sweep's base. |
| SETTINGS-05 | L2 | A creator with an owed earning and no wallet gets Continue open on Z6 and learns of the refusal only at Z7, after typing DELETE. Correct by R-6 and the Hub being the authority; a Hub read for it would let Z6 say so earlier. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-05.md`, Findings 2 | Open: added at MERGE-13, after this sweep's base. |
| SETTINGS-05 | L3 | The backend reason spec (`account-deletion-reason.contract.spec.ts`) drives the service and the DTO pipe, not the HTTP route (the verifier checked the route on the stack). The owed earning in the builder's and the verifier's checks is a `WalletPayment` row of the shape B3a counts, not one made through a money route. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-05.md`, Findings 3 | Open: added at MERGE-13, after this sweep's base. |
| AUTH-07 | W4b N3 | Note. `forgetSignupChannel()` also bumps `lastAsk`; it has no product caller (tests only), so no behaviour change. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SWEEP-W4b.md`, Notes 3 | Open: found by the verifier at batch 15. |

## Builder report

Fixed 4 (AUTH-07 N-2, N-3; SETTINGS-08 L1, L2), ruled no 2 (CHECK-1 F-6, F-8), waiting 0.
- Test N-1 in `auth-signup.test.tsx` pinned the old last-writer-wins answer; its one assertion now expects the latest ask's answer, because the row changes that behaviour.
- Checks run (EXIT 0 unless noted): mobile `tsc --noEmit`, eslint on every changed file, `npm run gates` and `check_baseline`; jest of every touched area (communities 140, push 60, paid-messages 45, door 103, buyTickets 22, organiser 21) and a wider run of chat, credits, events, schools, legal, money-attempt and auth-signup (40 suites, 799 tests); backend `tsc`, eslint on changed files (warnings only, none new), gates, the earn spec (29) and the TGIF spec (19), the protected suite (253 of 253, on a seeded test database); wawu-id `tsc`, eslint, prettier and `deletion-window.spec.ts` (28 of 28) against a local Postgres.
- Fail-before runs were made by putting the old file back for one run (no stash).
- Test databases `w4b_test_wawu_id` and `w4b_test_wawu_hub_test`, mock WAWU ID on 7841; all removed or stopped at hand-back.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
