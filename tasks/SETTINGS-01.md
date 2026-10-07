---
id: SETTINGS-01
title: Settings, notifications, privacy and blocked
owner: YOU
area: SETTINGS
order: 95
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [SHELL-01, SHELL-02, UI-02, SETTINGS-03, SETTINGS-04, SETTINGS-07, HOME-11, SETTINGS-02]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [Z2, Z3, Z4, Z5, Z12]
---
# SETTINGS-01 · Settings, notifications, privacy and blocked

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py Z2 Z3 Z4 Z5 Z12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for Z2 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **Z2 · Settings**: Header card (initials LE, name, lennox@wawu.africa · 0803 ••• 4412). Rows: Notifications; Privacy; Password; Wallet and PIN (no tier: a subtitle such as 'PIN, statements, limits', BRIEF Z2); TGIF on Home (Daily verse and prayer, toggle); Sound (Taps and alerts); Theme (System); About WAWU; Terms; Privacy policy; Sign out; Delete account.
- **Z3 · Notifications**: Toggle groups: Money (Money in: tips, sales, transfers; Refunds), Messages (Paid questions incl. reply deadlines; Community messages), Content (Reviews: approved or sent back; New followers), From WAWU (News and offers).
- **Z4 · Privacy**: Your profile: Show what I have bought (Off, nobody sees your purchases), Show my saved items, Show who I follow; Communities: Show me in member lists (Your messages are visible either way); Blocked accounts (2); Download my data (Sent to your email); Privacy policy.
- **Z5 · Blocked**: Blocked accounts list (Spam Account, Tunde K.) each with Unblock; caption 'They can't message you, see your profile or find you in search.'
- **Z12 · Nobody blocked**: Empty state: 'Nobody blocked. Block someone from their profile menu.'
- **Change password** (not drawn): the screen Z2's Password row opens, built in A22's field style (current password, new password, Save); recorded in BRIEF.

## Brief changes (build these, not the canvas)

- **Z2**: no tier, for example "PIN, statements, limits". (Why: Fintava fact: no tiers in the API.)
- **Z2**: Password opens a change-password screen in A22's field style (current password, new password, Save). (Why: the row is drawn; its screen is built in the canvas's own style.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- Z2: Wallet and PIN (opens W35): added by WALLET-06
- Z2: Delete account (opens Z6): added by SETTINGS-05

## Capability checks

- [ ] **Z2**: a user can open Notifications (Z3), Privacy (Z4) and Password (change password); open About WAWU, Terms and Privacy policy (Z9 to Z11); toggle TGIF; toggle sound; pick theme; sign out.
- [ ] **Z3**: a user can toggle each category.
- [ ] **Z4**: a user can toggle each; open Blocked accounts; request data download; open privacy policy.
- [ ] **Z5**: a user can unblock.
- [ ] **Z12**: a user with nobody blocked sees "Nobody blocked" and how to block someone.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states Z12.
- [ ] A user can change their password from Z2 (current and new), and their other devices are signed out (SETTINGS-03).

## What the backend serves today (from the analysis)

- **Z2**: partial. Missing: Missing: change-password (signed-in, current+new), transaction PIN and tier, server-side session revoke on sign-out.
- **Z3**: partial. Missing: Keys exist for Refunds (refunds), New followers (newFollowers), News and offers (promotions), Paid questions (≈ dmReminders + newReplies). MISSING keys: moneyIn (tips, sales, transfers), communityMessages (current key is a weekly digest, not per-message), contentReviews (approved/sent back). Dispatch code must also honour the new keys.
- **Z4**: partial. Missing: Toggles and blocked list served. Data export only records a 'pending' row (data-export-request.service.ts:13 'only ever writes status: pending'); nothing compiles or emails the export, so 'Sent to your email' is not fulfilled.
- **Z5**: partial. Missing: Not enforced in search (search-response module) or public profile (user-profile module) - grep shows no blockedAccount reference there, so the caption's 'see your profile or find you in search' is not true today.
- **Z12**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z2: 'Tier 2' on Wallet and PIN row

## Designer notes (⚠, unresolved)

- None.

## Builder report

Built 7 Oct 2026 by the lead's builder session. Mobile branch `wmt/SETTINGS-01` (code commit `83b7ee7`, then main `8369e39` merged). **No backend change was needed**, so there is no backend branch and the contract is unchanged: `npm run api -- --backend` against backend main `6c0e435` and `--identity` against wawu-id main `4715d17` both leave `contract/` and `src/api/*.generated.ts` byte-identical. Every route the screens call already exists: `GET/PATCH /settings/notifications` (SETTINGS-07), `/settings/privacy`, `/settings/privacy/blocked` (paged; the row id is what Unblock deletes), `/settings/privacy/export` (SETTINGS-04), `/settings/tgif` (HOME-11), `GET /users/me`, and on WAWU ID `POST /auth/change-password` and `POST /auth/logout` (SETTINGS-03).

**Files.** `src/features/settings/` (`SettingsScreen` Z2, `NotificationsScreen` Z3, `PrivacyScreen` Z4 with `ExportSheet`, `BlockedScreen` Z5 and Z12, `ChangePasswordScreen`, `ThemeSheet`, `SettingsFrame`, `Switch`, `SwitchRow`, `SwitchGroups`, `useSwitches`, `groups`, `devicePrefs`, `signOutFlow`, `passwordFailure`, `exportState`, `phone`, `failure`, `api/hub.ts`, `api/identity.ts`, three test files, 69 tests); routes `src/app/settings/{index,notifications,privacy,blocked,password}.tsx`; `BACKEND_GAPS.md` G-260 to G-264; `SHARED-CHANGES.md` SETTINGS-01 #1 to #4. No fenced file edited.

**Capability checks (V9 against a real Hub and a real WAWU ID, ports 5301 and 5302, databases `bs01_hub_test` and `bs01_id_test`, built from backend main `6c0e435` and wawu-id main `4715d17`; sign-in through the real sign-in screen, no injected token; logs `v9-*.log`, 50 checks light, 50 dark, 0 failed).**
- Z2: Notifications, Privacy, Password, About Who Made This, Terms, Privacy policy and the header card each call their `onOpen`, jest (`settingsScreens.test.tsx`, 12 Z2 tests). TGIF: tapped, the Hub holds the new value (`GET /settings/tgif` read back), the switch follows the answer, a refusal puts it back. Sound: kept on the phone (localStorage on web, secure store on a phone), never sent; survives a reload. Theme: the sheet offers System, Light, Dark; the pick shows on the row, is kept, and calls `Appearance.setColorScheme` (jest spy; the browser build cannot pin a scheme). Sign out: the refresh token is ended on WAWU ID first, then the phone signs out and leaves Settings; the old refresh token answers 401 afterwards; the phone is back at the welcome screen in 3.5 s although WAWU ID took 21 to 49 s to answer (G-264); offline, and slow, and double tap are jest cases.
- Z3: each of the seven switches tapped in the app, the Hub's value read back through the API, and again after a reload (21 checks). A key the Hub never held (`moneyIn`, `contentReviews`, `communityMessages`) reads as on. "Community messages" saves its key but nothing is sent yet (G-21, G-22 and G-24 already cover this, left as filed).
- Z4: the four switches the same way (12 checks); the blocked count comes from the Hub's total; "Download my data" asks first, then one `POST /settings/privacy/export`, and the row says it is on its way (a second ask shows "already on its way"; the Hub de-duplicates). The email itself waits for WAWU ID's route (G-131), so a request stays pending and is marked failed after 24 hours.
- Z5, Z12: two seeded blocks listed with real names from WAWU ID; Unblock deletes the block's own row id, the Hub's list shrinks 2, 1, 0, and the last Unblock gives Z12 (its real cause). Z12 for a user with nobody blocked also captured.
- Change password: wrong current password is said on that field and keeps what was typed; under 8 characters is refused on the form with nothing sent; success keeps the new session (stored refresh token changes, phone still signed in after a reload), a second device's refresh token is then refused (401), the old password no longer signs in and the new one does; after 6 wrong guesses the real limit answers and the screen says "Wait 15 minutes" (SETTINGS-03's V9, driven from the app).
- Values on screen come from the API or the user: name, tick, email, blocked names, every switch, the count; the phone is masked to its last four digits. Figures not facts: no tier anywhere ("Tier 2 · W35" is not drawn, and the Wallet and PIN row is WALLET-06's).
- States entered by their real cause (V6, both themes): loading by holding every Hub answer, error by dropping the connection (Z2 shows a retry in the header card and on TGIF, Z3 to Z5 the error view), Z12 by a user with nobody blocked, plus the toast, sheets, banner and field errors above.

**Pictures** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bs01/shots/`, 390 px wide, light and dark, 2x): `Z2-`, `Z3-`, `Z4-`, `Z5-`, `Z12-{light,dark}`; `compare-Z*-{light,dark}.png` (canvas on the left, built on the right, aligned on the nav bar; the web page has no status-bar inset, so Z12 was taken 793 high, the canvas's 844 less its 51 px bar); `Z{2,3,4,5}-loading-*`, `Z{2,3,4,5}-error-*`; `Z2-theme-sheet-*`, `Z2-tgif-off-*`, `Z3-toggled-*`, `Z4-toggled-*`, `Z4-export-sheet-*`, `Z4-export-pending-*`, `Z4-export-sheet-pending-*`, `Z5-after-one-unblock-*`, `Z12-after-unblock-*`, `password-*`, `password-wrong-current-*`, `password-short-*`, `password-saved-*`, `password-rate-limited-*`, `signed-out-*`. I do not say they match the design: the verifier decides. Differences I know of: the canvas's "Wallet and PIN" row and "Delete account" line (other tasks); "About WAWU" and "From WAWU" read "Who Made This" (R-37); the canvas wraps the Z5 caption one word earlier (it sets `text-wrap: pretty`, which React Native does not have); a long email wraps the header card's second line instead of cutting the phone.

**Counts.** `npm run check` exit 0 before (main `9221652`, run in the main checkout): 46 suites, 797 tests, gates 9 / 216 files / 0 findings, 208 tasks. After (this branch, main `8369e39` merged): exit 0, 49 suites, 866 tests (+69), gates 9 / 247 files / 0 findings, 208 tasks. Revert proofs: 13 mutants, 13 killed (no rollback after a failed save; an answer overwriting the whole cache; a switch taking a second tap; Unblock not removing the row; Unblock sending the person id; sign-out before the server is asked; the new session not kept; an unheld key reading off; the phone shown whole; every switch sending the whole group; the purchases line shown when on; the tick never drawn; a second Sign out tap not ignored). Two survived the first pass and are killed by the same-frame tests added after.

**Defaults (agent), owner may override.** (1) The header card opens Edit profile (M8, the only profile screen that exists). (2) Sound defaults to off, as Z2 draws it; Theme to System. (3) Both are kept on the phone only. (4) Sign out waits for WAWU ID at most 3 seconds (`SERVER_WAIT_MS`) and then signs out anyway (G-262, G-264). (5) Change password: after success the session is replaced with `adoptSession` (it clears the app's cached answers; SHARED-CHANGES SETTINGS-01 #1 asks for `replaceTokens`) and the screen closes after 1.2 s on "Password changed". (6) Copy the canvas does not draw: the Download my data sheet ("Download my data", "We will email you a link to a file with your data. The file says what it leaves out.", "Email it to me", "Cancel", "Your data is already on its way to your email. Check your inbox soon."), the row lines "On its way to your email" and "Could not be sent, tap to try again", "None" for no blocked accounts, "Account removed" for a block whose person is gone, the Theme sheet, "Your other devices will be signed out.", and the change-password errors ("That is not your current password.", "Choose a password that is different from your current one.", "Too many tries" with the wait). (7) "Show what I have bought" draws its off line only; no line when on, because nothing shows purchases to anyone (G-261). (8) Unblocking a block that is already gone (404) counts as unblocked. (9) The route paths are `/settings`, `/settings/notifications`, `/settings/privacy`, `/settings/blocked`, `/settings/password`.

**Gaps and shared changes.** New: G-260 (Sound plays nothing yet), G-261 (the three "Show" switches are stored and read by nothing), G-262 (offline sign-out leaves the token live), G-263 (Z12 points at a profile menu that is ME-02's), G-264 (WAWU ID sign-out takes 13 to 49 s here). Shared: SETTINGS-01 #1 (identity calls and `replaceTokens`), #2 (shared `Switch`, `SwitchRow`, one `ScreenFrame`), #3 (`_layout.tsx`: apply the saved theme at launch, and guard the five settings routes: **until this is applied a signed-out visitor can open them by link, and Settings is only left on sign-out because the screen navigates away itself**), #4 (ME-03 adds the Settings row that opens `/settings`).

**NOT RUN.**
- V10 on a phone (secure store, native `Appearance.setColorScheme`, Android back, font scaling, safe areas): no build. Unblocked by: a tester build or emulator pointed at a backend.
- The data-export email arriving in a real inbox: WAWU ID has no route that sends it. Unblocked by: the wawu-id task for G-131.
- The saved Theme applying on the next launch: needs SHARED-CHANGES SETTINGS-01 #3 (`applyStoredTheme()` in the root layout). Unblocked by: that edit.
- The Wallet and PIN row (W35, WALLET-06) and the Delete account line (Z6, SETTINGS-05): the task fences them to those tasks, so Z2 draws neither.
- Reaching Settings from the Me menu (Z1, M7): ME-03's row (SHARED-CHANGES SETTINGS-01 #4). The screens were reached by their route.
- A run against live `id.wawuafrica.com` or `api.wawuafrica.com`: never done by rule. The browser build also drops `aria-checked` unless it is passed beside `accessibilityState`, so both are set.

**Process notes.** V9 ran WAWU ID itself on :5302 (wawu-id main in a worktree, `scripts/local/up.sh`), not `mock-wawu-id`: the mock answers a flat body without the `data` envelope the app reads and has no change-password or logout route. The Hub's CORS was set to the web port 8301 in its local `.env`. One early run of my browser driver used a web build whose Metro cache held another session's ports (:5271 Hub, :5272 WAWU ID) and signed in once on that other stack as the seeded creator-pro account (no data was written there); every later build used `--clear` and was checked to contain only :5301 and :5302. `npx expo export --clear` empties the shared Metro cache. Databases `bs01_*`, processes and worktrees were removed at the end.

## Verifier report

Verified on mobile `wmt/SETTINGS-01` 97423b2 (origin/main 8369e39 is an ancestor, so main is fully merged and the trial merge is the branch itself). Built Hub from backend origin/main 6c0e435 (fresh migrated and seeded database `vs01_hub_test`, port 5331) and the real WAWU ID from wawu-id origin/main 4715d17 (`vs01_id_test`, port 5332; `@nestjs/swagger` was missing from the copied `node_modules` and was added to that worktree only). Web export built with a private `TMPDIR` and `--clear`; the bundle holds only `localhost:5331` and `localhost:5332` (no `wawuafrica.com`), and every request of every session went to 5331, 5332 or 8331. Every sign-in went through the app's own sign-in screen. Nothing was fixed. Evidence dir `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vs01/` (`shots/`, `t_*.py` drivers, `mut/`, `states-*.log`). Servers stopped, databases `vs01_*` dropped, worktrees `vs01hub` and `vs01id` removed.

| Pass | Result | Evidence |
|---|---|---|
| V1 Gates | passed, with notes | `npm run check` exit 0 on the branch (second run, `v1-check-branch-2.log`): typecheck, lint, jest 49 suites / 866 tests, gates 9 run / 247 files scanned / 0 findings, baseline 0, tasks 208. The first run (`v1-check-branch.log`, machine load 16 on 4 cores) had one 20 s timeout in `open-wallet/OpenWalletScreen.test.tsx` (not this task's code); the rerun on a quieter machine passed all 866. Trial merge with mobile origin/main: nothing to merge (ancestor). Scope fence: changed files are only `src/features/settings/`, `src/app/settings/`, `tasks/SETTINGS-01.md`, `BACKEND_GAPS.md`, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`; `src/app/_layout.tsx`, `src/api`, `src/components`, `package.json` are byte-identical to main. No em-dash and no hex or rgb literal in the feature code (the two grep hits for the dash are tests asserting its absence). Diff against the builder's file list: `SwitchesLoading.tsx` and `metrics.ts` are in the diff and not in the report's list (docs only). |
| Security and privacy | passed except D1, D2, D3 | see "Security and privacy" below |
| V4 Data trace | passed | two seeds (non-canvas "Ngozi Adebayo", "Emeka Obi", "Zainab Bello", 0812 ••• 0777; then the canvas's values). 16 of 16 toggle checks (TGIF 3, Z3 seven switches plus reload, Z4 four switches plus reload): the Hub row changes on the tap and the UI after a reload equals the Hub row (`t_v4b.py`). Header name, tick (from the Hub profile row `creator_verified_at`, not WAWU ID's), email, phone and blocked names come from the API; blocked count is the Hub's total; an unheld key (`moneyIn`, `contentReviews`, `communityMessages`) reads on, saves on the first tap. Sound and Theme are phone-only (no request carries them; `wmt.pref.*` in localStorage, survive reload). |
| V5 Picture | passed, every difference classified below | pairs `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vs01/shots/compare-Z{2,3,4,5,12}-{light,dark}.png` (canvas left with its 104 px status bar cropped, built right, 390 px, 2x); built alone `Z*-390-*.png`; 320 x 568 `Z*-320-*.png` (no horizontal overflow on any of 20 screens, measured; Z2 header wraps the email onto two lines and keeps the masked phone whole) |
| V6 States | passed | both themes, by real cause (`states-light.log`, `states-dark.log`): loading by holding every Hub answer 8 s (Z2 to Z5 skeletons); error by aborting every Hub request ("No connection", retry on the header card and on TGIF) and by a 500 ("This could not be loaded"); toggle rollback on a 500 (Z3 refunds, Z4 showFollowing, Z2 TGIF) and offline (Z3 newFollowers; the Hub row unchanged); theme sheet; export sheet, send, pending row, second ask "already on its way" (Hub row `pending`); unblock 2 to 1 to 0 gives Z12 (Hub rows 2, 1, 0; Privacy row then reads "None"); unblock of a row another phone removed (live 404) leaves the list without an error; unblock failing with a 500 keeps the row and says "Internal server error"; another person's block id answers 404 and stays; password: empty form, short, wrong current (typed text kept), unchanged, success toast and return to Settings, 6th guess "Too many tries, Wait 15 minutes" |
| V9 Live seam | passed | sign-in through the real screen against the real WAWU ID and a freshly seeded Hub; values only the server holds shown (changed names, phone, switches, block count); every write read back from the database. Block promise checked: with person C blocking person B, B no longer finds C in `GET /search` and gets 404 from `GET /users/{C}/public-profile`, while a third person still finds and sees C (`GET /users/public/{id}` is the deliberately unauthenticated route and does not apply blocks). DM refusal not tried (see NOT RUN) |
| Mutants | 11 of 12 killed | `mut/results.json`: sign-out before the server is asked, cache not cleared at session end (`api/query.ts`), phone shown whole, no toggle rollback, unblock 404 shown as an error, current password not required, new session not kept, logout sent the access token, sign-out waits on a slow server forever, unblock sends the person id, no in-flight guard on Sign out: all killed. Survivor M12: the new password also put in the request URL: 69 of 69 tests still pass (test gap, see D4). Worktree restored from copies after each; `git status` clean |

### Security and privacy

- **Sign out.** Online: the phone is on the welcome screen in 1.0 s; localStorage, sessionStorage, IndexedDB, cookies and Cache Storage are empty afterwards (before: `wawu.session.access` and `wawu.session.refresh`); neither token, nor the email, phone digits or name, appears anywhere in storage; `POST /auth/logout` carries the refresh token, and the old refresh token answers 401 straight after. The order is server first: the logout request leaves before the tokens are cleared. Slow server (request held 9 s): welcome at 3.2 s, the request carries on and the old refresh token is dead 9 s later. Offline (`set_offline`): welcome at 0.3 s, storage empty, nothing shown to the person; left behind is exactly one thing, on the server: the refresh token is still valid (it issued a new pair when presented afterwards; 30 days in this build) and nothing retries (G-262 as filed). An access token copied before sign-out keeps answering 200 at the Hub until its own 15 minute `exp` (stateless JWT; true after a password change too).
- **B after A.** B's header card, Settings, Privacy and blocked list show only B's data in every run (B with nobody blocked gets Z12). With A's Privacy, blocked-list and profile reads held in the client for 20 s across sign-out and B's sign-in, their late answers did not reach B (cache `settings/privacy` stayed B's, `settings/blocked` stayed `[]`). Two exceptions, D1 and D2.
- **Change password.** Current password required (empty form refused before any request); wrong current is 400 and said on that field; the new password and the old one appear in no URL, no browser console line, no storage, no query-cache entry and not in the Hub or WAWU ID server logs (0 matches); the passwords travel only in the JSON body of `POST /auth/change-password`. After success: stored refresh and access tokens both changed, a reload still signs in and Settings loads, a second device's refresh token answers 401 (its access token still answers 200 at the Hub until it expires, up to 15 minutes), the old password no longer signs in and the new one does. The 5-guess limit holds: guesses 1 to 5 answered 400, the 6th and 7th 429 ("Wait 15 minutes"), and a correct password was also refused while limited (the server's own counter; I deleted the row afterwards).
- **Phone.** Screen, DOM, header `aria-label`, storage and console show only `0803 ••• 4412` (nothing else of the number appears in the page HTML). The query cache does not: D3.
- **Signed-out visitor on the five routes** (new browser, no storage). `/settings`: the full Settings page draws, with "Your details did not load" and TGIF "Could not load"; it sends `GET /users/me` and `GET /settings/tgif` with no Authorization header, both 401. `/settings/notifications`, `/settings/privacy` (three requests), `/settings/blocked`: "This could not be loaded, Unauthorized", no token on any request, all 401. `/settings/password`: the form draws; Save sends nothing and says "Your session ended". No crash (no page error), no other person's data, no request with a token. Tapping Sign out there goes to welcome. This is the recorded shared change SETTINGS-01 #3(b) and not a new defect of the screens; its side effects are D2.

### V5, what differs from the canvas (all with the canvas's own data seeded: LE, tick, Spam Account, Tunde K., switches as drawn)
- Z2: no "Wallet and PIN" row and no "Delete account" line: differs-for-recorded-reason (task section "Added by later tasks": WALLET-06 and SETTINGS-05; BRIEF Z2 would give the row "PIN, statements, limits"). "About WAWU" reads "About Who Made This": differs-for-recorded-reason (R-37 copy rule). Header card, three rows, TGIF, Sound, Theme, Terms, Privacy policy, the tick, switch sizes, colours, dividers and spacing match in both themes; Sign out (danger colour) sits under the last card as drawn below the fold. Nothing the canvas draws below Privacy policy was compared beyond that.
- Z3: matches except "From WAWU" reads "From Who Made This": differs-for-recorded-reason (R-37). Money in, Refunds, Paid questions, Community messages, Reviews, New followers, subtitles, group labels and switch states match.
- Z4: matches in both themes (labels, off line, "2", "Sent to your email", icons). The built "Show what I have bought" draws its off line only: builder default 7 (G-261).
- Z5: rows, names, Unblock pills, caption match. Two small differences: the caption wraps one word later ("find you in / search" against the canvas's "find you / in search"; React Native has no `text-wrap: pretty`; recorded in the builder's report only, no DECISIONS entry): minor, platform. The avatars are yellow and green where the canvas draws coral and sky: the API carries no colour, the builder derives one from the person's id; no decision records it: minor, unrecorded.
- Z12: matches in both themes (icon, title, line, vertical position).
- The built web page has no status bar and sits 1 px lower than the cropped canvas (crop of 104 px against the 102 px bar); not a defect.

### Findings
- **D1 defect (low to medium, wrong value on screen after an account switch).** A late save answer of the account that signed out is written into the next account's cache. `useSwitches.set` (`src/features/settings/useSwitches.ts`) calls `config.write` itself and, after the `await`, runs `client.setQueryData` on the shared key with no check that the session is the one it started in (the app's guard in `api/query.ts` covers only `useMutation`). Reproduction (`t_latewrite.py`, light): A (Lennox) opens Privacy; the client holds Hub answers 25 s; A taps "Show who I follow" (A's row becomes false at once); back to Settings; Sign out; sign in as B (Emeka, all four switches on in the Hub); open Privacy: all on. 25 s after A's tap B's "Show who I follow" flips to OFF while B's Hub row is still true; the cache entry is B's (`userWawuId` B) with `showFollowing: false`. A reload shows on again. Same path for every switch on Z2 (TGIF), Z3 and Z4. B would believe their follows are hidden while the Hub shows them. Needs a save answer that outlives a sign-out and a second sign-in on the same phone, so rare, but it is the cross-account leak this pass looks for.
- **D2 defect (low).** After sign-out the still-mounted Settings screen re-requests its data with no token before it navigates away (`GET /users/me` and `GET /settings/tgif`, 401, two red console lines; every sign-out, `t_signout2.py`), and a next account that opens Settings meanwhile joins that dead request: with the 401 held 20 s, B's Settings showed skeletons for 20 s and then "Your details did not load" and TGIF "Could not load" although B's token was good (B's own reads were never sent, `t_switch3.py`). Normal latency hides it. Root cause is the unguarded route (SHARED-CHANGES #3(b), recorded) plus observers that refetch after the cache is reset; the guard alone may not remove the refetch.
- **D3 defect (low, against the pass's own rule).** The phone is masked at render only. `fetchMe` keeps the whole `GET /users/me` answer under the query key `["settings","me"]`: the full number (all 14 characters, `+234` then ten digits; shown here only as ending 4412), email, handle, bio and the token claims `sub`, `iat`, `exp` (`t_dom.py`, read from the React Query cache). It is emptied at sign-out (verified), never written to storage.
- **D4 test gap (no product defect).** Mutant M12 survived: nothing in the 69 tests fails if the passwords also go in the URL. The real build was clean when scanned by hand.
- **unclear (owner).** The mask keeps the first four and last four digits (8 of 11 for a Nigerian number, `0803 ••• 4412`), exactly as Z2 draws it; the pass's wording says last four. Left as built.
- **differs-for-recorded-reason.** R-37 copy (Z2 About, Z3 From); Z2 Wallet and PIN and Delete account (later tasks); Password row opens the change-password screen (BRIEF Z2, built in A22's field style); routes unguarded and saved Theme not applied at launch (SHARED-CHANGES SETTINGS-01 #3); `SettingsFrame`, `Switch`, `SwitchRow` kept feature-local (SHARED-CHANGES #2; nothing in `src/components` on main does their job, `AboutFrame` and `EditFrame` are feature-local on main too, so VERIFIER check 2 finds no stand-in for a shared component).
- **Notes, no action asked.** Error lines show the server's own sentence verbatim, so a person can read "Unauthorized", "Internal server error" or "Validation failed (uuid v 4 is expected)" (the app-wide `sentenceOf` rule). If the secure store refuses the delete at sign-out, memory is already signed out, Settings stays up with "You could not be signed out", and the tokens stay stored: after a reload the person is signed in again while the stored access token lives (the refresh token was already ended by the server); simulated by making `localStorage.removeItem` throw (`t_signout4.py`). Terms and Privacy policy open and say "Not available yet" (SETTINGS-02's text, not this task).

### NOT RUN
- V10 on a phone (secure store, Android back, font scaling, safe areas, the saved Theme pinning the app through `Appearance.setColorScheme`): no device or emulator here. Unblocked by: an Android tester build or emulator pointed at a backend. On the web build `Appearance.setColorScheme` does nothing, so the Theme pick is evidenced by the row, the stored value and the jest spy only.
- The saved Theme applying on the next launch: `applyStoredTheme()` is not called at start. Unblocked by: SHARED-CHANGES SETTINGS-01 #3(a) in `src/app/_layout.tsx`.
- The data-export email arriving: WAWU ID has no route that sends it (G-131). Unblocked by: that wawu-id task.
- Sign out immediately after a silent token refresh (the flow reads the stored pair, not the in-memory one; if the store write were still pending the logout would end the stale refresh token): not provoked. Unblocked by: a build or test whose `saveTokens` is slow, then Sign out within that gap.
- A blocked person's direct message refused by the Hub: my `POST /dm/{id}/send` body did not match the contract, so the answer proved nothing. Unblocked by: the contract's body for that route.
- Sound playing anything (G-260), Reaching Settings from the Me menu (ME-03), Wallet and PIN (WALLET-06), Delete account (SETTINGS-05): other tasks.

Status: back to `building` with D1, D2, D3 open (all low; D1 is the one a person could see).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
