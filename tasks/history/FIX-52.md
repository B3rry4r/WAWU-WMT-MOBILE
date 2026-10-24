# FIX-52 · round history

Moved out of [tasks/FIX-52.md](../FIX-52.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-52` `d865efb` from `wmt/MERGE-7` `432f017`; mobile `wmt/FIX-52` (this record).
- Routes that lost the fee on Nuvion: `POST /money/transfers/wawu`, `POST /money/transfers/bank` (withdrawals, money request pay). No other route quotes a WAWU fee.
- Fix and proof are in the task file. Spec: `src/money/transfers/tests/wallet-transfer-wawu-fee-nuvion.contract.spec.ts` (real Nuvion adapter and book area over the HTTP stand-in).
- Judgment calls for the lead: (1) Nuvion's charge for moving the fee comes out of WAWU's fee (the quote's provider part is for the send alone). (2) The nightly money check (`merchant_charges`) reads Fintava's merchant charge only, so on Nuvion it reports `merchant_charge_missing` for each send with a fee; it needs to look at the `-fee` transfer (a follow-up, not in this task). (3) A send completed and later reversed by Nuvion keeps WAWU's fee (no rule exists for completed-then-reversed).

## Verifier report

_Not started._
