# CARD-FEE-HISTORY · round history

Moved out of [tasks/CARD-FEE-HISTORY.md](../CARD-FEE-HISTORY.md) word for word, oldest first. The current state is in that file.

## Builder report

Hub `wmt/CARD-FEE-HISTORY` `ef56ba3` (on `origin/main` `7dd5b22`); files: `src/money/cards/card-fee-row.ts` (new), `wallet-card.service.ts`, `src/nuvion/handlers/cards.handler.ts`, `src/money/cards/tests/money-cards.contract.spec.ts` (9 new tests, a failure switch and an issuer-fee switch added to the Nuvion fake; no assertion changed). No migration.
- **Specs** (`money-cards.contract.spec.ts`, 59 of 59 pass, EXIT 0): one fee row at the debit's amount, drawn as a send's fee row; the history's sum against the stand-in balance after two cards (one with WAWU's fee); a refused issue and a failed issue leave no row and no charge (the key tried again makes one row); a replay and two parallel requests with one key make one card, one row, one charge; a lost answer found by its reference has one row; WAWU's fee is its own row, once even when the transfer is asked again; a `cards.created` delivery for a card never seen writes the row once. History and ledger specs (47 of 47) pass.
- **Stack** (`cf`, Nuvion stand-in, ports 16120 to 16138, down and databases dropped): a funded wallet (550,100 kobo), a virtual card through `POST /money/cards`: 201, replay with the same key returned the same card; the stand-in and `GET /money/wallet/balance` both 484,328; `GET /money/transactions` had one new row, out, transfer, completed, 65,772, "WAWU's fee", reference `<card>-issuer`. After a 10,000 top up the history (in 550,100 and 10,000, out 65,772) summed to 494,328, the stand-in's and the Hub's balance.
- **Gates:** tsc, eslint on changed files, `scripts/gates/run.py` (9 gates, 0 fail) and `check_baseline.py` all EXIT 0.
- **USD label:** correct, no change (Current state).
- **V3, protected routes** (`src/protected-routes`, `PROTECTED_ROUTES_ALLOW_DB` set to the throwaway database): main `7dd5b22` 253 of 253, branch `ef56ba3` 253 of 253, EXIT 0 both. The money, nuvion, wallet-provider and common test folders, run folder by folder on main and on the branch: the same result in every folder except `src/money/cards` (50, then 59 with the 9 new) and `admin-money` (one cursor test failed once on main, passed on the branch). The same failures stand on both sides, so nothing the change touches moved: `src/money/world` 38 of 88 and `src/nuvion/tests` 365 of 1,514 (plus the other nuvion folders) fail identically on main in this sandbox.
- **Not run:** the whole `npm run test:contract` in one go, on main or the branch: the machine's memory limit killed it (EXIT 137, other agents' suites share it), so the folders above stand in for it; CI runs the whole suite on the push. The nightly reconcile and a real provider: not run (stand-ins only).

### Backfill for cards issued before the fix (proposed, NOT RUN)
A card made before this change has no `<reference>-issuer` row (and, when `wawuFeeKobo` > 0 and `feeCollectedAt` is set, no `<reference>-wawu` row). Count first, read only:

```sql
SELECT count(*) AS cards, coalesce(sum(c."providerFeeKobo"),0) AS kobo
  FROM "WalletCard" c JOIN "FintavaWallet" w ON w."wawuUserId" = c."wawuUserId"
 WHERE c.provider = 'nuvion' AND c."providerCardId" IS NOT NULL AND c."providerFeeKobo" > 0
   AND NOT EXISTS (SELECT 1 FROM "FintavaLedgerReference" r WHERE r."accountNumber" = w."accountNumber"
                    AND r.direction = 'out' AND r.value = c.reference || '-issuer');
```
The same query with `c."wawuFeeKobo" > 0 AND c."feeCollectedAt" IS NOT NULL` and `'-wawu'` counts the WAWU rows. Script (one run, owner's word first, on a copy of production first): for each such card call `LedgerService.record` with `recordIssuerFeeRow` (and `recordCardFeeRow` for the WAWU row, amount `wawuFeeKobo`), `occurredAt` = the card's `createdAt`, in a transaction per card; it is idempotent because the ledger keeps one row per (account, direction, reference). Caveat to decide before running: a card made while the fee in force differed from `providerFeeKobo` is shown at the amount it was claimed with; the nightly reconcile should be run after to see no new finding.

## Verifier report

