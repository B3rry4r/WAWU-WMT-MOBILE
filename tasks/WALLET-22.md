---
id: WALLET-22
title: WAWU card
owner: YOU
area: WALLET
order: -3122
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [WALLET-31]
decisions: [R-16, R-37, R-84, R-47, R-29]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W29, W30, W31, W32, W33, W34]
tier: T2
---
# WALLET-22 · The WAWU card on Nuvion (app side)

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B20), mobile `wmt/WALLET-22` is on branch `wmt/WALLET-31` (the bundle's one branch) from `origin/main` `7e65293b`, contract synced from backend `wmt/WALLET-31` `718d332`; status verifying; no PR. Pictures were NOT made (step budget; see the builder report). Under R-84 the card is what Nuvion serves, so W30, W33 and W34 are not drawn (R-47) and W29's Physical choice is gone.

| # | Before | After |
|---|---|---|
| 1 | no card screen, W1 and W35 draw no card row | `/cards` (W31's entry; with no card it is W29 itself), `/cards/new` (W29: Virtual or Single-use, the fee as the quote says it, PIN or fingerprint, one Idempotency-Key per attempt), `/cards/[id]` (W31 and W32: status, Freeze, Details behind the PIN for 30 seconds, Unfreeze behind the PIN, "Card lost or stolen? Block it" with a confirm sheet, card spending in dollars) |
| 2 | W1 and W35 have no card row | W1's card row (`CardRow`, between the actions and Transactions) and W35's Cards row, each drawn only while `GET /money/cards` says `enabled` (R-47) |
| 3 | n/a | the card number, expiry and CVV are held in screen memory only while shown; never in a query cache, a log or storage |

- **W30, W33, W34, the Physical tab:** not built, Nuvion has no physical card, card PIN, channel switches or limits to set. W31's Card PIN and Limits tiles and ATM spending are not drawn.
- **Built from existing parts with a gap row (R-29):** the list of several cards (no board draws it; `G-WALLET-22-1`), the W1 row's no-card line "Get your card", the Block confirm sheet, the status banners for pending and blocked.
- **Next:** the backend fix round (WALLET-31), then a verifier again. Done by the verifier: the stack walk and the pictures (390 px, light and dark, of W29, the list, W31 active, W32 frozen, details shown, the block sheet) beside `render_design.py W29 W31 W32`.
- **History:** none yet. Reports go to tasks/history/WALLET-22.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-16 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W29 W30 W31 W32 W33 W34` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/fintava/naira-api.md` (section "Cards")
- `docs/designer/BRIEF.md`: its entries for W29, W30, W33 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

The screens of the WAWU card as Nuvion issues it today, against the real API, in light and dark. Only what Nuvion serves is drawn (R-47, R-84).

## Scope

New files under `src/features/cards/` and `src/app/cards/`; small additive edits to W1 (`WalletScreen.tsx`: one row), W35 (`WalletSettingsScreen.tsx`: one optional prop and row, `src/app/wallet-settings.tsx`) and three `Stack.Screen` lines in `src/app/_layout.tsx` (SHARED-CHANGES WALLET-22 rows). The contract is synced from backend `wmt/WALLET-31`.

## Artboards

- **W29 · Cards · get a card**: No-card state: card art, pitch, choose Physical (3–5 working days, ₦2,000) or Virtual (ready now, free), pay from wallet, Order physical card.
- **W30 · Cards · delivery**: Delivery form: name on card (matches ID), address, city, state; cost breakdown (card + delivery); pay from wallet; then PIN, then W31 'On its way'.
- **W31 · Card detail**: Manage card: Physical/Virtual tabs, status Active, spends from Naira wallet; Freeze, Details (number/expiry/CVV behind PIN), Card PIN, Limits; card spending list.
- **W32 · Card · frozen**: Frozen card: payments and ATM blocked, wallet untouched; Unfreeze; Block if lost or stolen.
- **W33 · Card · limits and controls**: Channel toggles (Online, Shops/POS, ATM, Contactless) and editable daily limits with used-today.
- **W34 · Card PIN**: Choose a card PIN for ATMs/POS, explicitly separate from the transaction PIN.

## Fintava facts

Superseded by R-84: Nuvion issues virtual and single-use dollar cards only.

## Brief changes (build these, not the canvas)

- **W29**: neither price is a single fixed number. Physical: WAWU's ₦1,500 card + ₦500 delivery, plus Fintava's card charge (not published yet). Virtual: not free; Fintava charges ₦2,000 (+ WAWU's fee, none set). Show each as "from" a sample, with the breakdown on the next screen. (Why: R-10 and Fintava's price list. Cards come after launch and are still undecided (R-16), so this can wait for the rest of this list.)
- **W30**: add Fintava's card charge as its own row before the total (sample left obvious; Fintava hasn't published it). The button "Order card · ₦2,000" shows that new total. (Why: R-10 and rule 5.)
- **W33**: "Card limits come from Fintava when cards are built." No tier. (Why: Fintava fact: no tiers in the API.)

## Capability checks

- [ ] **W29**: a user can pick Physical or Virtual; Order physical card (W30); get virtual card.
- [ ] **W30**: a user can edit address; Order card · ₦2,000.
- [ ] **W31**: a user can Freeze (W32); Details; Card PIN (W34); Limits (W33).
- [ ] **W32**: a user can Unfreeze card; Block it.
- [ ] **W33**: a user can toggle channel; Edit limits.
- [ ] **W34**: a user can enter card PIN.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W32.
- [ ] From W1, a user can tap the WAWU card row, and from W35 tap Cards (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **W29**: missing. Missing: No card issuing of any kind.
- **W30**: missing. Missing: No card order, address or delivery tracking.
- **W31**: missing. Missing: No card management.
- **W32**: missing. Missing: No card freeze/block.
- **W33**: missing. Missing: No card controls.
- **W34**: missing. Missing: No card PIN.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W29: Physical card Delivered in 3–5 working days · ₦2,000
- W29: Virtual card · Free
- W29: 'anywhere in Nigeria that takes Verve'
- W30: Card ₦1,500
- W30: Delivery ₦500
- W30: Total ₦2,000
- W30: 'Matches the name on your ID'
- W31: Shoprite Lekki POS −₦18,450.00 (sample)
- W31: ATM withdrawal Access Bank −₦20,000.00 (sample)
- W32: 'Freezing works instantly'
- W33: ATM ₦100,000 daily
- W33: Shops and POS ₦500,000 daily
- W33: Online ₦300,000 daily
- W33: ₦23,200 used today (sample)

## Designer notes (⚠, unresolved)

- W29: “⚠ Fees and delivery times are placeholders.”
- W33: “⚠ These are CBN-style default limits. The real caps depend on your KYC tier.”

## Builder report

Checks (each log EXIT line): `src/features/cards` 14 tests in 2 suites (api calls against a stood-in Hub: headers, key, body, every outcome; words and figures), EXIT 0; `route-guard` and `route-graph` 304 of 304, EXIT 0; tsc EXIT 0; eslint (no fix) on every changed file EXIT 0; gates 0 fail and 18 warn, the same as the untouched checkout (my first run had 19 literal-spacing findings, all fixed in my files, nothing baselined); `check_baseline` EXIT 0. The existing W1 and W35 tests (`WalletScreen`, `WalletSettingsScreen`, `walletStatementsRow`) fail 3 tests with or without this change (same 3 on the untouched checkout).
NOT RUN: the pictures (no stack walk, so no real-data screens), a screen-level test of the three screens (the call and the words are tested; the flow needs the stack), the full app check (the merge agent's).
No new native module and none needed (the PIN sheet, `PayPinSheet` and the fingerprint approval are the app's own).
Gap rows: G-WALLET-22-1 (the card list has no board), -2 (W29's "Pay from wallet · balance" line is not drawn: the quote has no balance; the Hub's `insufficient_funds` says the fee).

## Verifier report

Verifier: the same Sonnet agent as WALLET-31's (it built none of either). Mobile `origin/wmt/WALLET-31` `061b0546`. The app side was walked on the stack in `tasks/WALLET-31.md` (same run, same pictures, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-31-v/sheet-*.png`); the full table and the findings are there. App results: tsc EXIT 0; jest `src/features/wallet src/features/settings src/features/cards src/app` 32 suites, 514 tests, EXIT 0; app gates 0 fail (1315 files), `check_tasks` EXIT 0.

| Pass | Result | Evidence |
|------|--------|----------|
| V4 Gates | passed | as above |
| V5 Picture | passed | W29, W31, W32, W1 row, W35 row, list, details, block sheet, light and dark beside the boards |
| V6 States | partly run | wrong PIN, frozen, blocked, details hidden after 30 s, cards off; NOT RUN on screen: not enough money, limit reached, pending, network cut |
| V7 Flow walk | passed | sign in to both kinds made, details, freeze, unfreeze, list, block |
| V8 Money | passed | one fee per card, Hub balance equals the stand-in's after every step |
| V9 Live seam | partly run | real sign-in on the stack; NOT RUN against Nuvion dev |

App findings (all low, see WALLET-31 for repro): L2 (a used single-use card reads "Frozen, Unfreeze card"), L4 (W1's row after every card is blocked), L5 (entries hidden while cards are off), L7 (W29 fee surface spacing). No picture or flow defect above low. Status stays `building` only because the bundle's one branch needs the backend fix round (WALLET-31 H1); the app code needs no change for H1.

### Round 1 (24 Oct 2026, a Sonnet builder, T2; mobile `wmt/WALLET-31` on the verifier's `5aef0ac6`, contract synced from backend `c2cc38f`; status verifying)

L2: a used single-use card shows "Used" (art, pill, banner, no actions, payments listed). L4: W1's row and the list say "Get a new card" when no card is left to use. L5: W1's row, W35's Cards row and the list stay while cards are off and the person holds a live card (freeze and block still work). L7: W29's fee card uses `Card padded`. Checks: `src/features/cards` suites, `route-guard` and `route-graph`, tsc, eslint, gates 0 fail and 18 warn; the wallet tests that timed out at 20 s on a loaded machine pass with a long timeout. NOT RUN: pictures of round 1, the stack walk.

### Verifier re-check of round 1 (24 Oct 2026, mobile `49cec3e1`) -- PASS

L2, L4, L5 and L7 are closed: the app model tests (used card, "Get a new card", row and list while cards are off with a live card) and jest `src/features/cards wallet settings` pass (32 suites, 517 tests, EXIT 0), app tsc, gates (0 fail, 18 warn) and `check_tasks` EXIT 0. The Hub half ran live on Nuvion dev from the Hub's own routes (see `tasks/WALLET-31.md`). Pictures were not made: the disk had 2.3 GB free, the brief asks for 4 GB.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
