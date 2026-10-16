# SETTINGS-06 · round history

Moved out of [tasks/SETTINGS-06.md](../SETTINGS-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/SETTINGS-06`: src/account/ (`account.service.ts`, `account.controller.ts`, `account.module.ts`, new `account-deletion-money.service.ts`, `account-deletion-sweep.service.ts`, `account-deletion-config.ts`, `dto/account-deletion.dto.ts`), `src/wallet-provider/wallet-provider.interface.ts` (optional `freezeWallet`/`unfreezeWallet`, `ProviderWalletState`), `src/fintava/fintava-wallet-provider.ts`, `src/push/push-token.service.ts` (`resumeAccount`), `src/account-purge/account-data-map.ts`, `src/data-export-request/data-export-sections.ts`, `prisma/schema.prisma` + migration `20261022050000_account_deletion`, `contract/openapi.json`, `docs/contract/CONVENTIONS.md` section 22. Mobile: this file, SHARED-CHANGES, BACKEND_GAPS.
Checks (new spec `src/account/tests/account-deletion.contract.spec.ts`, 19 tests, real AccountModule, real database, the real Fintava adapter over a socket to FintavaDouble, real RS256 tokens from the mock WAWU ID):
- Empty wallet first: refused with the provider balance, over HTTP in the one error shape, for a hold (payer and payee), waiting earnings, an unsettled payment, all reasons at once; allowed once settled; 503 and nothing changed when the provider is down; money arriving between the look and the freeze unfreezes and refuses.
- Cancel within 30 days: wallet unfrozen, exactly the hidden pieces back (a piece already removed stays removed), push resumed, cancel idempotent, a failed unfreeze changes nothing, over HTTP with the person's token, deleting again later starts a new 30 days.
- Purge: nothing before the date; after it the Hub's data is gone and WAWU ID asked; a deleted person has no points lots, holds or ledger rows (an AI-job hold released first) and another person's are untouched; money found at the end keeps the account with the reason; a WAWU ID outage is retried next pass; a cancelled deletion is never touched.
Local: `tsc --noEmit` EXIT 0; account, account-purge, wallet-provider, money/tests specs pass (the push-token INBOX-03 notification test failed locally and passed in CI); eslint clean on my lines; data-export-map spec passes after one exclusion.
CI on backend `wmt/SETTINGS-06` @ 469cb5c: three suite shards, contract, protected routes, baseline, netns green (check runs 116972926796, 116972926848, 116972926630, 116972841739, 116972841059); gates 116972841110 show the same 16 FAIL lines as main, none in these files. The first push (a7be7da) failed one spec, the data-export drift guard, fixed in 469cb5c.
Gate counts: no gate or baseline touched. Gaps: G-10 note only. Shared changes: #1, #2 (open).
Not done: the delete-account screen and WAWU ID's half (SETTINGS-08); a freeze under Nuvion (no Nuvion freeze call is built).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

