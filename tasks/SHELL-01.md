---
id: SHELL-01
title: App shell: the five tabs
owner: DEV
area: SHELL
order: 15
priority: launch
repo: wawu-wmt-mobile
type: flow
status: done
depends_on: [SETUP-01]
decisions: []
passes: [V1, V5, V6, V7, V9]
artboards: [H1, W1, I1, M1, X1]
---
# SHELL-01 · App shell: the five tabs

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H1 W1 I1 M1 X1` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A3.json`, `docs/analysis/evidence/A4.json`, `docs/analysis/evidence/A5.json`

## Goal

Home · Explore · Inbox · Wallet · Me, the same for everyone, with the tab bar the design draws.

## Scope

src/app/(tabs)/_layout.tsx and one route file per tab; the tab bar component. This task owns the route graph for the tabs.

## Capability checks

- [ ] A user can move between the five tabs, and the active tab matches the design in light and dark.
- [ ] The Inbox badge reads from data, not a constant (empty until INBOX-04).
- [ ] Cold start lands on Home.

## Builder report

**Files:** src/app/(tabs)/_layout.tsx and index/explore/inbox/wallet/me.tsx; src/app/_layout.tsx (registers (tabs)); src/components/TabBar.tsx, TabIcon.tsx; src/features/inbox/unread.ts (badge count store, read by the bar); src/features/shell/TabScreen.tsx (tab body until each feature fills its route); src/__tests__/shell.test.tsx (new); foundation.test.tsx (boot-screen test removed with the boot screen); src/app/index.tsx deleted (replaced by (tabs)/index, so cold start is Home). BACKEND_GAPS G-4, docs/LOG.md.
**Checks:**
- Move between the five tabs, active tab matches design: jest drives renderRouter, presses each tab, asserts that tab's screen shows and exactly one tab is selected (PASSED). Picture: web export at 390 wide, light and dark, bar crop beside X1 render in build/app_shots/cmp-light.png and cmp-dark.png (looked at, builder's view only; verifier decides).
- Inbox badge from data: jest asserts no badge at 0, "3" after setInboxUnread(3), gone at 0 (PASSED). Count comes from useInboxUnread(); nothing writes it until INBOX-04 (G-4: no unread-count endpoint, DM inbox also needs a session).
- Cold start lands on Home: jest asserts Home selected on first render (PASSED); web export loaded at / shows Home.
**Gates:** before 5 tests / gates 9 run, 6 files, 0 findings / 187 tasks. After 7 tests / gates 9 run, 16 files, 0 findings / 187 tasks. npm run check exit 0.
**Passes by me:** V1 npm run check. V5 web-export crop only, one tab bar state per theme. V6 NOT RUN (a bare shell has no loading, empty or error states). V7 NOT RUN beyond the jest walk (no sign-in yet, SHELL-02). V9 NOT RUN: no session or sign-in exists, so no real-login value can be read; local backend not started.
**Notes:** icons are Lucide outlines drawn as SVG through expo-image (react-native-svg is not installed and package.json is fenced); blur-chrome is not applied (no blur module), the 86% chrome token is used. The Create button belongs to the screens (creator only), not the shell. Tab bodies show only the tab title until the HOME, EXPLORE, INBOX, WALLET and ME tasks fill the routes. No shared-change requests filed.

## Verifier report

Verifier session 2 Oct 2026, fresh, wrote none of the code. Checked the uncommitted working tree on `wmt/SHELL-01` against `main`. Evidence directory: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Own run of `npm run check`: exit 0. tsc and expo lint clean; jest 3 suites, 7 tests, all passed; gates: 9 run, 16 files scanned, 0 fail, 0 warn, 0 accepted, baseline 0; tasks: 187 tasks, 280 artboards. File list vs `git status`: matches the builder's list (see finding 5 for two extra files). | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/check.txt` |
| V5 Picture | passed for the tab bar with the differences listed below. Artboards H1 W1 I1 M1 X1 rendered (780 px wide, 2x of 390) and the web export screenshotted at 390 px, light and dark, all five tabs; opened both sets and compared bar crops for all five active states. Seen: same order (Home, Explore, Inbox, Wallet, Me), same Lucide-style outline icons, same labels and size, active tab is purple with bold label and a tinted inner fill (compass, chat bubble, wallet, person, house all match), idle tabs grey, same spacing and bar height, hairline top border, same light and dark colours. Seen differing: the design shows a "3" badge on Inbox (sample data), the app shows none at 0 (correct per the check); the design bar is translucent over scrolling content, the app bar is opaque (finding 2). The page bodies are only a title (tab bodies belong to the HOME/EXPLORE/INBOX/WALLET/ME tasks); the design's top bars, hero, content and floating Create button are not in this task's scope. | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/bars-light.png`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/bars-dark.png` (design row above app row for H1/Home, X1/Explore, I1/Inbox, W1/Wallet, M1/Me), `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/X1-light.png` vs `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/app-Explore-light.png`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/X1-dark.png` vs `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/app-Explore-dark.png`, other `app-<Tab>-<theme>.png` |
| V6 States | NOT RUN for loading, empty and error: a bare tab shell has no data fetch to fail. One state that can exist was run: the badge hidden at 0 (web screenshots, no badge on Inbox) and shown at 3 and removed at 0 (jest `shows no Inbox badge...`, passed in my own run). The badge at more than 0 was NOT seen in a screenshot: nothing in the app writes `setInboxUnread` until INBOX-04 (G-4), so it cannot be triggered in a built app. Unblocks: INBOX-04 (writes the count from the API). | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/app-Inbox-light.png`; `src/__tests__/shell.test.tsx` |
| V7 Flow walk | passed for what exists, NOT RUN for signed-in user types. Real browser (Chromium on the web export, SPA fallback server): cold start at `/` lands on Home; deep links `/wallet`, `/me`, `/inbox` cold-load on that tab; reload on `/wallet` stays on Wallet (resume); history back from Wallet returns to Home; tabs reachable by keyboard Tab; no page errors. Walking as new, existing, creator and buyer users is NOT RUN: there is no sign-in until SHELL-02, and the task says the shell is the same for everyone. | walk output in this report; `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/walk.py`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/shot.py` |
| V9 Live seam | NOT RUN. Two facts: (a) the shell makes no API call and holds no session, so there is no server value for it to show, and the task's capability checks do not require one; (b) a real login does not exist until SHELL-02 (the app has no sign-in screen), and `/home/user/WAWU-Backend` at `231cb64` has no `docs/LOCAL.md` (OPS-03's runbook is not in that checkout), so the local backend could not be started as documented. Unblocks: SHELL-02 (sign-in) plus the OPS-03 `docs/LOCAL.md` and `scripts/local/up.sh` present in the backend checkout. | none |

### Capability checks

- [x] A user can move between the five tabs, and the active tab matches the design in light and dark: **passed**. Real clicks on all five tabs in Chromium at 390 px, each shows its own page and the URL changes (`/explore`, `/inbox`, `/wallet`, `/me`); jest walk passed; active state compared to H1, X1, I1, W1, M1 in both themes (V5 row). Evidence: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/bars-light.png`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-01/bars-dark.png`.
- [x] The Inbox badge reads from data, not a constant: **passed by test, not by picture.** `useInboxUnread()` in `src/features/inbox/unread.ts` starts at 0 and has no writer in the app yet; jest sets 3 and 0 and the bar shows and hides the badge. Web screenshots show no badge at 0. A number above 0 in a built app: NOT RUN (see V6). Reported as G-4; nothing on screen is invented.
- [x] Cold start lands on Home: **passed.** Chromium opened `/` fresh, Home heading and Home tab first; `src/app/index.tsx` is deleted so nothing else claims `/`; jest asserts the same.

### Findings

1. `unclear`: the selected tab is not exposed in the web DOM. In Chromium every `role=tab` had `aria-selected` null, including the active one, although the component sets `accessibilityState.selected` (jest, which reads the native prop, passes). Native screen readers are likely fine; web screen readers get no active state. Owner to say whether web accessibility is in scope for the shell, since the app ships native first.
2. `unclear` (no DECISIONS or BRIEF entry covers it): the design's bar is a translucent blur over scrolling content (visible in every artboard crop), while the app bar is an opaque in-flow row, so the 86 and 88 percent chrome token is never seen through. The builder noted "blur-chrome is not applied (no blur module)" but not that the bar is also not overlaid on content. Owner to rule where blur chrome lands (a UI task) so this is not forgotten; fix would need `expo-blur` installed with `npx expo install`, which touches the fenced `package.json`.
3. `unclear`: `src/app/_layout.tsx` (fenced) was edited to add `<Stack.Screen name="(tabs)" />` and a comment. The task scope names only `(tabs)/_layout.tsx`, route files and the tab bar, though it says this task owns the route graph and DEV.md says `_layout.tsx` files are the developer's. Expo Router registers the `(tabs)` group without that line, so the edit may be unnecessary. No row in `SHARED-CHANGES.md`. Owner to accept or ask for it to be dropped.
4. `differs-for-recorded-reason`: deletion of `src/app/index.tsx` and of the `boot screen` test in `src/__tests__/foundation.test.tsx` is justified: `/` is now `(tabs)/index`, which satisfies "cold start lands on Home" and WORKFLOW rule 8 ("adding something also removes what it replaces"); the test removed only covered the deleted component and the other two foundation tests are untouched. Passes against the 187-task check. Not a defect.
5. `unclear` (small): the builder's file list omits `docs/PROGRESS.md` (modified, appears generated from the task files by the tasks script) and the status line in the task file itself. No code outside the listed files changed. `package.json`, `app.json`, `src/theme/**` and `src/api/**` are untouched (checked with `git diff --stat HEAD`).
6. Checked and clean: no colour, spacing or radius literals in the new files (all through `@/theme`; stroke widths 2.2 and 1.8 are SVG icon strokes, not spacing); no em or en dashes in any user-facing text; no "Flutterwave"; accessibility roles `tablist` and `tab`, selected state and a label that includes the unread count ("Inbox, 3 unread") are set; icons are hidden from accessibility; BRIEF.md has no entry that applies to the tab bar (H1 Schools tile, W1 bank name, M1 profile tabs and X1 are all page content, outside this task). The shown Create button and the sample "3" badge in the artboards are not built here: the first belongs to the screens, the second has no backing system data until INBOX-04, correct per WORKFLOW rule 7.
7. Not a finding but noted: `/nope` shows Expo Router's default "Unmatched Route" page; a not-found screen is outside this task.

No open defects.

## Owner sign-off

Owner, 2 Oct 2026: merged from wmt/SHELL-01 after its verification; checks green on main.
