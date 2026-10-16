---
id: FIX-14
title: Shared UI follow-ups: chip outline, hidden decorations, the consent box, a hanging test, the fork gate
owner: YOU
area: FIX
order: 195
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [SHARED-03]
decisions: []
passes: [V1, V5, V6]
artboards: []
---
# FIX-14 · Shared UI follow-ups: chip outline, hidden decorations, the consent box, a hanging test, the fork gate

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Builder done (one Sonnet session, 16 Oct 2026); the verifier is next.
- **Branches:** mobile `wmt/FIX-14` (code `208d87c` and `5238c29`, from main `3117807`, nothing newer to merge). Backend: none changed. wawu-id: none. Migration: none. Contract: unchanged.
- **Built:** R1 row chips draw their outline inside the padding (15, or 11 and 14 in an icon row, less the border), so a chip is exactly the canvas's width; N1 decorative `Avatar` and the `MediaCard` placeholder pass `aria-hidden`; A5's consent box passes `aria-checked`; `settingsScreens.test.tsx` exits on its own (a mutation's 5 minute `gcTime` timer, now `Infinity` in that test's client); the fork gate reads function components (a copy of a component exported from `src/components/` fails).
- **Checks:** see the builder report (full local run, EXIT line). No CI for mobile (billing).
- **Edited tests that were not mine (4 assertions, for the new padding):** `src/__tests__/hubSharedProps.test.tsx` (3) and `src/__tests__/lists.test.tsx` (1) asserted the row chip's padding without its border (15, 11, 14). They now assert padding plus border equals those numbers, the same sum `chips.test.tsx` already asserts for option chips. Nothing else in any test, gate or baseline was changed.
- **Open findings:** none known. Low, for the sweep: 14 other test files build their `QueryClient` with `mutations: { retry: false }` and no `gcTime`, so each would also keep Jest up about 5 minutes if run alone (they exit in the full run).
- **Not run:** a phone; the live web DOM for the decorative avatar and the consent box (jest checks the props the components set); Apply's and the host day picker's chips on screen (same component, not reachable without data).
- **Next:** the verifier checks the four capability checks below, V1 with its own full run, V5 pictures against X2, X3, I1 and M34, and V6.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/SHARED-03.md` (verifier report: R1, N1, the settings test hang)
- `tasks/KYC-03.md` (R3-1: A5's consent box)
- `scripts/gates/checks/forks.py`

## Goal

Small shared items the checks found, none blocking alone: row chips are 2 px wider than the canvas on every row (R1); decorative avatars are read aloud on the web (N1); A5's consent box has no checked state for screen readers on the web (KYC-03 R3-1); `settingsScreens.test.tsx` hangs about 5 minutes after passing; and the fork gate misses function components.

## Scope

R1: draw the row chip's outline as the canvas does (it takes no room), and fix `chipIconMetrics`'s comment; prove every chip on every screen with pictures. N1: decorative `Avatar` and the placeholder pass `aria-hidden` on web. A5: `aria-checked` on web, as the design-system showcase does. The hanging test: find what stays open and close it. `scripts/gates/checks/forks.py`: catch a local function component that copies a shared one (with a test).

## Capability checks

- [ ] Row chips match X2 and X3 to the pixel; Inbox and M34 chips match their artboards.
- [ ] Screen readers on web skip decorative avatars and read the consent box's state.
- [ ] The settings test file exits on its own.
- [ ] The fork gate fails on a planted function-component copy.

## Builder report

**Builder report, 16 Oct 2026 (Sonnet builder, one session).** Mobile `wmt/FIX-14` from main `3117807`; no backend, wawu-id or contract change; migration none.

**Files.** `src/components/FilterChips.tsx` (row chip: `rowBorder` hairline kept, padding is 15 less it, as `optionChipMetrics` already does; the `chipMetrics` and `chipIconMetrics` comments now say how the outline is counted), `Avatar.tsx` (`aria-hidden` beside the two native props when `decorative`), `MediaCard.tsx` (placeholder slot `aria-hidden`), `src/features/open-wallet/ConfirmDetailsScreen.tsx` (`aria-checked={agreed}`), `scripts/gates/checks/forks.py` (function components), `src/features/settings/__tests__/settingsScreens.test.tsx` (client `mutations.gcTime`). New: `src/__tests__/sharedFollowups.test.tsx` (8 tests), `src/features/open-wallet/__tests__/consentBoxAria.test.tsx` (1), `scripts/gates/tests/test_forks.py` (12).

**R1, chips, with pictures.** Web export of this branch through `stack.sh` (`--with mobile`, ports 7240 to 7247, only 7240 and 7247 baked in), signed in as the mock's user, 390 px at 2x, dark and light. Scratch `fix-14-b/`: `pairs/` (artboard left, app right, and the chip row artboard over app) for X2, X3, I1 and M34; `probe/canvas.json` against `shots/app_chips.json`. Widths, canvas then app: X2 All 42.64 / 42.64, Music & Audio 139.56 / 139.56, Film & Video 130.23 / 130.22; I1 All 47.64 / 47.64, Communities 114.95 / 114.95; M34 All 47.64 / 47.64, Brand films 105.42 / 105.42, Photography 114.45 / 114.44, Workshops 101.88 / 101.89. Every chip on Categories (X2 and X3 with a chip picked), Inbox, Works, Wallet history, My tickets, Directory and Schools, both themes: 106 chips, padding plus border is 15 and 15, or 11 and 14 in an icon row, 0 odd; a chip does not change size when picked. The Hub's categories differ from the canvas's and Inbox shows All and Communities only (Paid DMs and Money are not built); Apply's and the host day picker's chips were not reachable.

**N1 and A5.** `sharedFollowups.test.tsx` checks `aria-hidden`, the two native props and no label on a decorative avatar, a normal avatar unchanged, the placeholder slot hidden. `consentBoxAria.test.tsx` watches the props the screen gives the Pressable (RNTL 14 shows the host only, and RN folds `aria-checked` into the state) and checks `aria-checked` false, true, false with the state. The live DOM was not checked (see NOT RUN); the chips' `aria-checked` did reach the web DOM as `true` and `false`, the same path.

**Hang.** A probe (a temporary setup file, scratch `probe/`) found 7 pending 300000 ms timers from `Mutation.scheduleGc` on unmount; `QueryClient.clear()` does not cancel them. Before: the file alone ran about 5.5 minutes after the last pass (`logs/hang1.log`); after: 22 s wall for the whole file, exit on its own (`logs/hang2.log`).

**Fork gate.** A planted `function ErrorState()` in `src/features/me` fails with its file and line (`logs/planted.log`); the real tree has 0 findings from it. 12 unit tests cover each way of writing a component, a subfolder, a platform pair, a test file, same name in two features (left alone) and the old class check.

**Edited tests that were not mine:** `hubSharedProps.test.tsx` (3 assertions) and `lists.test.tsx` (1): padding plus border instead of padding alone, for the same numbers.

**Checks.** Full local run, one command with two jest workers (`logs/mobile-check.log`): CHECK_LINE

**NOT RUN.** A phone; the live web DOM of a decorative avatar (a stubbed Inbox answer was not served cross-origin) and of the consent box (needs a full A3 to A5 sign-up); no mutants run.

**Procedure.** I ran `git checkout -- <file>` once, on my own uncommitted line in `ConfirmDetailsScreen.test.tsx`, to move that test into its own file; nothing else was discarded.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
