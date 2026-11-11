---
id: OPS-DEL-TEST
title: Delete one test account that holds test wallet money, on the owner's word
owner: YOU
area: OPS
order: 383
priority: after-launch
repo: wawu-backend
type: ops
status: review
depends_on: []
decisions: [R-17, R-130]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-DEL-TEST · Delete one test account that holds test wallet money, on the owner's word

## Current state

As of 11 Nov 2026.
- **Status:** built, waiting for a T2 verifier. Builder branch `wmt/OPS-DEL-TEST` on wawu-backend (off main bf3f4a3b). The cut notes and facts are in [tasks/history/OPS-DEL-TEST.md](history/OPS-DEL-TEST.md).
- **Not run on the server.** It runs only once this is merged and deployed, and then by the owner.
- **Next:** the T2 verifier, then merge and deploy, then the owner runs the two commands in the Builder report.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-17 (wallet empty before deletion), R-130 (a piece's buyers keep it), R-6 and R-11
- wawu-backend: `src/account/` (deletion, identity and money services), `src/account-purge/` (purge, data map, purge files), `src/wallet-provider/`, and the README sections on the account deletion sweep and the admin surface

## Goal

One command the owner runs on the live server. It deletes exactly one named test account now, and it cannot be used on an account that holds real money.

## Scope

- **The script.** `scripts/ops/delete-test-account.ts`, run like the other scripts under `scripts/`. It takes the account's email as an argument. Never write an email, name or id into the repo. It has two modes:
  - **Dry run (the default).** It writes nothing and prints what apply would do: the WAWU ID user and the Hub ids it would remove, the provider and its mode, the provider's balance, every deletion blocker and how it would be treated, and the counts it would purge (pieces, purchases by others, messages, files).
  - **Apply.** It runs only with `--apply` and the exact confirmation phrase the dry run prints for that account (for example `DELETE <handle>`).
- **Refusals.** The script refuses unless all of these hold:
  - exactly one account matches the email;
  - the server's wallet provider runs on TEST or sandbox credentials, proven from the provider adapter's own config, never from a guess;
  - the account is not an admin. Admin logins are separate, so this is only a belt-and-braces check.
  
  It also refuses any blocker other than the test wallet's balance (an open hold, waiting earnings, a payment in flight), unless `--allow-test-holds` is passed. The dry run lists every blocker it found.
- **Apply, step by step.**
  - Runs the same steps the app's deletion and the purge run, with the money blockers waived for the test balance only, and no 30-day grace.
  - Deletes or scrubs the identity in WAWU ID through the Hub's own identity client, exactly as the purge does. Say whether the email can then be used to sign up again.
  - Keeps R-130: pieces other people bought stay with the buyers.
  - Writes an audit record of what it did.
  - Prints a summary.
  - Running it twice is safe: the second run finds nothing to do.
- **Untouched.** Nothing else in the database changes. No schema change and no new route.

## Capability checks

- [ ] A dry run on a copy of the live schema lists the account, its test balance and every blocker, and writes nothing (compare row counts before and after).
- [ ] Apply deletes that one account and nothing else (row counts of every table before and after; another account with the same name or a similar email is untouched).
- [ ] Each refusal is shown: an account with real-money credentials, two matches, a missing confirmation phrase, a wrong phrase, and an open hold without the flag.
- [ ] The WAWU ID side ends the same as an app deletion after its grace. The email's re-use is stated.

## Builder report

**Files (wawu-backend `wmt/OPS-DEL-TEST`):** `scripts/ops/delete-test-account.ts` (new); `src/account/account-deletion-sweep.service.ts` (one added method, `purgeNow(id)`, which runs the sweep's own `purgeOne` for one account; nothing else in that file changed); `src/account/tests/ops-delete-test-account.contract.spec.ts` (new, 8 cases). No schema change, no new route, no fenced file, no `SHARED-CHANGES.md` row.

**The command the owner runs on the server** (only after this is merged and deployed; the deploy's `nest build` already compiles `scripts/` into `dist/scripts/`):

```
cd /srv/wawu/hub-api
set -a; . /etc/wawu/hub-api.env; set +a
export WAWU_ID_DATABASE_URL='<a read-only connection string for the WAWU ID database>'
# 1. dry run, writes nothing, prints the confirmation phrase:
node dist/scripts/ops/delete-test-account.js --email '<the test account email>'
# 2. apply, only after reading the dry run:
node dist/scripts/ops/delete-test-account.js --email '<the test account email>' --apply --confirm 'DELETE <the phrase the dry run printed>'
```
Add `--allow-test-holds` to either only if the dry run lists a blocker other than the wallet balance and the owner says that is test money too. Exit 0 is done or nothing to do, 1 refused (nothing changed), 2 stopped part way (run the same command again).

**One thing the owner must supply.** The Hub keeps no email, and WAWU ID has no route that finds a user by email. So the script reads WAWU ID's `wawu_users` table, read only (`SET default_transaction_read_only`), through `WAWU_ID_DATABASE_URL`. It is used only to turn the email into the user id. Every write to WAWU ID goes through the Hub's own client (mark-deletion, then anonymise). If the owner would rather not hand the Hub box that connection string, the alternative is a small WAWU ID internal route (another repo, another task).

**What it refuses** (each prints `REFUSED: ...` and `Nothing was changed.`, exit 1): the provider not proven to be on sandbox; zero matches is not a refusal but "Nothing to do"; two or more matches; an email that is an `AdminUser` login (case-insensitive); a blocker other than `wallet_balance` without `--allow-test-holds`; `--apply` without `--confirm`; a wrong phrase. The phrase is `DELETE ` plus the first 8 characters of the WAWU ID user id (stable before and after a half-finished run).

**How the sandbox proof works.** It calls the provider adapters' own settings readers on the same environment the Hub boots with. `WALLET_PROVIDER` picks the provider through `readWalletProviderName`. Nuvion: `readNuvionSettings` must say the environment is `sandbox`, which it does only when `NUVION_BASE_URL` is exactly `https://api.nuvion.dev` (`https://api.nuvion.co` reads as production and any other value is a config error). Fintava: `readFintavaSettings` must say `sandbox`, that is `FINTAVA_BASE_URL` on `dev.fintavapay.com` (`live.fintavapay.com`, a local address or no setting in production all refuse). It prints the key name that proves it, never an address or a key, and reads no API key. It runs before the database or the provider is touched. Limit: the proof is the host; a key from the wrong environment on the sandbox host is not detectable here.

**What apply does**, reusing the app's services: `AccountDeletionMoneyService.check` (balance and blockers, read live from the provider; `wallet_balance` waived, others waived only with the flag); writes the `AccountDeletion` row at `purging` with `purgeAfter` one second after `scheduledAt` (the table requires it to be later), reason `ops_delete_test_account`, so no 30 days; `AccountDeletionIdentityService.tell` (WAWU ID mark-deletion, must confirm before any purge); then `AccountDeletionSweepService.purgeNow`: the sweep's own steps (wallet frozen by the row, held points released, `AccountPurgeService.purge`, the "account deleted" email, WAWU ID anonymise, row `purged`). The test balance stays at the provider in a frozen wallet; nothing is moved. The audit record is that `AccountDeletion` row (it is kept by the purge, with the purge note) plus the printed Audit line. The row write is the only logic the script holds itself (the app writes the same row in a private method that also demands an empty wallet).

**Proof on a local stack** (`stack.sh up --name odt_test --ports 16600-16609 --with id`: real WAWU ID on a throwaway database, Nuvion stand-in, databases `odt_test_*` on 127.0.0.1:14001). Seeded: A (Nuvion test wallet with 5,000,000 kobo, two pieces, one bought by D), B (same display name, email one character different from A's), C (an open hold), D (the buyer).
- Dry run on A: printed the user, wallet and balance, blockers (`wallet_balance: waived`), counts (2 pieces, 1 bought by others) and the phrase. Row counts of all 252 Hub tables and 17 WAWU ID tables before and after: identical.
- Refusals, each with every Hub table identical afterwards: provider switched to the production Nuvion host; two matches (a second WAWU ID row with the email in capitals); `--apply` with no phrase; a wrong phrase; C without the flag (`open_hold: REFUSES`).
- Apply on A: `Outcome: purged`. Tables that changed (before, after): AccountDeletion 0 to 1, AccountDeletionContent 0 to 1, ContentPiece 3 to 2, FintavaWallet 1 to 0, Notification 4 to 3, NotificationTarget 4 to 3, TgifDailyNotice 4 to 3, UserProfile 4 to 3; no other table changed, and no WAWU ID table changed in row count. B, C and D are untouched. R-130: "A piece sold" stays (hidden, creator set to the deleted-creator id) and D's purchase still points at it; the unsold piece is gone.
- WAWU ID side: A's row is kept and anonymised (email and names null, phone `deleted:<id>`, status `banned`), the same as the sweep's `?mode=anonymize`. **A's email can sign up again**: the email column is cleared, so the unique value is free (the new sign-up gets a new user id).
- Second apply: `Nothing to do: no account has this email`, exit 0, all tables identical. A run that stopped because WAWU ID was down is finished by running it again (spec).
- One log line of the local run: the "account deleted" email was not sent (`WAWU ID answered 503`: the stack's WAWU ID has no mail provider). The purge goes on, as the sweep does. On the server the owner's test address will get that email.

**Checks (each to its EXIT):**
- `NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit`: EXIT 0
- eslint on the three changed files: EXIT 0
- `python3 scripts/gates/run.py`: EXIT 0 (0 fail, 139 warn, 88 accepted); `python3 scripts/gates/check_baseline.py`: EXIT 0
- `jest --runInBand src/account/tests/ops-delete-test-account.contract.spec.ts` on a fresh database: 8 of 8, EXIT 0
- `jest --runInBand src/account src/account-purge` on a fresh database: 29 suites, 388 tests, EXIT 0 (run with the stack's mock WAWU ID as the `test:contract` environment)

**Not done / for the verifier:** nothing run on the server or against a real provider. Look at: `purgeNow` is the only edit to existing code; the script writes one `AccountDeletion` row itself; the email lookup needs the WAWU ID database string (above); the proof is the host only.

## Verifier report

## Owner sign-off
