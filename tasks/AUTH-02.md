---
id: AUTH-02
title: Welcome and why you're here
owner: DEV
area: AUTH
order: 42
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [SHELL-01, UI-02, AUTH-01]
decisions: [R-6, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A1, A2]
---
# AUTH-02 · Welcome and why you're here

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A1 A2` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A1, A2, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A1 · Welcome**: Signed-out welcome: headline 'Get paid for what you know', subline 'Sell your work, answer paid questions, and bank it all in one app', buttons Create an account and Sign in. Also drawn as the auth 'Start here' map phone (hotspots 1 Create an account -> A2, 2 Sign in -> A22); Design note: the map phone equals the flow's own first screen, which the bundle rule normally forbids; here the app opens on A1.
- **A2 · Why you're here**: Account-type choice: 'I'm here to discover' (follow creators, buy their work, use the wallet) vs 'I want to earn' (sell content, take paid questions, host events. Free.). Continue.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A2: Continue (opens A3): added by AUTH-04

## Capability checks

- [ ] **A1**: a user can tap Create an account (-> A2); tap Sign in (-> A22).
- [ ] **A2**: a user can pick discover or earn.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From A22 (AUTH-01), a user can tap 'New here? Create an account' and reach A2 (this task adds the link, as A22 draws it).

## What the backend serves today (from the analysis)

- **A1**: n/a.
- **A2**: served. Missing: Account type is not part of WAWU ID registration; mobile must call WAWU ID register then Hub PATCH /users/me. Creator choice provisions a Flutterwave wallet (user-profile.service.ts:283); 'discover' accounts get no wallet today although the card says 'use the wallet'.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A1: 'bank it all in one app' (implies a bank account per user)
- A2: 'I want to earn ... Free.' (earning account costs nothing)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Builder session, 2 Oct 2026, branch `wmt/AUTH-02`, built on `origin/wmt/AUTH-01`, then merged `origin/main` 2ccaab7 (it now contains AUTH-01, so the branch is main plus this task). Pure UI: no API call, no backend change, no live or local server used. Not committed or pushed._

- **Files:** new `src/features/auth/WelcomeScreen.tsx` (A1), `AccountTypeScreen.tsx` (A2), `accountType.ts` (the pick, kept for AUTH-04); routes `src/app/welcome.tsx`, `src/app/account-type.tsx`; edited `SignInScreen.tsx` ('New here? Create an account' on A22), `src/app/sign-in.tsx`, `AuthFrame.tsx` (footer optional), `src/features/shell/LeaveDevRoute.tsx` (signed out goes to `/welcome`), `src/app/preview/auth.tsx` (harness), fenced `src/app/_layout.tsx` (SHARED-CHANGES AUTH-02 #1, applied). Tests: new `src/__tests__/auth-welcome.test.tsx` (16), `auth-sign-in` and `auth-guard` updated (cold start signed out now expects the welcome screen; A22 tests open `/sign-in`).
- **A1:** a user can tap Create an account (reaches A2) and Sign in (reaches A22, which now has Back, returning to A1). Cold start signed out lands on A1; signed in never sees A1 or A2 (by cold start or link). Tested through the real route graph; no request is made.
- **A2:** a user can pick discover or earn, one at a time, and change the pick; it is kept on Back and return. Tested. Continue (to A3) is added by AUTH-04 (the task's own section): the screen takes `onContinue`; the app route passes none, so no dead button is drawn. With it passed, Continue is disabled until a pick and hands the pick on (tested).
- **A22 link:** 'New here? Create an account' reaches A2 and Back returns to A22 (tested). A22 opened with nothing behind it still has no Back.
- **Revert proof (sha1-restored):** welcome out of the guard group (11 tests fail), link removed from sign-in (1), welcome button to wrong route (3), pick handler removed (3), A22 Back removed (2), Continue ungated (1), LeaveDevRoute target (2).
- **Pictures (verifier):** `npm run web`, then `/preview/auth?screen=welcome` (A1); `screen=account-type&pick=earn&continue=1` (A2 as drawn), `pick=discover`, no `pick` (nothing picked); `screen=sign-in&email=lennox@wawu.africa&password=password11` (A22 with the link). 390 px, light and dark by the browser's colour scheme.
- **Counts:** before (merged AUTH-01 base) 19 suites, 340 tests, gates 90 files 0 findings, 201 tasks. After: 20 suites, 356 tests (+16), gates 96 files 0 findings, 201 tasks, `npm run check` exit 0.
- **Defaults (agent), owner may override:** (1) A2 opens with nothing picked (the canvas shows earn picked as the after-tap state); earn is never preselected because it provisions a wallet. (2) 'Free.' on the earn card and 'and bank it all in one app' on A1 are left out (the task's own list of figures that are not facts); A1's line reads 'Sell your work and answer paid questions.' (G-34). (3) A2's title says 'Who Made This' where the canvas says WAWU (R-37 copy), so it wraps to two lines; A1's logo is `<BrandMark layout="horizontal">` (R-37, A1 is on its list). (4) A1's cover photo is a stand-in silhouette in the canvas: the app draws the brand colour under the canvas's dark shade ; the cover is dark in both themes, as drawn (G-35). (5) The A1 title wraps after 'you' where the canvas wraps before it: the canvas sets `text-wrap: pretty`, which React Native lacks; not forced. (6) `LeaveDevRoute` now sends a signed-out visitor to `/welcome`. (7) A22's Back shows whenever the router has a screen behind it.
- **Gaps:** G-34 (the two unbacked claims; the pick's server field is the Hub's `PATCH /users/me` `accountType: 'user' | 'creator'`, which AUTH-04 sends, and a `creator` save opens a wallet: see the row), G-35 (cover photo from the owner). Filed as G-33 and G-34, renumbered in fix round 1 after main took G-33. Shared change: SHARED-CHANGES AUTH-02 #1.
- **NOT RUN:** a real Android device or emulator (none here; unblocked by an Android build per docs/BUILDS.md): the status bar icons on A1 (set light in code) and the keyboard are checked on the web only. Live servers: none touched, none needed.

### Builder report (fix round 1)

- **Base:** uncommitted on 3b02632, then `origin/main` 176a56d merged (staged, not committed). Main took G-33 (MONEY-10), so this task's rows are now **G-34** (unbacked claims, the pick's Hub field) and **G-35** (cover photo); the Verifier report above still says G-33 and G-34. G-34 rewritten: the Hub takes `accountType: 'user' | 'creator'` on `PATCH /users/me` (operation `UserProfileController_upsertMe`, `UpdateUserProfileDto` in `src/api/schema.generated.ts`; it was line 3890 then), AUTH-04 maps discover to `user` and earn to `creator`; a `creator` save calls `provisionOnRegistration` (wawu-backend `src/user-profile/user-profile.service.ts` line 283, read this round), against R-6. Default (agent): AUTH-04 must not send `creator` until it knows the wallet side effect is intended or removed.
- **D1 fixed:** `WelcomeScreen` renders its light `StatusBar` only while `useIsFocused()` (expo-router export) is true, so its entry leaves React Native's StatusBar props stack when A2 or A22 is pushed over it (the root layout's theme entry then wins: `mergePropsStack`, last mounted wins) and comes back on Back. Tests read the merged `StatusBar._currentValues.barStyle`: A1 -> A2 and A1 -> A22, light and dark, each Back to A1 (4 tests). Revert (always light): 2 fail (light theme; in dark the default is light too).
- **D2 fixed:** A2 passes `contentTop={TITLE.top}` (10, auth.js line 10 `pt: 10`, replacing the kit default 8, kit.js line 35) and the title has no padding of its own. Measured on web 390x844 below the bar: A2 title top 66 (canvas 56 + 10), cards at 145.8 and 249.0; A22 title 74 (56 + 8 + 10, unchanged); A1 unchanged. Test on the constant; revert: 1 fails.
- **D3:** every file-and-line citation I added re-read against the source: `choice` is auth.js line 9 (two fixed); added kit.js line 15 (`Btn` 54 high) and line 35 (`body` default 8); auth.js 8 and 10, kit.js 38 and 60 and service line 283 checked correct.
- **D4:** the test is now 'a user who signs out is taken to the welcome screen'.
- **U3:** `clearAccountType()` runs when A1 mounts (each signed-out visit: cold start and after every sign-out) and after a sign-in on A22 succeeds; Back and return within a visit keeps the pick. Default (agent), owner may override: the pick lives in memory only and is lost on a reload or when Android ends the app; it holds no secret. Tests: sign-in forgets it; a session started another way keeps it until sign-out, after which A2 opens with nothing picked. Reverts: each clear removed, 1 fails each.
- **U4:** Space and Enter pick a focused card (`pickByKey`, react-native-web's `onKeyDown`; its Pressable presses on Space only for button roles). Tests for both keys and for another key; revert: 2 fail.
- **Counts:** before this round 20 suites, 356 tests; after (main 176a56d merged) `npm run check` exit 0, lint 0 warnings: 20 suites, 371 tests (auth-welcome 16 to 26, the rest from main), gates 96 files 0 findings, 202 tasks. Pictures: scratchpad `shots-r1/` (A1, A2 none/discover/earn, A22, light and dark), measurements `measure_r1.json`. **Left as recorded:** U1 (G-35), U2, U5 and defaults 1 to 7.
- **NOT RUN:** the status bar (D1) and the A22 keyboard (U5) on an Android device or emulator, unblocked by an Android build per docs/BUILDS.md; sign-out in a browser (no control yet, unblocked by the task that adds one).

### Builder report (fix round 2)

- **D5:** G-34 now names the operation and schema (`UserProfileController_upsertMe`, `UpdateUserProfileDto`) instead of a line that drifts (it had moved from 3890 to 4022); the fix-round-1 report says the same. The `pickByKey` comment now says react-native-web presses on Space only for a `<button>` element or role `button` (`isValidKeyPress` in `node_modules/react-native-web/dist/modules/usePressEvents/PressResponder.js`). Every other citation re-checked against the current files: auth.js lines 8, 9, 10 and 21; kit.js lines 15, 35, 38 and 60; `user-profile.service.ts` line 283 on wawu-backend origin/main. All are correct.
- **U7 (recorded in G-34, no code):** read on wawu-backend origin/main. `upsertMe` provisions a wallet on every later save by a `creator` (line 282), and `GET /wallet` opens one for a creator that has none (`wallet.service.ts` line 144), so AUTH-04's default only defers it. `GET /wallet` answers 400 to any account type other than `creator` (lines 136 to 142), so an earner saved as `user` cannot reach that wallet. AUTH-04 and MONEY-12 must settle this.
- **Checks:** `npm run check` exits 0 with lint at 0 warnings: 20 suites, 371 tests, gates 96 files and 0 findings, 202 tasks. Main had not moved (176a56d). No behaviour changed (one comment only).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

_Verifier session, 2 Oct 2026, branch `wmt/AUTH-02` at 7a1f9e0 (origin/main d562bff merged), checked as it lands (`git diff origin/main...HEAD`). Android only; iOS not applicable. I wrote none of the code and changed none: every revert below was a one-line edit restored by copying the saved file back (sha1 before and after identical, `git status` clean after each). No live server was touched: the app ran with both API addresses pointed at 127.0.0.1 (a dead port, then a local stub that answers only POST /auth/login), and every page load was recorded. Evidence folder: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-02-v1/` (called EV below). Nothing was committed._

### Passes

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Build and tests | **passed with findings** (D3, D4). `npm run check` exit 0: typecheck clean, lint clean (no warnings printed), 20 suites / 356 tests pass, gates 96 files scanned, 0 findings, baseline 0, 201 tasks. Counts equal the builder's. File list equals `git diff --stat` (19 files; the docs/LOG, PROGRESS, BACKEND_GAPS, SHARED-CHANGES, task file are the builder's listed docs). No em-dash, TODO-type comment, hex or rgba literal, raw wawu asset or hand-written API type in the new or edited screen files. Logo only through `<BrandMark layout="horizontal" surface="dark">`; icons only through `@/components/icon` (IconTile, Button, AuthFrame). 7 reverts all caught (below). | EV`check.txt`, EV`reverts.txt` |
| V4 Field trace | **passed with findings** (U3, U4) | below |
| V5 Picture | **failed** (D1, D2; U1, U2 for the cover and wraps) | EV`design/` (canvas renders), EV`shots/`, EV`measure.json` |
| V6 States | **passed** for the states that exist; loading, empty and error do not exist in this task (no API call: confirmed, see V7). Android keyboard NOT RUN. | EV`shots/p-type-*.png`, EV`flow.log` |
| V7 Flow walk | **passed** (web), with D1 on Android, U3 and U5 | EV`flow.log`, EV`shots/requests.json`, EV`stub-requests.log`, production export output below |
| V9 Live seam | **NOT RUN**: the task makes no API call, so there is no seam to sign in through. Unblocked by: AUTH-04, the first task of this flow that calls a server. (AUTH-01 owns the sign-in seam; here a local stub answered one POST /auth/login only to test back-navigation, which is not a V9.) | |

Capability checks, each run by me:

| Check | Result |
|-------|--------|
| A1: a user can tap Create an account (reaches A2); tap Sign in (reaches A22) | **passed** on web through the real routes (/welcome -> /account-type; /welcome -> /sign-in with Back to /welcome) and in the jest route graph; Android NOT RUN |
| A2: a user can pick discover or earn | **passed**: one at a time, change allowed, `aria-checked` flips, the pick survives Back and return. Continue is not drawn on the real route (AUTH-04 adds it, per this task's own "Added by later tasks"); with `onContinue` given it is disabled until a pick (preview `continue=1`, tested) |
| Each artboard matches its render, light and dark (V5) | **failed**: D1, D2, and the open items U1, U2 |
| Every value on screen comes from the API or the user, never a literal | **passed**: all text is design copy; the two unbacked claims are left out and filed (G-33); no fee, price, limit or licence line appears |
| Loading, empty and error states exist and are entered by their real cause | **NOT APPLICABLE, honestly**: there is no data to load, nothing empty and nothing to fail; confirmed by recording every request: zero requests on /welcome, /account-type, /sign-in, the previews and a 6-step walk signed out |
| From A22, a user can tap 'New here? Create an account' and reach A2 | **passed**: web (/sign-in -> /account-type, Back returns to /sign-in) and the jest test; Android NOT RUN |

### V1 reverts reproduced (jest: auth-welcome, auth-guard, auth-sign-in; sha1 restored each time)
| Edit | Tests failing |
|------|---------------|
| remove `<Stack.Screen name="welcome" />` from the signed-out group (`src/app/_layout.tsx`) | 11 |
| A22 link `onPress` made a no-op (`SignInScreen.tsx`) | 1 |
| A22 Back removed (`sign-in.tsx` `onBack={undefined}`) | 2 |
| pick handler made a no-op (`AccountTypeScreen.tsx`) | 3 |
| Continue ungated (`disabled={false}`) | 1 |
| `LeaveDevRoute` target `/welcome` -> `/sign-in` | 2 |
| welcome's Create an account sent to `/sign-in` | 3 |

Kit constants spot-checked against `design/_gen/auth.js` and `kit.js` (17, all equal): words side 24, gap 14, title 34 / -0.04em / 1.05, line 15 / 80% / 1.45, logo 130 (auth.js 8); buttons gap 10 and 180 minus 118 minus 34 = 28 (auth.js 8, kit.js 38); shade 20% / 35% at 40% / solid at 78% (auth.js 8); A2 title 26 / -0.03em / 1.15, 20 below, cards 10 apart (auth.js 10); card padding 16, gap 14, icon 48, radio 22, title 16, line 13 / 1.4, 3 under (auth.js 9); radio ring 6.5 / 1.5 (kit.js 60); card edge 1.5 / 1 (auth.js 9). Citation errors: D3.

### V5 compared element by element (390 px, light and dark, canvas renders vs real routes and /preview/auth)
- **A1 (/welcome, preview welcome)**: light and dark are identical, as the canvas's two renders are (verified). Logo: R-37 mark at 130 wide, left 24 (canvas 24); title 34 px bold, -1.36 px tracking, line 35.7, white; line under it 15 px at 80%, left 24; buttons 350 x 54, 10 apart, 20 sides, pill radius, primary and glass fills match the canvas's. Words end 28 above the buttons (measured 28). Differences: the cover (U1), the title wrap (U2), the bottom gap (web has no inset: 16 below the buttons where the canvas has 34; on Android it follows the real inset, NOT RUN), and no drawn clock or battery (the canvas's 9:41 row is a mock).
- **A2 (preview account-type pick=earn, discover, none; /account-type)**: card edge, tint, radius 22, padding 16, 48 px icon tile (22 px glyph), radio ring and the dark-mode tints all match the canvas; selected card shows the accent ring, tinted fill and filled radio; unselected shows the hairline and an empty radio; Continue disabled draws the kit's sunken disabled button. Copy matches minus "Free." and with the app name (R-37). Differences: D2 (everything under the nav sits 8 px lower than the canvas), the title takes two lines (U2), cards are 93.2 px tall against about 91.5 in the canvas (the card title line-height is the Text variant's 21.75, the canvas inherits the browser's normal; under 2 px, not a finding).
- **A22 (preview sign-in, /sign-in)**: same as AUTH-01's, plus the link row under the Sign in button; the link reads "New here?" muted and "Create an account" bold accent, centred, as the canvas draws it. Sign in button now 746 to 800 with the link at 810 (canvas order equal).
- **Contrast** (measured from the screenshots): A1 white title on the shade 18.8 and 19.4 : 1, logo 17.1, the 80% line 12.6, Sign in label on glass 13.9, top of the cover under the status bar area 8.8, in both themes; A2 secondary text 6.5 : 1 (light) and 8.2 : 1 (dark) on the page colour (on the tinted picked card slightly lower, still above 4.5). All pass 4.5.

### V7 flow walk (web build, run by me)
- Signed-out cold start `/`: blank (splash) then `/welcome`; no flash of Home, sign in or another screen (timeline recorded). Production export (`expo export --platform web` to the scratchpad, served statically): signed out, `/`, `/welcome`, `/account-type` open as they should and `/preview/auth`, `/dev/components` leave to `/welcome`; signed in, all six, `/welcome`, `/account-type`, `/preview/auth` and `/dev/components` included, land on Home; never blank, never a page error, zero outside requests.
- Create an account -> A2 (Back present); pick earn, then discover: one at a time; Back -> A1; Create again -> pick kept. A1 Sign in -> A22 with Back, Back -> A1. A22 opened directly: no Back; its 'New here? Create an account' -> A2; Back -> A22. A2 opened directly: no Back.
- Signed in (stored tokens): `/`, `/welcome`, `/account-type`, `/sign-in` all land on Home (dev server); link to `/welcome` from Home, back, forward, reload: stays on Home.
- Signing in through the stub from A1 -> A22 -> Home, then browser Back (three times): about:blank, never a signed-out screen (the guard replaces the history); forward returns to Home.
- Sign-out: no sign-out control exists in the app yet, so it is covered by the jest test only (it now lands on A1). NOT RUN in a browser or on a device. Unblocked by: the Me/Settings task that adds the control.
- The pick: a module-level variable in `src/features/auth/accountType.ts` (memory only). Kept across Back and return; lost on reload or when Android ends the app (A2 opens with nothing picked after a reload); never cleared at sign-out (U3). No network request is made by any of this (all requests recorded; the only one to the stub was the login I sent).

### V4 field trace
- The pick: writer A2 (`useAccountType`), reader `pickedAccountType()` for AUTH-04. G-33's statement is accurate and the builder report's wording ("no server field") is loose: the Hub has the field. `PATCH /api/hub/users/me` (operation `UserProfileController_upsertMe`) takes `UpdateUserProfileDto.accountType: 'user' | 'creator' | null` (`src/api/schema.generated.ts` line 3890; the same enum is returned on the profile). WAWU ID's register has no such field, so sending it after register is right. The app's `'discover' | 'earn'` must map to `'user' | 'creator'` in AUTH-04. Not an AUTH-02 defect, but AUTH-04 must know: a `creator` save provisions a wallet (`wawu-backend` `src/user-profile/user-profile.service.ts` lines 281 to 283, on the Flutterwave rail) which R-6 says nobody has until they open one; G-33 names the line, the ruling is AUTH-04's and the owner's.
- Every string: "Get paid for what you know" (A1 design copy, kept), "Sell your work and answer paid questions." (A1 design words, minus the unbacked clause), "Create an account", "Sign in", "What brings you to Who Made This?" (A2 design copy with the app name, R-37), "I'm here to discover / Follow creators, buy their work, use the wallet.", "I want to earn / Sell content, take paid questions, host events." (A2 design copy minus "Free."), "New here? Create an account" (A22 design copy), "Continue" (design). Nothing invents a fee, price, limit or licence line; "Flutterwave" and WAWU do not appear. "use the wallet" is consistent with R-6 (anyone may open one).

### Findings

**Defects (open, fix before merge)**
- **D1 (medium, Android, not confirmed on a device)**: the welcome screen's `<StatusBar style="light" />` stays active on A2 and A22 reached from it. React Native keeps a stack of status bar entries and the last one mounted wins (`node_modules/react-native/Libraries/Components/StatusBar/StatusBar.js`, `mergePropsStack`; expo-status-bar's own doc says "merged in the order that they were mounted"); a pushed screen leaves the one below mounted (I measured: `[data-testid=welcome]` is still in the DOM after Create an account). The root layout's entry is older, so on A2 and A22 in the light theme the Android clock and battery icons stay white on the light page. The entry only pops when the welcome screen unmounts (after sign-in). Fix direction: set the style only while A1 is focused (`useIsFocused`, or `useFocusEffect` with `StatusBar.setStyle` restored on blur). Check on an Android build.
- **D2 (low)**: A2's title and cards sit 8 px lower than the canvas. `TITLE.top` (10) is added on top of AuthFrame's own 8 px content padding, where the canvas's A2 body is a single 10 (`body(..., { pt: 10 })`, auth.js 10); measured title text top 74 where the canvas gives 66. A22's 8 + 10 is the canvas's own (auth.js 21), so only A2 is off.
- **D3 (low, documentation)**: `AccountTypeScreen.tsx` cites "design/_gen/auth.js line 12" twice (the `choice` card constants and the picked-edge constant); the `choice` helper is on line 9 (line 12 is `identity`). The values are right, the citation is not.
- **D4 (trivial)**: the test `a user who signs out is taken to sign in` (`src/__tests__/auth-sign-in.test.tsx`) now asserts the welcome screen; its name is stale.

**Differs for a recorded reason (accepted)**
- Builder default (1), A2 opens with nothing picked: the canvas draws the after-tap state (earn picked, Continue enabled). Starting with earn picked would preselect a creator account, which provisions a wallet (G-33, R-6), so a user must choose; I reproduced the canvas state with `pick=earn`. Recorded in this task's builder report as a default.
- Builder default (2), copy: the task's own list ("Figures on these artboards are not facts") names exactly "bank it all in one app" and "Free."; CLAUDE.md rule 7 says leave out and file; filed as G-33. The changed A1 line only drops that clause and joins with "and": no word is added, so nothing is invented. docs/designer/BRIEF.md has no entry for A1 or A2 (the task says so; I searched it), so no brief line is broken.
- Builder default (3), the name and the logo: R-37 (copy "where WAWU names this app" becomes Who Made This; the canvas `wawu-logo-white` becomes `<BrandMark layout="horizontal">`; A1 is on the list, `surface` dark because it sits on the photo). Correct and as sized (130).
- Builder default (4), cover: dark in both themes as the canvas is (its light and dark renders are identical, verified). The canvas picture is itself a stand-in and a mock image must not ship; recorded as G-34. See U1 for what it looks like.
- Builder default (6), `LeaveDevRoute` to `/welcome`: SHARED-CHANGES AUTH-02 #1; verified in the production export (signed out: `/preview/auth` and `/dev/components` land on `/welcome`, signed in on Home, never blank). The `_layout.tsx` edit is the one AUTH-01 #1 told AUTH-02 to make (welcome first in the signed-out group): only two lines are added to the guard group, every other route's protection is unchanged, and removing the `welcome` line fails 11 tests, so it is needed.
- Builder default (7), A22 Back whenever something is behind it: verified, absent when opened directly.
- Real A2 draws no Continue until AUTH-04: "Added by later tasks" in this task. Until then a user can pick but cannot proceed (A1 -> A2 is a dead end on purpose; pre-launch).

**Unclear (needs the owner or an Android build)**
- **U1 (cover)**: the real A1 is a flat purple gradient (brand colour under the canvas's shade) where the canvas shows a green photograph-style cover with a circle; it reads as an empty top half. Fine only if the owner accepts a colour cover until a photograph exists (G-34).
- **U2 (wraps, low)**: A1's title wraps "Get paid for what you / know" (a one-word second line) where the canvas wraps "what / you know"; A2's title breaks the app name ("Who Made / This?"). The builder's reason (no `text-wrap: pretty` in React Native) is true; Android's `textBreakStrategy="balanced"` or a non-breaking space inside the name may give the canvas wrap, to be judged on a device because web wraps differently.
- **U3 (the pick's life)**: it is memory only, lost on reload or process death, and never cleared at sign-out (A2 would open pre-picked for the next visitor in the same process). AUTH-04 must decide whether it stores the pick (sign-up spans an email or phone code step, where Android can end the app) and clear it at sign-out.
- **U4 (web-only a11y, low)**: on web a focused card is picked by Enter but not by Space (react-native-web's Pressable ignores Space for role radio) and arrow keys do not move between the radios. Android TalkBack uses the double tap, so no effect on the product; noted for any later web build.
- **U5 (A22 with the keyboard)**: the link made A22's footer taller (button plus link); the keyboard cannot be opened in a desktop browser, so whether the footer and fields still fit above an Android keyboard is NOT RUN (jest focus tests still pass).

Accessibility: heading level 1 on A1 and A2; the logo is an image named "Who Made This"; the two cards are a labelled radio group (`radiogroup` "What brings you here", `radio` with the title and line, `checked` state announced); the focus ring is a keyboard-only 2 px page plus 3.5 px accent ring with the browser outline off (a mouse click shows none); focus order is Back, discover, earn, Continue.

### NOT RUN
- A real Android device or emulator: status bar icons (D1), safe areas and the bottom gap under the A1 buttons (web shows 16, the canvas 34), the keyboard on A22 (U5), TalkBack announcements, text wrap (U2), hardware Back. Unblocked by: an Android build from docs/BUILDS.md.
- Sign-out in a browser or device: unblocked by the task that adds a sign-out control (jest covers it).
- V9: no API in this task (see the table).

**Status:** `building`, because D1 and D2 are open. D3 and D4 are small enough to ride with the fix. The branch should not merge until D1 is fixed and seen on an Android build or the owner accepts it.


## Verifier report (round 2)

_Verifier session (round 2), 3 Oct 2026, branch `wmt/AUTH-02` at fa746f4 (origin/main 176a56d merged, current), checked as it lands (`git diff origin/main...HEAD`, 19 files). I wrote none of the code, did not verify round 1, and changed no code: every revert below was a one-line edit restored by copying the saved file back (sha1 before and after identical, `git status` clean after the run); one temporary extra jest file was run and deleted (kept as evidence). No live server was touched: the dev server and the production export ran with both API addresses on 127.0.0.1 (a local stub that answers only POST /auth/login); every page request was recorded; all servers stopped afterwards. Android only; iOS not applicable. Evidence folder: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-02-v2/` (EV2 below). Nothing committed. Note: the round-1 report above says G-33 (unbacked claims) and G-34 (cover); after main took G-33 these rows are **G-34** and **G-35** (BACKEND_GAPS has no duplicate number; every code comment cites G-34 and G-35 correctly)._

### Passes

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Build and tests | **passed with one finding** (D5). `npm run check` exit 0: typecheck clean, lint prints no warning, 20 suites / 371 tests pass, gates 9 run, 96 files scanned, 0 findings, 202 tasks. Equal to the builder's counts. `git diff --stat origin/main...HEAD` lists the 19 files the two builder reports name, nothing extra or missing. No em-dash anywhere in the diff, no TODO-type comment, no hex/rgb literal, no "Flutterwave" or WAWU logo in app code; logo only through `<BrandMark>`, icons only through `@/components/icon` (IconTile, Button). Merge sound: no conflict markers, BACKEND_GAPS G-32..G-35 unique (main has G-33). 9 reverts all caught (below). | EV2`check.txt`, EV2`reverts.txt` |
| V4 Field trace | **passed**; G-34 checked against the backend (below) | below |
| V5 Picture | **passed** for D1 and D2 as far as the web can show; D1 on a device NOT RUN. Remaining differences are recorded ones (R-37 name and logo, G-34 copy, G-35 cover, U2 wraps, web bottom inset). | EV2`design/`, EV2`shots/cmp-*.png`, EV2`canvas_measure.json`, EV2`app_measure.json` |
| V6 States | **passed** (no API call, so no loading/empty/error: zero outside requests recorded on every screen). Android keyboard NOT RUN. | EV2`app_measure.json` (`external_requests: []`), EV2`flow_v2.log` |
| V7 Flow walk | **passed** on web (dev and production export); Android NOT RUN | EV2`flow_v2.log`, EV2`prod.log` |
| V9 Live seam | **NOT RUN**: this task makes no API call. Unblocked by AUTH-04, the first task in this flow that calls a server. | |

Capability checks, each run by me: A1 Create an account reaches A2 and Sign in reaches A22 (with Back to A1): **passed** (web, jest). A2 pick discover or earn, one at a time, changeable: **passed**. A22 'New here? Create an account' reaches A2, Back returns to A22: **passed**. Values from the API or the user: **passed** (design copy only; the two unbacked claims left out, G-34). States: no data, none needed (above). Picture: see V5. Android: NOT RUN.

### D1 (status bar), re-checked
- Read `node_modules/react-native/Libraries/Components/StatusBar/StatusBar.js` (RN 0.86.3): each mounted StatusBar pushes an entry on `componentDidMount`, pops it on `componentWillUnmount`, `componentDidUpdate` replaces it at the same index (so a theme change on the root entry never reorders it); `_updatePropsStack` merges in mount order (`mergePropsStack`, last wins) and on Android calls `setStyle` every time. `expo-status-bar` 57.0.1 is a thin wrapper over it (web export is a no-op, so the web cannot show a bar). `useIsFocused` from expo-router 57.0.24 is react-navigation's (`IsFocusedContext` / focus and blur events).
- So rendering A1's `<StatusBar style="light" />` only while focused removes its entry as soon as A2 or A22 is pushed and puts it back (on top) when A1 is focused again. Confirmed by running, in a temporary jest file (EV2`extra-tests.tsx`, `extra-tests.log`, 5 passed), in light and dark: deep link straight to `/sign-in` and on to A2 (A1 never mounted): theme default, one entry; A1 light (two entries) -> A22 -> A2 by the link: theme default, one entry -> Back -> Back to A1: light; sign in: Home has the theme default, one entry; sign out: A1 light again. The builder's 4 tests pass; the always-light revert fails 2 of them (light theme; in dark the default is light too).
- App resume: nothing in JS changes on resume (focus and the stack are kept), so the right entry stays on top; whether Android restores the bar after an activity re-creation is a device question, NOT RUN. The bar flips when navigation state changes, which is at the start of the push or pop animation, so for that animation the bar may already show the next screen's style over the outgoing one (U6).

### D2 (A2 offset), re-measured
Canvas DOM measured inside each phone (render_design's server, EV2`canvas_measure.json`), app at 390x844 light and dark (EV2`app_measure.json`). The canvas phone has a 50 px status row the web has not; numbers below are canvas minus 50.
- **A2** (preview none, discover, earn; real route): title top 66 = canvas 66 (fixed). First card 145.8 = canvas 115.9 + the title's second line 29.9 (R-37 name, U2). Second card 249.0 against 248.2 (card 93.2 high against 92.4: the title line is 21.75 against the browser's normal 21; under 1 px, not a finding). Cards 10 apart, 350 wide, 20 in, icon tile at the canvas's place; picked/unpicked edge, tint and radio match in both themes (opened every image). Continue 54 high, 20 in; it sits 16 above the bottom on web where the canvas has 34 of home bar (the real inset decides on Android, NOT RUN).
- **A1**: words 24 in, title 34 / line 35.7 / -1.36 tracking, line under it 15 / 21.75; words end 27.9 above the buttons (canvas 28); buttons 350x54, 10 apart. The whole block sits 18 lower than the canvas (16 against 34 bottom gap, as above) and the line under the title is one line (the G-34 clause is out). Light and dark identical, as in the canvas.
- **A22**: title 74 = canvas 74; button to link 10 = canvas 10; link 14 px, "Create an account" bold accent, centred, as drawn.
- Contrast unchanged from round 1 (same colours).

### D3 citations, every one in the changed files
`auth.js` line 8 (landing: 24 side, gap 14, 34/-0.04em/1.05, 15/.8/1.45, logo 130, 180 bottom, shade .2/.35 at 40%/solid 78%), line 9 (`choice`: 14, 16, 48, 16/13, 1.4, 3, edges 1.5 accent / 1 hairline), line 10 (A2: 26 px, `pt: 10`, gap 20, cards 10); `kit.js` line 15 (`Btn` lg 54), line 35 (`body` default `pt` 8), line 38 (`foot` 34 bottom, gap 10), line 60 (`radio` 6.5 / 1.5): all correct. wawu-backend `src/user-profile/user-profile.service.ts` line 283 (`provisionOnRegistration`) at origin/main e8535d8: correct. **Wrong:** `src/api/schema.generated.ts` line 3890 (D5). D4 (test name) fixed.

### U3 (the pick's life), tried to break it
Web (EV2`flow_v2.log`): A1 -> A2 pick earn -> Back -> Create: kept. A1 -> Sign in -> A22 -> 'Create an account' -> a second A2: earn shown (kept, sensible: same visit) -> change to discover -> Back (A22) -> Back (A1) -> Create: discover kept. Reload on A2: nothing picked, no Back (recorded default). Jest (temporary file): pick via the A22 link, Back to A22, a failed sign-in keeps it (sensible: same person retrying), a successful one clears it. The builder's tests: sign-in clears; session started another way keeps the pick until sign-out, after which A1 remounts and A2 opens empty. Both clears reverted: 1 test fails each. The pick never leaves memory and no request carries it.

### U4 (keyboard on web)
On `/account-type`: Tab goes discover then earn (no Back when opened directly); Space on a focused card picks it with no page scroll and **no native click fired** (counted: 0), so no double trigger; Enter picks; "a" and ArrowDown pick nothing (arrow keys do not move between radios, round-1 note stands, web only). The ring (2 px page plus 3.5 px accent) shows on keyboard focus only, browser outline none; a mouse click shows the card's own picked edge only. `radiogroup` "What brings you here" with 2 `radio`, `aria-checked` flips. Reverts: Space removed fails 1, the key handler removed fails 2.

### V7 regression (web)
Cold start signed out `/` -> `/welcome`, no outside request, no page error. Signed in (stored tokens): `/`, `/welcome`, `/account-type`, `/sign-in` all land on Home. Sign in through the stub from A1 -> A22 -> Home (the only request: POST /auth/login). Production export (`expo export --platform web`, served statically): signed out `/welcome`, `/account-type` open, `/preview/auth`, `/preview/auth?screen=welcome`, `/dev/components`, `/` land on `/welcome`; signed in all six land on Home; never blank, zero outside requests. AUTH-01's sign-in and guard suites pass, A22 layout unchanged apart from the link (title 74, fields and Forgot password where they were).

### Reverts (jest auth-welcome, auth-guard, auth-sign-in: 77 tests; sha1 restored each time)
| Edit | Failing |
|------|---------|
| D1: A1's StatusBar always rendered | 2 |
| U3: welcome no longer clears on mount | 1 |
| U3: sign-in no longer clears after success | 1 |
| U4: Space removed from `pickByKey` | 1 |
| U4: key handler not spread on the card | 2 |
| D2: `contentTop={TITLE.top}` removed | 1 |
| A22 link (`onCreateAccount`) removed | 1 |
| `welcome` removed from the signed-out guard group | 17 |
| pick setter made a no-op | 7 |

### G-34 against the backend (V4)
- `PATCH /users/me` takes `UpdateUserProfileDto.accountType?: 'user' | 'creator' | null` (now `src/api/schema.generated.ts` line **4022**, not 3890). In wawu-backend origin/main, `upsertMe` writes it (null ignored on update, `user` on create) and then, `if (saved.accountType === AccountType.creator)`, calls `this.wallet.provisionOnRegistration(claims)` (line 283), which opens a Flutterwave creator wallet and never throws; `getWallet` also opens one on read for a creator, and refuses a non-creator ("A wallet comes with a creator or professional account..."). So the row is accurate: a `creator` save opens a wallet, against R-6, on the Flutterwave rail rather than Fintava (R-1).
- The recorded default (AUTH-04 must not send `creator` until the side effect is intended or removed) is safe for AUTH-02, which sends nothing. For AUTH-04 it is only a deferral: the side effect fires on every later profile save of a creator (not only the save that sets the type) and on GET /wallet, and an earner kept as `user` cannot reach the creator wallet path at all. See U7.

### Findings

**Defects (open)**
- **D5 (low, documentation)**: the line citation `src/api/schema.generated.ts` line 3890 for `accountType` on `PATCH /users/me` is stale after the merge of main: the field is now on line 4022 (line 3890 is in an unrelated DTO). It is in BACKEND_GAPS G-34 (a changed file on this branch, so it lands wrong) and in the fix-round builder report, which says it was checked. Same in kind as round 1's D3. In the same family, `AccountTypeScreen.tsx`'s comment says react-native-web's Pressable presses on Space "only for a button or menu item"; `isValidKeyPress` checks only a `button` tag or the `button` role. Fix: cite line 4022 (or the DTO name `UpdateUserProfileDto` instead of a line) and drop "or menu item".

**Fixed and verified**: D1 (web and jest; device NOT RUN), D2, D3, D4, U3, U4, and the G-34 wording.

**Differs for a recorded reason (accepted, as round 1)**: the app name in A2's title and BrandMark on A1 (R-37); "Free." and "and bank it all in one app" left out (G-34, the task's own list, rule 7); A2 opens with nothing picked (builder default 1); cover colour (G-35); `LeaveDevRoute` to `/welcome` (SHARED-CHANGES AUTH-02 #1); A22 Back only with something behind it; no Continue on the real A2 until AUTH-04 ("Added by later tasks"); the pick held in memory only (fix-round default).

**Unclear**
- U1, U2, U5 stand as in round 1 (cover, title wraps, A22 with the Android keyboard).
- **U6 (low, Android)**: the bar changes at the start of the push/pop animation, not at its end, so during the transition the outgoing screen may briefly carry the incoming screen's icon colour (for example dark icons over A1's dark cover while it slides away). Judge on an Android build.
- **U7 (AUTH-04)**: G-34's default avoids the wallet side effect only until a creator's next profile save or wallet read; AUTH-04 needs the ruling (keep, move to "Open your wallet", or remove `provisionOnRegistration`) before an earner can be saved as `creator`.

### NOT RUN
- Android device or emulator: the status bar on A1/A2/A22 including resume and transitions (D1, U6), safe areas and the bottom gaps, the A22 keyboard (U5), TalkBack, wraps (U2), hardware Back. Unblocked by an Android build per docs/BUILDS.md.
- Sign-out in a browser or on a device: no sign-out control yet (jest covers it). Unblocked by the task that adds the control.
- V9: no API call in this task. Unblocked by AUTH-04.

**Status:** `building`, because D5 is open (a one-line documentation fix). Everything else from round 1 is fixed and verified on web and in jest; the branch is otherwise ready, and D1 still needs to be seen on an Android build.


## Verifier report (round 3)

_Verifier session (round 3), 3 Oct 2026, branch `wmt/AUTH-02` at c6b84e2 (origin/main 176a56d, current). I wrote none of the code and did not verify earlier rounds; I changed no code and ran no revert (the change under review is documentation and one comment). Backend read at wawu-backend origin/main e8535d8 with `git show` (that clone's branch not switched). Check output: scratchpad `auth02-v3-check.txt`. Nothing committed._

| Check | Result | Evidence |
|-------|--------|----------|
| Scope of `git diff fa746f4..HEAD` | **passed**: 3 files, BACKEND_GAPS.md (G-34 only), `src/features/auth/AccountTypeScreen.tsx` (the `pickByKey` comment only), tasks/AUTH-02.md. Nothing else. No em-dash added. | `git diff --stat` |
| No regression | **passed**: the diff of `src/` with comment lines and whitespace removed is empty. | `git diff -w fa746f4..HEAD -- src/` filtered |
| G-34 against the schema | **passed**: `/api/hub/users/me` `patch` is `UserProfileController_upsertMe`, its body `UpdateUserProfileDto`, which has `accountType?: "user" \| "creator" \| null` (the null is in the round-2 report; the row's `'user' \| 'creator'` names the values AUTH-04 sends). No line number left to drift. | `src/api/schema.generated.ts` |
| G-34 against the backend | **passed**: `user-profile.service.ts` line 282 `if (saved.accountType === AccountType.creator)`, line 283 `provisionOnRegistration(claims)`, at the end of `upsertMe` (line 171) after any save, whatever field changed. `wallet.service.ts` `getWallet` (route `GET /wallet`, `wallet.controller.ts`): lines 136 to 142 throw `BadRequestException` (400) when the account type is not `creator`; line 144 `openForAccount(claims)` for a creator without a wallet. `provisionOnRegistration` calls `openForAccount` and catches failures; the wallet reads `this.flw` (Flutterwave). | `git show origin/main:src/...` |
| MONEY-12 and AUTH-04 named | **passed**: `tasks/MONEY-12.md` title "Open a Fintava account when someone opens a wallet", as G-34 describes it; `tasks/AUTH-04.md` exists. | tasks/ |
| The comment against react-native-web | **passed**: `isValidKeyPress` (PressResponder.js line 66) returns `key === 'Enter' \|\| isSpacebar && isButtonish`, `isButtonish` = element type `button` or role `button`; the comment says exactly that. | `node_modules/react-native-web/dist/modules/usePressEvents/PressResponder.js` lines 63 to 72 |
| Design citations | **passed**: auth.js 8 (landing), 9 (`choice`), 10 (A2 `type`, `pt: 10`), 21 (`signIn`); kit.js 15 (`Btn`, lg 54), 35 (`body`, `pt ?? 8`), 38 (`foot`, 34 bottom, gap 10), 60 (`radio`, 6.5 / 1.5): each is the line named. | `design/_gen/` |
| `npm run check` | **passed**: exit 0; typecheck clean; lint prints no warning; 20 suites, 371 tests; gates 9 run, 96 files, 0 findings; 202 tasks. Equal to the builder's counts. | scratchpad `auth02-v3-check.txt` |

### Findings
- **Defects:** none. D5 fixed and verified. U7 is now recorded in G-34 with AUTH-04 and MONEY-12 named, and every claim in it matches the backend.
- **Differs for a recorded reason:** as in round 2 (R-37 name and logo, G-34 copy left out, G-35 cover, builder defaults).
- **Unclear:** U1, U2, U5, U6 stand as in round 2 (Android build needed). U7 is the owner's and AUTH-04's / MONEY-12's to settle, not AUTH-02's.

### NOT RUN
- Everything on an Android device or emulator (D1 status bar, U6, U5 keyboard, safe areas, TalkBack, U2 wraps, hardware Back), unblocked by an Android build per docs/BUILDS.md. Sign-out in a browser, unblocked by the task that adds the control. V9, no API call in this task (AUTH-04).
- Not re-run this round: the picture comparison, flow walk and reverts (no behaviour changed since round 2, which ran them).

**Status:** `review`. No open defect. D1 still wants a look on an Android build before merge, as round 2 said.


## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
