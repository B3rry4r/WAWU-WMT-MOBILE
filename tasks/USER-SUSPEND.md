---
id: USER-SUSPEND
title: A moderator can suspend a person and lift it; a suspended person is hidden and cannot write, but is never trapped (Apple 1.2, Google Play UGC)
owner: YOU
area: APP
order: -1290
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [REPORT-UGC]
decisions: [R-27, R-29, R-47, R-121]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# USER-SUSPEND · Eject the person who posted it

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T2). Status verifying. Hub `wmt/USER-SUSPEND` `ebc6458` (branched from `origin/wmt/REPORT-UGC` `24d871c`: PR #246 had not merged), app `wmt/USER-SUSPEND` (on `origin/wmt/REPORT-UGC` `c8b0c873`). Default (lead), owner may override: R-121 in `DECISIONS.md`.

**Hub (done, proved).** Table `UserSuspension` (a table, not columns on `UserProfile`: a profile row is not made for everyone at sign-up, and a suspension needs a history), migration `20261229090000_user_suspension` (later than every stamp on every origin ref; rollback refuses while any suspension is in force). Routes `POST /admin/users/{id}/suspend`, `POST /admin/users/{id}/lift`, `GET /admin/users/{id}/suspension` (superadmin, reviewer, support; finance refused), `GET /me/suspension` (the person's own state, never the reason or the note). Every suspend and lift writes an admin ops audit row (`user_suspended`, `user_suspension_lifted`) with who, why and the note. Both acts are safe to repeat. A report resolve gains `suspend` and `take_down_and_suspend` and `suspendReason` (default: the report's own reason); `take_down` on a PROFILE now suspends (it answered 409), and one assertion in `ugc-report.contract.spec.ts` changed with it. The queue row gains `subjectSuspended` and `canSuspend`.
- Hidden from everyone else, by one helper (`src/common/suspension`, read by `BlockedAccountService`): the feed (trending, recent, top), following, search (content and people), closest, the creator shelf and the public shelf, Saved, comments, community messages, rooms, the public profile routes and the explore directories; direct links (a piece, a profile, a shelf, a room) answer 404 with the words of a missing id, for a signed-in reader, a signed-out reader and a buyer (a block keeps what a person bought, a suspension does not). The person sees their own. Lifting restores all of it; nothing is deleted. Proof: `user-suspension-hidden.contract.spec.ts` (before / during / after on 12 surfaces). Mutation: with the helper's two filters removed and the guard disabled, the hidden and the write specs FAIL (2 named tests); restored, they pass.
- Writes: a global interceptor refuses every write of a suspended person (403, `reason.code` `account_suspended`, the words "Your account is suspended. Contact support@wawuafrica.com.") before the body is read. An allow list lets through export, delete the account, their own money out to a bank (and the PIN, device and identity steps to get there), push token, notification and read markers; a spec checks every entry is a real route and every other write in the contract is refused. Proof: `user-suspension-writes.contract.spec.ts`. LIVE (stack `test_usersusp`, the Hub's AppModule on the Nuvion stand-in, a funded wallet): while suspended, `POST /money/transfers/bank` answered 201 `pending` (a withdrawal goes out), `POST /money/transfers/wawu` with a key and PIN 403 `account_suspended`, a comment 403 `account_suspended`, `GET /me/suspension` 200 `suspended: true` (`scratchpad/user-suspend/e2e-withdraw-result.txt`).
- Route guards run before the write guard (an interceptor runs after every guard): a suspended person with no wallet who taps a wallet-gated write is told to open one, and one who is not a creator is told creators only. They cannot do the thing either way; the next write, with the guard passed, gets the suspended refusal.
- Checks (EXIT lines in `scratchpad/user-suspend/logs/`): Hub tsc EXIT 0; eslint on changed source EXIT 0 (0 errors); gates PASSED EXIT 0; check_baseline EXIT 0; contract:build EXIT 0; new specs 4 suites 33 tests and the ugc, account-data-map, data-export-map, publishing-gate-coverage, hub-rate-limits, blocked-account and route-shadowing specs: 15 suites 175 tests EXIT 0. Protected routes (`src/protected-routes`): 236 of 244 pass on this branch AND on the untouched `origin/wmt/REPORT-UGC` head in this environment (the same 8 verification / professional routes fail on both, the stack's WAWU ID mock answers 502 to the verification call); CI runs them with its own mock.

**App (done, tested, pictures NOT RUN).** `GET /me/suspension` is in the app's contract. The client reports a 403 `account_suspended` once (`src/api/suspension.ts`, a middleware in `src/api/client.ts`); the root layout opens the new signed-in route `/suspended` (`SuspendedScreen`: the Hub's words, the support address as selectable text, "Go back", the bar's arrow), once while it is open; Me shows the shared warning banner with the Hub's sentence while suspended (`SuspendedBanner`), which opens the same screen. Nothing is drawn that is not built (R-47); no board draws either (R-29, gap row below). Jest on Platform.OS android: `src/features/suspension/__tests__/suspension.test.tsx` 7 tests, `src/__tests__/route-guard.test.tsx` (the new route is in the signed-in group) PASS. tsc EXIT 0.
- **Fingerprints.** JS only, no native change: android `e871fe1a`, ios `e8e7de85` (unchanged from REPORT-UGC).

**NOT DONE (remaining, hand-back).**
1. **Admin dashboard** (`B3rry4r/wawu-dashboard`, branch `wmt/USER-SUSPEND` from `origin/main` `9bb92c5`, worktree not pushed): the Reports queue screen (open reports with item, kind, reason, reporter count, first reported; open the item; Dismiss, Remove, Remove and suspend, and Suspend on a profile or a paid question) and a Suspend / Lift dialog with reason and note on a person. The Hub side is ready: `GET /admin/reports` rows carry `subjectSuspended` and `canSuspend`; `POST /admin/reports/{id}/resolve` takes `action` `dismiss | take_down | take_down_and_suspend | suspend`, `note`, `suspendReason`; `POST /admin/users/{id}/suspend` takes `reason` (spam, harassment, hate, sexual, illegal, impersonation, other) and `note`; `/lift` takes `note`; `GET /admin/users/{id}/suspension` answers `{ suspended, current, history }`. The dashboard's contract generators read the backend at a ref and must be re-run against this branch.
2. **Pictures** (owner hard rule 1): the app's suspended screen and the Me banner at 390 px dark and light, and the dashboard's Reports queue and suspend dialog at desktop width, into `scratchpad/user-suspend/shots/`. Not taken (no web export of this app head was run).
3. **PHONE CHECK.** (1) A suspended person's comment or message on a phone opens the calm screen, Back returns to where they were, and the Android Back button does the same. (2) The support address can be long-pressed and copied on iOS and Android. (3) Me shows the banner after a moderator suspends the person (pull to refresh or reopen Me after a minute) and it is gone after the lift. (4) A withdrawal from the Wallet still goes through while suspended.

## Capability checks

- [x] A moderator can suspend a person with a reason and a note, and lift it, and every act is in the audit (Hub specs).
- [x] A suspended person is hidden from everyone else on every list and direct link REPORT-UGC filters, and everything is back after the lift (Hub spec).
- [x] A suspended person's writes are refused in words, and export, delete, their own money out and the markers go through (Hub spec; live stack).
- [x] A report on a profile with take down suspends the person; a piece, comment or message can be removed and its person suspended (Hub spec).
- [x] The app opens one calm screen on a refused write and shows a banner on Me (app tests on Android).
- [ ] The admin dashboard has a Reports queue and a Suspend / Lift dialog (NOT DONE).
- [ ] Pictures at 390 px dark and light beside no board (R-29), and the dashboard at desktop width (NOT RUN).

## Gap rows (R-29)

- No board draws the suspended screen or the Me banner: built from `ScreenFrame`, the state-view tile, `Button` and the shared `Banner` (warning), no new component.
- The Hub's inbox still lists a chat row with a person the viewer blocked; a suspended person's chat row is hidden from the other person by the same `hiddenFrom` (inbox), their messages inside an existing 1:1 chat are not removed (the chat itself is closed to new writes toward them).

## Follow-ups

- Money in flight for a suspended person (a paid question waiting for their reply, a ticket to their event) is not changed by this task: sales of their content stop (the content is hidden), earnings and refunds still land. A sweep row if the owner wants it ruled.
- PR #246 (REPORT-UGC) merges first; this Hub branch contains its commits.
