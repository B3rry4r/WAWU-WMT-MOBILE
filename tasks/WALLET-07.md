---
id: WALLET-07
title: Send money to a WAWU user
owner: YOU
area: WALLET
order: 137
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: [MONEY-17, WALLET-15, SETTINGS-04]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-07 · Send money to a WAWU user

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Round 1 verified: the money path held; no way to move money twice, lose it or send it to the wrong person. By the 15 Oct rule the verdict is merge. Stacked on NUV-06 (this branch contains `wmt/NUV-06`, which contains `wmt/MONEY-16`).
- **Branches:** mobile `wmt/WALLET-07` (this branch; NUV-06's mobile head merged, API types regenerated from backend `wmt/WALLET-07`). Backend `wmt/WALLET-07` `75c862d` (NUV-06 `4fc31b6` merged; migration renamed to `20261021290000_wallet_transfers`, contents unchanged). No PRs yet.
- **Merged and live:** nothing of this task.
- **Open findings:** blocker 0, high 0, medium 0. D1, D2 and D3 (all low) and the PushStoppedAccount item are in tasks/SWEEP-MONEY.md.
  - Known limits: the Nuvion book transfer has no field for WAWU's fee (N10), so a send completes at the quote unless the owner sets Nuvion's fee; a lost answer completes at the quote whatever the provider took (G-717).
- **Next:** the lead merges backend MONEY-16, NUV-06, then this one. The backend CONVENTIONS section for this task is 19; TIER-02 and WALLET-16 claim 19 on their open branches (MONEY-16 took 22), so whichever merges second renumbers.
- **Records:** the round history is in tasks/history/WALLET-07.md.

## Lead note (11 Oct 2026): from MONEY-19's verification

- A send this task builds that the wallet cannot cover must answer MONEY-19's `402 insufficient_funds` with `balanceKobo`, `totalKobo` and `shortfallKobo` (G-481); today `walletProviderErrorToHttp('insufficient_funds')` builds a 402 with no figures.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W7, W9-W12, I13-I15: send to another WAWU user by name, @handle or phone.

## Scope

Transfer between two Fintava accounts with a note, PIN and Idempotency-Key; a receipt.

**Lead note (4 Oct 2026, from KYC-04):** a money action here that answers `409 pin_not_set` opens A9 (route `open-wallet-pin`, KYC-04) and comes back to this screen once the PIN is set; it never shows the bare error.

## Capability checks

- [ ] A user with ₦10,000 sends ₦2,000 to @amaka: their balance drops by ₦2,033.25 (₦2,000 + Fintava's ₦23.25 + WAWU's ₦10, the quoted total); Amaka's rises by exactly ₦2,000.
- [ ] Sending to a blocked user is refused.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-07.md](history/WALLET-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
