---
id: SWEEP-FLOWS
title: Flows sweep: the broken user flows of the 23 Oct full audit (B1 to B16)
owner: YOU
area: OPS
order: 161
priority: launch
repo: all
type: backend-refactor
status: verifying
depends_on: []
decisions: [R-13, R-17, R-27, R-30, R-37, R-43, R-47, R-72]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-FLOWS · Flows sweep: the broken user flows of the full audit

## Current state

As of 23 Oct 2026, built by a Sonnet builder (T1), not yet verified. No PR.
- **Branches:** mobile `wmt/SWEEP-FLOWS` on `origin/main` `b1a460f3` (code and records); backend `wmt/SWEEP-FLOWS` on `origin/main` `13e27536` (`scripts/dev/stack.sh` and its README line only, B1).
- **Rows:** B1 to B9, B12 and B14 fixed with a test that fails without the fix; B10 ruled no (reason in the row); B11, B13, B15, B16 are not this sweep (one line each below). Source: `flow-audit/REPORT.md`, section 2.
- **Spec assertions flipped (each pinned a defect this sweep fixes):** `unlockFlow.test.tsx` x3 (the post stayed locked until Watch now or Done), `WalletSettingsScreen.test.tsx` x1 and `walletSettingsFlow.test.tsx` x1 (the Beneficiaries row), `aboutScreens.test.tsx` x1 ("Not available yet" row), `publishAndTier.test.tsx` x2 (the share line `wawu/<creator>/<slug>`). The unlock suite's stand-in feed now opens the piece once it is paid, as the Hub does.
- **Without the fix:** with the 14 source files put back to `origin/main`, 25 tests fail across 11 suites (themePick, aboutSupport, createdLink, publishAndTier, unlockFlow, WalletSettingsScreen, walletSettingsFlow, afterSignup.screens, sweepFlowsSetup.route, VisitorProfileScreen, aboutScreens); the files were then put back and the same suites pass.
- **Proved on the stack (name `sweepflows`, Hub 7870, WAWU ID 7871 real, Nuvion stand-in, mail stand-in 7930, all stopped and the databases dropped):** B1 only. `GET /auth/signup/channel` answered `email`, `POST /auth/signup` answered 200 with `channel: email`, and the mail stand-in recorded the code mail. Before: `flow-audit/shots/auth-user-06-after-continue.png` (503 on the same origin/main). **NOT RUN:** the 390 x 844 before and after pictures for B2 to B9 (out of step budget); the unit and route tests above are the proof for those, and the audit's pictures are the before.
- **Not run:** any real provider, anything Fintava, the full suites (the merge agent runs the full check).

## Read first

- `docs/WORKFLOW.md`, section 4; `docs/roles/BUILDER.md`; the audit report `flow-audit/REPORT.md` (sections 2 and 3).

## Goal

Every broken flow the audit found for a person using the app is fixed, or ruled "no" with the reason in its row.

## Capability checks

- [x] Each row in the table is fixed with a test that fails without the fix, or is ruled "no" (B10) or "not this sweep" (B11, B13, B15, B16) with the reason in the row.
- [x] B1 is proved on a local stack: the sign-up code is mailed and sign-up answers 200.
- [ ] The 390 x 844 before and after pictures for B2 to B9 on a stack: NOT RUN (step budget); left to the verifier.

## Rows

| Audit | Finding | Closed by |
|---|---|---|
| B1 | A fresh stack texts the sign-up code; nobody can sign up (R-72). | **Fixed, backend `scripts/dev/stack.sh`**: WAWU ID gets `SIGNUP_VERIFY_CHANNEL=email` (override `STACK_SIGNUP_VERIFY_CHANNEL`); README line added. WAWU ID's own default is not touched (production sets it; the lead checks). Proved on the stack (see Current state). App copy: A3 and A4 already say "email" (A3 "We'll email you a code to confirm your address", A4 "Verify your email", "Sent to n•••@...") when the Hub's channel route answers `email`, and are pinned by `auth-signup.test.tsx`; the "text" wording stays only for a Hub that answers `phone`, because that is then what happens. No app change. |
| B2 | After a paid unlock from the feed the card stays locked until a reload. | **Fixed**, `src/features/unlock/useUnlock.ts`: the moment the unlock is paid (not when H16 is closed) the post is opened in every feed held and the feeds, the piece's page and the wallet balance are read again (what a reload reads). Tests: `unlockFlow.test.tsx` (post gone from the feed behind H16 for a video, a course and a template); fail without. |
| B3 | No way to message a creator whose paid messages are off. | **Fixed**, `VisitorProfileScreen.tsx`, `profile/[wawuId].tsx`: with paid messages off, "Message <name>" (free chat, `POST /chats`, R-13) sits under the note; with them on, the More menu holds "Message <name>". "Messages off" still only means paid messages are off. A Hub refusal shows in its own words. Tests: 4 in `VisitorProfileScreen.test.tsx`; fail without. The Hub did not refuse a free chat in the unit stand-in; NOT run against the stack. |
| B4 | "Record my voice" on VF7 does nothing during sign-up setup. | **Fixed**, `src/app/_layout.tsx` (SHARED-CHANGES SWEEP-FLOWS #2) and `voice-consent.tsx`: `voice-intro` and `voice-consent` sit in the creator-setup group; inside setup "Use this" returns to the checklist. Test: `sweepFlowsSetup.route.test.tsx`; fails without. |
| B5 | "Your bonus is waiting" shown to someone who holds a tier. | **Fixed**, `bonusGate.ts`, `verify-bonus.tsx`: a creator whose tier is `active` or `ending` ends VF1 and goes Home (no flash: VF1's loading state shows while the tier is read); a tier read that fails never ends it. Tests: `sweepFlowsSetup.route.test.tsx` (active, ending, none as control, unreadable); fail without. |
| B6 | The checklist says "Uploading is open" while uploads are refused. | **Fixed**, `CreatorSetupScreen.tsx`: with a tier "Uploading is open"; without "Uploading needs a tier" and "Drafts are free. Pick a tier when you are ready to publish."; tier not readable: no claim. Tests: `afterSignup.screens.test.tsx` (5); fail without. |
| B7 | Settings, Theme, Dark does nothing. | **Fixed**, `src/theme/index.ts` + new `src/theme/override.ts` + `devicePrefs.ts` (SHARED-CHANGES SWEEP-FLOWS #1): the app's own pick wins over the phone's scheme, set at launch from the saved choice and on each pick; System follows the phone. Tests: `src/theme/__tests__/themePick.test.tsx` (at once, after a reload, System, colours); fail without. Phone check: try Theme, Dark on a light phone. |
| B8 | About, Contact support: "Not available yet". | **Fixed**, `AboutScreen.tsx`: signed in, the row opens the support chat (R-30) like "Help with a payment"; a visitor gets the mail app when the owner set an address and no row when not. `NOT_FILLED_IN` is gone. Tests: `aboutSupport.test.tsx` (4) and one flipped assertion in `aboutScreens.test.tsx`; fail without. |
| B9 | Wallet settings, Beneficiaries is not tappable. | **Fixed (row removed)**, `WalletSettingsScreen.tsx`: no screen lists saved recipients (WALLET-14 is the Hub's side; the app has only the save switch on W12), so by R-47 the row is not drawn. Tests flipped in `WalletSettingsScreen.test.tsx` (2 assertions, one test added) and `walletSettingsFlow.test.tsx` (1); fail without. The task that builds the list screen adds the row. |
| B10 | Open your wallet restarts at step 1 after leaving half way. | **Ruled no.** Steps 1 to 3 (BVN and NIN, details, ID photos) are held in memory only by design (`keptCheck.ts`, `draft.ts`: never the secure store, gone when the flow closes, FIX-47) and the Hub holds nothing until A27's Submit. After Submit the app already resumes at the stage the Hub reports (`ReviewResume`: A26, A6, A28, A29). Resuming earlier would mean keeping identity numbers on the phone, which is an identity decision for the lead or owner, not a sweep fix. |
| B11 | Terms and Privacy text not published. | **Not this sweep:** publishing the text is the owner's (a launch checklist item). |
| B12 | Share lines are not full links. | **Fixed**: a published piece shares `https://wawuafrica.com/content/<id>` (`publishApi.ts` `productLink`, `PublishScreen.tsx`) and a community `https://wawuafrica.com/c/<slug>` (`appLinks.ts` `sendableRoomLink`, `CreatedScreen.tsx`, `RoomScreen.tsx`); the card shows the address without its scheme, copy and share use the full link, as the referral screen does. Tests: `appLinksShare.test.ts`, `createdLink.test.tsx`, `publishAndTier.test.tsx` (2 assertions flipped); fail without. Not run: that the Hub's content page accepts the published piece's id (it is the Hub's content id by `POST /product-drafts/{id}/publish`). |
| B13 | `e.setSelection is not a function` on web multi-line fields. | **Not this sweep:** web export only. |
| B14 | Signing in during a scheduled deletion shows no notice. | **Fixed**, new `delete-account/cancelNotice.ts`, Home route, `ConfirmDeletionScreen.tsx`, `ScheduledScreen.tsx`: this phone marks the deletion when Z7 is answered and again when Z8's Done signs out; the next sign-in of that account shows "Your account deletion is cancelled. Welcome back." once, over Home. An app closed on Z8 still signed in, or another account, says nothing. Limit: another phone shows no notice (the Hub does not say a deletion was cancelled): BACKEND_GAPS G-SWEEP-FLOWS-1. Tests: `cancelNotice.test.tsx` (3). The Home toast itself is not covered by a test (its hook is). |
| B15 | Email branding "WAWUAfrica". | **Not this sweep:** the owner's call (R-37). |
| B16 | Hidden tab screens stay in the DOM on web. | **Not this sweep:** web only, cosmetic. |

## Builder report

- **Mobile:** 20 source files and 9 test files (see `git diff --stat`); new: `src/theme/override.ts`, `src/features/delete-account/cancelNotice.ts`. Records: this file, `docs/LOG.md`, `SHARED-CHANGES.md` (2 rows), `BACKEND_GAPS.md` (G-SWEEP-FLOWS-1). **Backend:** `scripts/dev/stack.sh` and `README.md` only.
- **Checks (EXIT lines in the scratchpad `sweepflows-b/` logs):** app `tsc --noEmit` EXIT 0 (twice); eslint on every changed file 0 errors; jest on the touched screens, route-guard and route-graph green (see the hand-back for counts); gates and `check_tasks.py --write` per the hand-back.
- **Setup:** databases `sweepflows_wawu_hub_test` and `sweepflows_wawu_id_test` (dropped), ports 7870 to 7877 and stand-ins 7930 to 7932 (stopped, `lsof` empty); a WAWU ID worktree at `origin/main` `cdfa442` (removed at the end).

## Verifier report

_Not yet verified._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
