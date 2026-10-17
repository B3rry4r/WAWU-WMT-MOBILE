---
id: BILLS-04
title: Pay bills from the wallet (backend)
owner: YOU
area: BILLS
order: 115
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-18, MONEY-19, MONEY-13, MONEY-16, WALLET-15]
decisions: [R-10, R-19, R-20, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
On hold since 6 Oct 2026: the wallet provider is moving from Fintava to Nuvion, which has no bill payments. The owner decides whether bills stay (drop, or a separate bills provider).

# BILLS-04 · Pay bills from the wallet (backend)

## Current state

As of 16 Oct 2026.
- **Status:** live (backend main a5e48fc, PR #141). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/BILLS-04.md`): verdict merge, nothing medium or worse. Stacked in batch 5 (backend and mobile `wmt/MERGE-5`). Round 2 of the check; its lows are closed by FIX-40 and FIX-42.
- **What is built** (backend `src/wallet-bills/`): `POST /bills/wallet` starts an electricity, airtime, data or cable bill and answers its quote (S5: the bill, the lines of the fee, the wallet payment's quote with the balance and shortfall for S11); `POST /bills/wallet/pay` pays it with the PIN; `GET /bills/wallet/{id}/quote`; `GET /bills/wallet/{id}` (S7's token, units and reference, or S12's failure with the money back). The web's Flutterwave bill routes are untouched.
- **How a bill is paid:** a held `bill` payment moves the bill, Fintava's bill charge and WAWU's fee into WAWU's account in one transfer (R-31); then the purchase is made at Fintava out of it, once. Delivered: the hold is released. Failed: the hold is refunded by itself (S12). A bill under the company's minimum, a meter Fintava does not know and a price that changed are refused before any debit.
- **Next:** a verifier. Passes V1, V2, V3, V4, V6, V7, V8, V9. The purchase checks NOT RUN against Fintava (question 17: payouts still refused in the sandbox); everything was run against the sandbox-shaped double, whose success bodies are guesses (G-647).
- **Open for the lead or owner:** G-648 (bills cannot be paid from a Nuvion wallet: every bill route answers `target_not_payable` under `WALLET_PROVIDER=nuvion`; an owner ruling is needed before production moves to Nuvion, R-39, R-45); G-649 (Recent needs a list route, BILLS-02 or BILLS-03); G-462 (a refunded failed bill costs WAWU Fintava's charge on the refund move; the person loses Fintava's charge on the first transfer, R-10).
- **Fences touched:** SHARED-CHANGES BILLS-04 #1 (schema and migration, `src/app.module.ts`, `contract/openapi.json`, two route inventories in specs, the purge map, and one change in the payment service: a bill is counted against the bill limits, not the purchase ones).
- **Round 2 (16 Oct):** the verifier's medium (a lost purchase settled with another bill's record) and four lows fixed, each red then green; the fixes are in tasks/history/BILLS-04.md. Migration `20261023210000_wallet_bills` now also has two unique indexes (still unmerged). Next: a verifier for round 2 (the medium, then the lows).
- **Sweep, not built here:** FIX-40, the daily limit counting a refunded payment (shared WALLET-23 code, `money-limits.service.ts`).
- **History:** the builder reports are in tasks/history/BILLS-04.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

A bill is paid from the user's wallet with the PIN: the money moves into WAWU's merchant wallet, then to the biller, and comes back by itself if the biller fails (R-19). Bill payments move to Fintava; the web keeps Flutterwave until after launch.

## Scope

Bills pay from the wallet into WAWU's merchant wallet, then the biller (no 85/15 on bills: the full amount goes to the biller); the electricity token and units come back (S7); a biller failure reverses the debit automatically (S12). The web stays on Flutterwave until after launch; V3 checks it still works.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Capability checks

- [ ] A user pays an electricity bill from their wallet with their PIN and gets the token (S7), or a gap is filed if Fintava's response has none.
- [ ] A biller failure returns the money to the user's wallet without anyone acting (S12).
- [ ] A bill below the disco's own minimum is refused before any debit.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/BILLS-04.md](history/BILLS-04.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
