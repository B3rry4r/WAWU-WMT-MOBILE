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

*T2 verifier, 10 Nov 2026, Hub `wmt/CARD-FEE-HISTORY` `ef56ba3` on `main` `7dd5b22`. Stack `cfv` (Nuvion stand-in, ports 16120 to 16139), databases `cfv_*`, no real provider.*

**Verdict: FIX (one medium, the words on the issuer row). Money path holds: amounts, once-only, history equals balance with both fees above zero.**

| # | Attack | Result |
|---|---|---|
| 1 | V8, both fees above zero (`NUVION_FEE_CARD_CREATE` 65,772, `WAWU_FEE_CARD_KOBO` 10,000) | Funded 5,000,000. Card 1: out 65,772 `-issuer`, out 10,000 `-wawu`. After two cards the history sums to 4,848,456, the Hub balance 4,848,456, the stand-in 4,848,456. Nothing is counted twice: WAWU's fee transfer writes the merchant side only (`in` 10,000 on WAWU's account, reference `-fee`), the person's side is the new `-wawu` row alone. The `outflows.completed` for the fee transfer adds no person row. |
| 2 | Configured fee differs from the debit | Hub configured 50,000, stand-in debits 65,772: history 4,788,456 against balance 4,772,684, off by 15,772 (the row uses the configured fee). `npm run money:check -- --again` notices: verdict `differences`, `balance_differs` 4,788,456 kobo (ledger base against provider balance). Nothing else notices, nothing corrects. `ProviderCard` carries no fee and the stand-in sends no event for it, so the Hub cannot read the real debit. Live: a wrong `NUVION_FEE_CARD_CREATE` overstates or understates every card's row by the gap until the nightly check flags it. 65,772 is what dev measured (R-124). |
| 3 | Atomic and once | One card, one `-issuer`, one `-wawu`, one debit each time: replay with one key (200, same card), three parallel requests with one key (one 200, two 409 `idempotency_in_progress`), `cards.created` re-sent twice after the API answer (no new row), a row in `unknown` adopted by `cards.created` sent twice (one `-issuer` 65,772). Refusal, provider failure and lost-answer-then-found are the builder's specs (59 of 59 pass here); I did not re-drive them on the stand-in (no failure switch). Read in code: the two adoptions race on the `state in pending` condition and `ledger.record` is idempotent on (account, direction, reference). |
| 4 | "Retried on the next read" | Found: `collectFee`, called from `GET /money/cards` and `GET /money/cards/:id`. A write on a GET, but it was already there (the provider transfer); the new row is idempotent. Four parallel reads of a card with `feeCollectedAt` unset: one `-wawu` row, no second debit. With the `-wawu` row deleted and the fee unset, two parallel reads rewrote the row once and the balance did not move (the provider answered the repeat with the original). The retried row is dated the retry. |
| 5 | Words | Row: kind `transfer` (description "Transfer"), other side `wawu` "WAWU's fee", note "Card fee", fee breakdown 0/0/0. See finding M1. |
| 6 | Additive and protected | No route or response shape changed (4 files, no migration). tsc, eslint, gates, baseline EXIT 0. Branch `src/money/cards` 59, `history` 47, `ledger` 92, `wallet-provider` 68 pass; main 50, 47, 92, 68 pass. `nuvion-cards` and `nuvion-standin-cards` specs 9 of 9 on both. Protected suite 253 of 253 on main and on the branch (needs `prisma db seed` and the suite's own mock WAWU ID; with the stack's mock and no seed 13 then 8 unrelated verification and professionals probes failed on the branch, a setup matter). `src/money/` imports nothing from `src/fintava/`. |
| 7 | Backfill proposal | The count query is right: 0 cards after the fix (rows written after the fix are found by the `-issuer` reference, no double count); with one `-issuer` reference removed it counts 1 card, 65,772 kobo. Stays NOT RUN. |

**Findings**
- **M1 (medium, words).** The issuer's fee goes to Nuvion, but the row names the other side "WAWU's fee". The owner's naming rule (DECISIONS, 16 Oct 2026, under R-10) is that the provider's part is labelled "Bank charge" and WAWU's part keeps its own label. Today a person who pays 757.72 reads two rows both called "WAWU's fee" (657.72 and 100.00) and a fee breakdown of 0. Ask the lead which words the card's two rows carry (for example the issuer row "Bank charge" with `providerFeeKobo` set, the WAWU row "WAWU's fee" with `wawuFeeKobo` set) and have the builder change `card-fee-row.ts` and the specs. The amounts and sums do not change.
- **L1 (low, config drift).** The row is the configured fee, not the debit (attack 2). Accepted by the design; the nightly check is the only catch. Say so in the runbook: change `NUVION_FEE_CARD_CREATE` only with Nuvion's change.
- **L2 (low, read in code, not run).** A card the Hub gave up on (`failed` after ten minutes) and that Nuvion made late is ignored by `cards.created` (state `failed`), so the provider debit has no row. A step 3 failure in `create` (the transaction cannot write the ledger) leaves the card `creating` and the key unfinished (409 on replay) until a list read adopts it.
- **L3 (low).** A ledger failure on the `-wawu` row now also stops `feeCollectedAt` and the merchant `in` row; the provider is asked again on every read until it writes (idempotent at the provider).
- **L4 (low).** `cards.created` for a card whose owner has no wallet row answers `wait` with no end.
- **L5 (backfill note).** The outline writes the `-wawu` row at `wawuFeeKobo`; the live row is the amount moved plus the provider's charge. Use the same figure, and the L1 caveat applies.

**NOT RUN:** the whole `npm run test:contract` in one go; the Nuvion and money folders beyond those named (the builder reported the same failures on main); a failure switch on the stand-in (refusal, provider failure, lost answer) beyond the specs; a non-zero book-transfer charge on the `-wawu` row; the backfill; any real provider. I edited rows in the throwaway stack database by SQL to build attacks 4 and 7; the stack is down and the databases dropped.
