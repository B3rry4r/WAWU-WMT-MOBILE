---
id: WALLET-01
title: Wallet home: Naira account and its states
owner: YOU
area: WALLET
order: 150
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-11, MONEY-12, MONEY-13, MONEY-15, UI-02, KYC-05, WALLET-02, WALLET-05, WALLET-06, BILLS-01, WALLET-04]
decisions: [R-1, R-16, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [W1, W4, W5, W6]
---
# WALLET-01 · Wallet home: Naira account and its states

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W1 W4 W5 W6` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W1, W5 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W1 · Wallet · Naira**: Naira account home: account tabs (Naira/Dollar/Crypto), balance with kobo, 'WAWU · ' and the bank name from the API (Loma Bank, BRIEF W1) with the NUBAN and Copy, Send / Add money / Swap, bills tiles (Airtime, Data, Power, TV, More), WAWU Verve card row, recent transactions. Entry map (section 0) numbers 10 hotspots.
- **W4 · Wallet · loading**: Skeleton of the real layout; account number hidden until the balance loads.
- **W5 · Wallet · new account**: First visit after account opening: ₦0.00, NUBAN ready to share, empty transactions with 'Send to 812 345 6789 from any Nigerian bank.'
- **W6 · Wallet · can't reach account**: Error state when the bank does not respond: no balance is shown, reassurance copy, Try again; bills tiles still visible.

## Launch scope

The Dollar and Crypto tabs, Swap, Scan and the WAWU card row are not built at launch (R-16; BRIEF W1 and "Three
defaults"). Each is added, as drawn, by the after-launch task that builds its screen (WALLET-21, WALLET-20,
WALLET-22). Debit rows show the total that left the wallet (BRIEF W1).

## Brief changes (build these, not the canvas)

- **W1**: "WAWU · " followed by the bank name as a slot the app fills. Sample "Loma Bank". Keep the Dollar tab drawn; the app hides it at launch. In the recent transactions, a debit row shows the total that left the wallet: "Chidinma Okoro · Transfer · GTBank −₦25,065.00" (₦25,000 + ₦65) and "Ikeja Electric · Prepaid −₦10,600.00" (₦10,500 + ₦100). The tip received stays +₦2,000.00. (Why: R-1 and a Fintava fact: the bank is Loma Bank, named by the API. R-16 for the Dollar tab. Rule 5 and R-10 for the debit rows.)
- **W5**: "WAWU · Loma Bank" (bank name slot, as W1). Dollar tab as W1. (Why: R-1.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W1: Swap and the Dollar and Crypto tabs (opens W20): added by WALLET-21 after launch; not built at launch (BRIEF, "Not built at launch")
- W1: Scan (opens W24): added by WALLET-20 after launch; not built at launch (BRIEF, "Not built at launch")
- W1: the WAWU card row (opens W29): added by WALLET-22 after launch; not built at launch (BRIEF, "Not built at launch")

## Capability checks

- [ ] **W1**: a user can copy the account number; Send (W7); Add money (W15); open Settings (W35); pay a bill from a bills tile (S2); See all transactions (W26).
- [ ] **W5**: a user can copy account number; Send; Add money.
- [ ] **W6**: a user can tap Try again; use bill tiles.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W4, W5, W6.
- [ ] A signed-in user with no wallet who taps the Wallet tab lands in Open your wallet (A26), and after A10 lands on W5.

## What the backend serves today (from the analysis)

- **W1**: partial. Missing: Balance and NUBAN exist but on a Flutterwave PSA, in whole naira, creator-only. Missing: multi-account (USD, crypto) summary, card summary, bank-record transactions, Fintava provider.
- **W4**: n/a. Missing: Client state only.
- **W5**: partial. Missing: Provisioning exists only for creator accounts and only at Flutterwave; canvas opens an account for everyone at sign-up (A8 'Tier 1 opens the wallet').
- **W6**: partial. Missing: Endpoint fails as a whole when the provider is down; no typed 'provider_unreachable' error code distinct from other failures, and it is Flutterwave, not Fintava.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W1: WAWU · Fintava MFB
- W1: Naira balance ₦485,250.75
- W1: account number 812 345 6789
- W1: Verve WAWU card Physical · ••4821 · Active
- W1: Amaka Nwosu Tip on your video +₦2,000.00
- W1: Ikeja Electric Prepaid · 45.2 kWh −₦10,500.00
- W1: Chidinma Okoro Transfer · GTBank −₦25,000.00
- W5: 'Send to 812 345 6789 from any Nigerian bank.'
- W5: ₦0.00
- W6: 'Your money is safe. This is a connection problem between us and the bank.' (custody claim)

## Designer notes (⚠, unresolved)

- W1: “⚠ I added the WAWU card row under bills, because it's the only way into Cards (W29–W34). ⚠ The Create button is hidden on Wallet so it never covers amounts. Confirm.” Resolved: the designs are final (DECISIONS, Authority); the card row is added after launch by WALLET-22.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
