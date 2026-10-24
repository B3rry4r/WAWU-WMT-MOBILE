---
id: SWEEP-FLOWS
title: Flows sweep: the broken user flows of the 23 Oct full audit (B1 to B16)
owner: YOU
area: OPS
order: 161
priority: launch
repo: all
type: backend-refactor
status: review
depends_on: []
decisions: [R-13, R-17, R-27, R-30, R-37, R-43, R-47, R-72]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-FLOWS · Flows sweep: the broken user flows of the full audit

## Current state

As of 23 Oct 2026, built by a Sonnet builder (T1); verified 23 Oct 2026 by a separate Sonnet verifier: FIX round 1, then PASS on the re-check (see Verifier report). No PR.
- **Branches:** mobile `wmt/SWEEP-FLOWS` on `origin/main` `b1a460f3` (code and records); backend `wmt/SWEEP-FLOWS` on `origin/main` `13e27536` (`scripts/dev/stack.sh` and its README line only, B1).
- **Rows:** B1 to B9, B12 and B14 fixed with a test that fails without the fix; B10 ruled no (reason in the row); B11, B13, B15, B16 are not this sweep (one line each below). Source: `flow-audit/REPORT.md`, section 2.
- **Spec assertions flipped (each pinned a defect this sweep fixes):** `unlockFlow.test.tsx` x3 (the post stayed locked until Watch now or Done), `WalletSettingsScreen.test.tsx` x1 and `walletSettingsFlow.test.tsx` x1 (the Beneficiaries row), `aboutScreens.test.tsx` x1 ("Not available yet" row), `publishAndTier.test.tsx` x2 (the share line `wawu/<creator>/<slug>`). The unlock suite's stand-in feed now opens the piece once it is paid, as the Hub does.
- **Without the fix:** with the 14 source files put back to `origin/main`, 25 tests fail across 11 suites (themePick, aboutSupport, createdLink, publishAndTier, unlockFlow, WalletSettingsScreen, walletSettingsFlow, afterSignup.screens, sweepFlowsSetup.route, VisitorProfileScreen, aboutScreens); the files were then put back and the same suites pass.
- **Proved on the stack (name `sweepflows`, Hub 7870, WAWU ID 7871 real, Nuvion stand-in, mail stand-in 7930, all stopped and the databases dropped):** B1 only. `GET /auth/signup/channel` answered `email`, `POST /auth/signup` answered 200 with `channel: email`, and the mail stand-in recorded the code mail. Before: `flow-audit/shots/auth-user-06-after-continue.png` (503 on the same origin/main). **NOT RUN:** the 390 x 844 before and after pictures for B2 to B9 (out of step budget); the unit and route tests above are the proof for those, and the audit's pictures are the before.
- **Not run:** any real provider, anything Fintava, the full suites (the merge agent runs the full check).

## Fix round (23 Oct 2026, builder, after the verifier's FIX)

- **F1 (high), fixed:** `src/app/(tabs)/index.tsx` no longer calls `useSafeAreaInsets()`. The other tab screens do not either: Explore's notice is the shared `Toast` with `placement="bottom"` and its default offset (`ExploreScreen.tsx`), and the tab screens' tests (`homeRoute.test.tsx` included) render without a provider. The `useSafeAreaInsets` shared test wrappers (`library/__helpers__`, `chat/testing`, `create/__helpers__`) belong to features that read insets themselves, so this notice took its place from the shared component instead; no test was edited, `homeRoute.test.tsx` passes unchanged.
- **L2 (low), fixed with F1:** the B14 notice is the shared Toast at the bottom (above the tab bar, as Explore's notices), so it never covers the Today, Following and For you row.
- **L1 (low), fixed:** `visitorTileOf` (`src/features/me/model.ts`) draws a paid piece with `fullAssetLocked: false` for the viewer open (no frost, veil or lock, spoken "yours"), used by the creator's profile grid only (the owner's own grid keeps `tileOf`, as the Hub counts the owner as unlocked); an answer that does not say stays locked. `useUnlock` also reads the profile grids again when an unlock is paid. Test: `VisitorProfileScreen.test.tsx` "SWEEP-FLOWS L1", fails without.
- **L3 recorded, not fixed:** BACKEND_GAPS G-SWEEP-FLOWS-2 (`GET /api/hub/communities/{id}/messages` answers 403 to a non-member while the screen says "Reading is free").
- **L4 recorded, low, not fixed:** the app logs a 404 `GET /product-drafts/<id>` after VF12 publishes (the draft is gone by then); no effect seen.
- **Legal assistant:** not walked on the stack (the network guard stays); to be tested on the server once the key is there.

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

**Verdict: FIX.** Every row B1 to B9, B12 and B14 works on the live stack; one existing test is red on the branch (F1, high). B10 is ruled no (lead). Nothing else is medium or worse.

Verifier: a separate Sonnet session (T1 check plus re-walk), 23 Oct 2026. Heads: mobile `a649b6cc` on `origin/main` `b1a460f3`; backend `ba8bf9f` (stack.sh and README only). Stack `sweepflowsv` (Hub 7870, WAWU ID 7871 real, web export 7873, Nuvion stand-in 7876, mail 7930, voice 7931, storage 7932), 390 x 844, light first; screenshots in `flow-audit/after/` beside the audit's `flow-audit/shots/`.

### Live rows (each walked as a person; AFTER picture beside the audit's BEFORE)

| Row | Result | What was seen (after/ file) |
|---|---|---|
| B1 | PASS | Create an account (A3 says "We'll email you a code"), A4 Continue answered 201, the mail stand-in recorded "Your WAWUAfrica verification code", the 6-digit code was accepted, claim-offer opened (b1-01..03). Before: auth-user-06-after-continue (503). |
| B2 | PASS | Bola, For you, Unlock the full set, PIN: the card lost its Unlock bar the moment H16 showed, with no reload; wallet read back 98,000 naira; a reload showed the same card (b2-01..07). Before: home-user-08. |
| B3 | PASS | Free chat with a creator whose paid messages are off: "Message Ngozi Eze" under the "Messages off" note opened the chat, one message sent and shown, no Hub refusal, no 4xx (b3-01..03). |
| B4 | PASS | A creator bought Founding Maker inside sign-up setup; VF7 "Record my voice" opened /voice-consent, "Write my Voice Intro" opened /voice-intro, both inside setup (b4-01..08). |
| B5 | PASS | Same creator: checklist, Later went straight Home; VF1 never drawn (b5-01..02). |
| B6 | PASS | No tier: "Uploading needs a tier / Drafts are free. Pick a tier when you are ready to publish."; with the tier: "Uploading is open" (b6-01, b5-01). |
| B7 | PASS | On a light-scheme browser, Theme, Dark: the screen went dark at once and stayed dark after a reload; Light went light (b7-02..04). Phone check still the owner's. |
| B8 | PASS | About, Contact support (signed in) opened the support chat /chat/<id> (b8-01..02). Visitor path covered by test only. |
| B9 | PASS | Wallet settings shows PIN, Statements, Account details, Help with a payment; no Beneficiaries row (b9-01). |
| B12 | PASS | Published piece shows and shares `wawuafrica.com/content/<id>`; the id equals the Hub's content id (admin queue), and the admin approve answered 200 for it. Community: the card reads wawuafrica.com/c/<slug>, Copy put `https://wawuafrica.com/c/lagos-photographers` on the clipboard and the share sheet got the same (b12-01..03). No wawuafrica.com request was made. |
| B14 | PASS | Delete account, Z7, Done, sign in again: "Your account deletion is cancelled. Welcome back." shown over Home (b14-01..05). |

### Checks

| Check | Result |
|---|---|
| App `tsc --noEmit` | EXIT 0 |
| eslint on the 36 changed ts/tsx files | EXIT 0, 0 errors, 1 warning (`MB18` unused in publishAndTier.test.tsx, same line on origin/main) |
| Full mobile jest (`npx jest --ci --maxWorkers=2`) | EXIT 1: 314 of 315 suites pass, 5287 of 5288 tests pass; the one failure is F1 |
| Gates | `run.py` EXIT 0 (10 gates, 1211 files scanned, 0 fail, 18 warn); `check_baseline.py` EXIT 0 (0 entries); gate unit tests EXIT 0 (56 tests) |
| `check_tasks.py` | EXIT 0 (397 tasks) |
| Flipped assertions (unlockFlow x3, WalletSettingsScreen x1, walletSettingsFlow x1, aboutScreens x1, publishAndTier x2) | each pins exactly the defect its row fixes (still-locked post, a "6 saved" Beneficiaries row, "Not available yet", `wawu/<creator>/<slug>`); the diff changes nothing else; the unlock suite's feed stand-in now opens the piece once paid, as the Hub does |
| New and changed tests on origin/main's code | 13 of 13 suites fail (25 tests), as the builder said; B2, B3, B9, B8, B6, B5, B4, B12 fail on their assertions; themePick (B7) and cancelNotice (B14) fail on the missing module, so the live walk is their proof |
| SHARED-CHANGES SWEEP-FLOWS #1 (theme/index.ts, override.ts) and #2 (_layout.tsx) | match the code; theme/index.ts changes only the import and `useWawu`'s `dark`; _layout.tsx moves two screens and a comment |

### Findings

- **F1 (high, defect):** `src/features/home/__tests__/homeRoute.test.tsx` "opens Notifications (M31) from the bell in Today's bar" fails on the branch with "No safe area value available" and passes on origin/main. `src/app/(tabs)/index.tsx:26` now calls `useSafeAreaInsets()` (the B14 toast) and that test renders HomeTab with no SafeAreaProvider. Repro: `npx jest --ci src/features/home/__tests__/homeRoute.test.tsx`. The full check is red until the test or the hook is made to agree (the fix is the builder's, the verifier edits nothing).
- **L1 (low, observed, not checked on origin/main):** after buying "Lagos Light Study", the creator's profile content grid still draws that tile with a lock and the price (b3-01).
- **L2 (low):** B14's notice sits over the top of the Today / Following / For you row at 390 px and hides it for a few seconds (b14-04).
- **L3 (low):** a non-member opening an open community reads "Join to read and write here. Reading is free." while the Hub answers 403 to the message read until they join.
- **L4 (low, note):** the app logs a 404 `GET /product-drafts/<id>` after VF12 publishes (the draft is gone by then); no effect seen.
- Not this sweep, unchanged: B10 (ruled no by the lead), B11, B13 (the web export still throws `setSelection` on multi-line fields), B15, B16.

### Re-walk (flows the audit did not reach; marks as in the audit)

| Flow | Mark | Note |
|---|---|---|
| Inbox: paid question thread | NOT WALKED | the creator's paid messages stayed off; out of step budget |
| Inbox: pay a request | NOT WALKED | out of step budget |
| Inbox: a fan joining a community | PASS | Join answered, "1 member", composer and "Buy credits" for a new joiner (rw-community-joined) |
| Professionals: directory | PASS (empty state only) | "Nobody listed yet" with "Offer your services"; no approved listing existed |
| Professionals: profile, message | NOT WALKED | needs an approved listing |
| Events: my tickets | PASS (empty state only) | "No upcoming tickets" |
| Events: organiser dashboard, call it off | NOT WALKED | needs a hosted, approved event with a sale |
| Events: door scan | PHONE ONLY | camera |
| Schools: apply on the school's site, class full | NOT WALKED | no school seeded |
| Schools: My courses | PASS (empty state only) | "No courses yet" with "Find a school"; the with-a-course case NOT WALKED |
| Settings: blocked accounts | PASS | Block from the profile menu, listed, Unblock, list empty again |
| Settings: download my data | PASS | the request (`POST /settings/privacy/export`) answered and the row read "On its way to your email"; the mail itself not confirmed |
| Settings: switches honoured by the server | PASS | privacy and notification switches sent a PATCH and kept their value after a reload |
| Explore: categories | PASS | all categories listed with creators |
| Explore: search results | PASS | "light" found both pieces under Content |
| Services, Legal: chat opener and first message | NOT RUN | lead addition: the stack's Hub cannot reach Gemini (`block-net.cjs` refuses every host that is not this machine and `stack.sh` sets `GEMINI_API_KEY=` empty). Letting that one host through means weakening the stack's network guard, which the permission check refused; it needs the lead's explicit go-ahead (an allow setting in `stack.sh`, or a Hub started outside it). The key file was not opened. |

Re-walk counts: PASS 9 (4 of them empty states only), NOT WALKED 8, PHONE ONLY 1, NOT RUN 1, BROKEN 0.



### Re-check of the fix round (a2b50611), 23 Oct 2026: PASS

**Verdict: PASS.** F1, L1 and L2 are fixed; L3 is recorded as G-SWEEP-FLOWS-2 and L4 as a low in this file. Nothing medium or worse is open.

| Check | Result |
|---|---|
| No test assertion edited | The fix round touches one test file, `VisitorProfileScreen.test.tsx`, with 21 added lines and none removed; `homeRoute.test.tsx` is byte-identical to bfa3f807 and passes. |
| Toast is the shared one | `(tabs)/index.tsx` still imports `Toast` from `@/components/Toast` and only changes `placement` to `bottom` and drops the insets hook (Explore and Categories use the same placement). |
| New L1 test fails before, passes after | On bfa3f807's code it fails on its own assertion (a bought tile still drawn locked); on a2b50611 it passes with homeRoute (29 of 29). It also pins that a piece the Hub says is locked, or says nothing about, stays locked. |
| L1 live (390 x 844, light) | Before paying, the creator's grid tile carried the lock (l1-01). After paying an unlock from For you and "See now", the same tile in the same session lost its lock and read "Lagos Light Study, yours, 2,000 naira" (l1-03 without a reload, l1-04 after one). The Hub's own grid answer said `fullAssetLocked: false` for that viewer. A dim veil remains because the stand-in storage serves no picture, which the grid draws behind any tile without a still. |
| L2 live | After a scheduled deletion and a new sign-in, "Your account deletion is cancelled. Welcome back." sits at the bottom (box 663 to 730 px) above the tab bar (top 767 px) and covers none of the Today, Following, For you row (62 to 83 px) (l2-01). It overlays the creators strip for its 6 seconds, as Explore's notices overlay theirs. |
| app `tsc --noEmit` | EXIT 0 |
| eslint (no --fix) on the 5 changed files | EXIT 0, 0 errors, 1 old warning (`MB18`, unchanged) |
| Full jest (`npx jest --ci --maxWorkers=2`) | EXIT 0: 315 of 315 suites, 5289 of 5289 tests |
| Gates | `run.py` EXIT 0 (10 gates, 1211 files scanned, 0 fail, 18 warn); `check_baseline.py` EXIT 0 (0 entries); gate unit tests EXIT 0 |
| `check_tasks.py` | EXIT 0 (397 tasks) |

Stack `sweepflowsv` (a fresh one, WAWU ID at origin/main 9596928, Hub on backend ba8bf9f); stopped, databases dropped, ports 7870 to 7877 and 7930 to 7937 empty.

## Owner sign-off

_Owner: date, and "go" or what blocks it._
