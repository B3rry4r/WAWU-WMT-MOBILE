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

## Verifier report

Lean verifier (T2 check), Sonnet, 25 Oct 2026. Backend `origin/main` `dcee8af`. A fresh stack `vun3`, ports 8960-8967 (Hub 8960, stand-in 8966, mock 8967), scratch in the verifier's own folder. Verdict: **PASS** (status `review`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `tsc --noEmit` EXIT 0; `gates/run.py` EXIT 0 (1977 files scanned, 0 fail, 138 warn, 88 accepted); `check_baseline.py` EXIT 0; the diff of `432f017` is scripts and README only |
| V2 | passed | The capability checks below, through the Hub's real routes (no injected token: the mock WAWU ID's own register) |

Capability checks:
- Fresh stack on its own ports: `up` EXIT 0 in 180 s; `status` printed `provider  nuvion (stand-in on :8966)` and the 3 services; the Hub log has `Nuvion adapter ready (sandbox)`. `down` stopped the 3 pids, `ports closed: 8960 8966 8967`, dropped the stack database, a later `status` says not running; `lsof` on 8960-8967 empty. A range too small for the stand-in is refused before anything is created.
- `nuvion-tool.cjs seed`: EXIT 0 (about 2 minutes): approved wallet, account number (last 4 `1250`), PIN 4829, balance `{"hub":5000000,"standin":5000000}`.
- WAWU Credits `starter` from the wallet (`GET /credits/purchase/wallet/quote`, `POST /credits/purchase/wallet` with PIN and Idempotency-Key): 201 `paid`; the same key and body again: 201 `Idempotent-Replayed: true`, one debit only. Hub 4895000 to 4845000, stand-in the same; `GET /credits` shows 50.
- Bank send: name check on GTB resolved by the stand-in; fee quote 100000 + 2500 + 2500 = 105000; `POST /money/transfers/bank` 201 `pending`, later `completed`. Hub 4895000, stand-in 4895000 (match).
- `fire --settle <stand-in transfer id> --status reversed`: the Hub's transfer reads `reversed`, `returnedKobo 102500`, `keptKobo 2500`; Hub 4947500, stand-in 4947500 (match).
- Hub log (1222 lines): 0 hits for `127.0.0.1:1/api/dev`, 0 for `fintavapay`, 0 for `block-net] refused`, and no Fintava line other than the Nest module-load lines. `nuvion-redirect.cjs` rewrites only `api.nuvion.dev` to 127.0.0.1; the production host is not rewritten.

Findings:
- `defect` low (docs): `fire --settle` needs the STAND-IN's transfer id (from `fire --state`, the transfer whose `unique_reference` is the Hub's transfer `reference`). The Hub's own transfer id, the one `POST /money/transfers/bank` returns and the builder report implies ("on that send"), answers `Resource does not exist` (repro: `fire --name <n> --settle <Hub transfer id> --status reversed`, then `--state`). The tool's header (`scripts/dev/nuvion-tool.cjs:13-15`) and the README ("Nuvion on the stack") say only `<transfer id>`. One line in each fixes it.
- `defect` low (cosmetic): the too-small-range message has a stray comma, "Needed: hub 8960,, the Nuvion stand-in" (`scripts/dev/stack.sh:244`).
- Note, not a finding: the Hub logged `NuvionClient list webhooks: refused HTTP 404` once at start (the stand-in has no list route); webhooks arrive by the signed POST and all 3 flows settled.
