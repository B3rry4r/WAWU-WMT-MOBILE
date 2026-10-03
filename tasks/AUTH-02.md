---
id: AUTH-02
title: Welcome and why you're here
owner: DEV
area: AUTH
order: 42
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

- **Base:** uncommitted on 3b02632, then `origin/main` 176a56d merged (staged, not committed). Main took G-33 (MONEY-10), so this task's rows are now **G-34** (unbacked claims, the pick's Hub field) and **G-35** (cover photo); the Verifier report above still says G-33 and G-34. G-34 rewritten: the Hub takes `accountType: 'user' | 'creator'` on `PATCH /users/me` (`src/api/schema.generated.ts` line 3890), AUTH-04 maps discover to `user` and earn to `creator`; a `creator` save calls `provisionOnRegistration` (wawu-backend `src/user-profile/user-profile.service.ts` line 283, read this round), against R-6. Default (agent): AUTH-04 must not send `creator` until it knows the wallet side effect is intended or removed.
- **D1 fixed:** `WelcomeScreen` renders its light `StatusBar` only while `useIsFocused()` (expo-router export) is true, so its entry leaves React Native's StatusBar props stack when A2 or A22 is pushed over it (the root layout's theme entry then wins: `mergePropsStack`, last mounted wins) and comes back on Back. Tests read the merged `StatusBar._currentValues.barStyle`: A1 -> A2 and A1 -> A22, light and dark, each Back to A1 (4 tests). Revert (always light): 2 fail (light theme; in dark the default is light too).
- **D2 fixed:** A2 passes `contentTop={TITLE.top}` (10, auth.js line 10 `pt: 10`, replacing the kit default 8, kit.js line 35) and the title has no padding of its own. Measured on web 390x844 below the bar: A2 title top 66 (canvas 56 + 10), cards at 145.8 and 249.0; A22 title 74 (56 + 8 + 10, unchanged); A1 unchanged. Test on the constant; revert: 1 fails.
- **D3:** every file-and-line citation I added re-read against the source: `choice` is auth.js line 9 (two fixed); added kit.js line 15 (`Btn` 54 high) and line 35 (`body` default 8); auth.js 8 and 10, kit.js 38 and 60, schema line 3890 and service line 283 checked correct.
- **D4:** the test is now 'a user who signs out is taken to the welcome screen'.
- **U3:** `clearAccountType()` runs when A1 mounts (each signed-out visit: cold start and after every sign-out) and after a sign-in on A22 succeeds; Back and return within a visit keeps the pick. Default (agent), owner may override: the pick lives in memory only and is lost on a reload or when Android ends the app; it holds no secret. Tests: sign-in forgets it; a session started another way keeps it until sign-out, after which A2 opens with nothing picked. Reverts: each clear removed, 1 fails each.
- **U4:** Space and Enter pick a focused card (`pickByKey`, react-native-web's `onKeyDown`; its Pressable presses on Space only for button roles). Tests for both keys and for another key; revert: 2 fail.
- **Counts:** before this round 20 suites, 356 tests; after (main 176a56d merged) `npm run check` exit 0, lint 0 warnings: 20 suites, 371 tests (auth-welcome 16 to 26, the rest from main), gates 96 files 0 findings, 202 tasks. Pictures: scratchpad `shots-r1/` (A1, A2 none/discover/earn, A22, light and dark), measurements `measure_r1.json`. **Left as recorded:** U1 (G-35), U2, U5 and defaults 1 to 7.
- **NOT RUN:** the status bar (D1) and the A22 keyboard (U5) on an Android device or emulator, unblocked by an Android build per docs/BUILDS.md; sign-out in a browser (no control yet, unblocked by the task that adds one).

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


## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
