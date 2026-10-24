# STACK-NUV · round history

Moved out of [tasks/STACK-NUV.md](../STACK-NUV.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/STACK-NUV` `432f017`, from `wmt/MERGE-7` `0be61a4`. Files: `scripts/dev/stack.sh`, `nuvion-standin.cjs`, `nuvion-redirect.cjs`, `nuvion-tool.cjs`, README. No product, Fintava, gate, baseline or test file.
- **Proof run** on a fresh stack `stack_nuv`, ports 7790-7797 (Hub 7790, stand-in 7796, mock 7797), Hub log `stack-nuv-b/logs/hub-final.log`:
  - `seed`: opened a wallet through `POST /money/wallet/open` and `POST /money/identity/documents`; the stand-in approved it (`entities.updated`), the Hub opened the naira account (`accounts.created`), asked for its details (`account_details.created`) and recorded the active ten-digit number (`account_details.updated`). Wallet `open` with account number 9982680264, PIN set, funded 5,000,000 kobo by a signed `inflows.completed`. Hub balance 5,000,000 = stand-in 5,000,000.
  - Purchase: WAWU Credits pack `starter` from the wallet (`GET /credits/purchase/wallet/quote`, `POST /credits/purchase/wallet`, PIN and Idempotency-Key): `paid`, 50,000 kobo. Hub 4,950,000 = stand-in 4,950,000; WAWU's operational account 100,000,000 to 100,050,000.
  - Bank send: `POST /money/banks/name-check` (GTB, resolved by the stand-in) then `POST /money/transfers/bank` for 100,000 kobo: `completed`; Hub 4,847,500 = stand-in 4,847,500 (fee 2,500).
  - Refund: `fire --settle <id> --status reversed` on that send: `outflows.refunded` stored and processed; Hub 4,950,000 = stand-in 4,950,000.
  - Fintava: 0 hits in the Hub log for the Fintava base URL (`127.0.0.1:1/api/dev`), `fintavapay` and `block-net] refused`. The Hub log shows `Nuvion adapter ready (sandbox)`.
- **Shape:** the Hub reads Nuvion webhooks on a 30 second tick, so opening (three webhooks in a row) takes about two minutes; `seed` waits for it.
- **Not done here:** a refund of a WAWU purchase through a Hub route (paid DM, ticket): the refund proved is Nuvion reversing a transfer. The stand-in's book transfers settle as `successful` only; `fire --settle` can fail or reverse one.
- **Checks:** `tsc --noEmit` EXIT 0; `python3 scripts/gates/run.py` passed (0 fail); eslint does not cover `scripts/` (its `lint` script is `{src,apps,libs,test}/**/*.ts`; the existing `block-net.cjs` gives the same "not found by the project service" error), so no eslint run on the new files.
- **After the run:** `down` stopped Hub, stand-in and mock, closed 7790, 7796, 7797 and dropped `stack_nuv_wawu_hub_test`; nothing of mine listens on 7790-7797.

## Verifier report

_Not started._
