---
id: WALLET-22
title: WAWU card
owner: YOU
area: WALLET
order: 197
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-31, WALLET-01, WALLET-06]
decisions: [R-16, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W29, W30, W31, W32, W33, W34]
---
# WALLET-22 · WAWU card

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

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W29 · Cards · get a card**: No-card state: card art, pitch, choose Physical (3–5 working days, ₦2,000) or Virtual (ready now, free), pay from wallet, Order physical card.
- **W30 · Cards · delivery**: Delivery form: name on card (matches ID), address, city, state; cost breakdown (card + delivery); pay from wallet; then PIN, then W31 'On its way'.
- **W31 · Card detail**: Manage card: Physical/Virtual tabs, status Active, spends from Naira wallet; Freeze, Details (number/expiry/CVV behind PIN), Card PIN, Limits; card spending list.
- **W32 · Card · frozen**: Frozen card: payments and ATM blocked, wallet untouched; Unfreeze; Block if lost or stolen.
- **W33 · Card · limits and controls**: Channel toggles (Online, Shops/POS, ATM, Contactless) and editable daily limits with used-today.
- **W34 · Card PIN**: Choose a card PIN for ATMs/POS, explicitly separate from the transaction PIN.

## Fintava facts

Fintava issues physical Verve, Visa and Mastercard cards tied to the wallet account number (`POST /cards/physical/request`, `cardType: STATIC_WITH_ACCOUNT`), with activate, deactivate, reissue, link, PIN change and status. Fee, delivery and card webhook payloads are not documented: get them from Fintava.

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
