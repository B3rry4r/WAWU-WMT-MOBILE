---
id: OPS-DEL-TEST
title: Delete one test account that holds test wallet money, on the owner's word
owner: YOU
area: OPS
order: 383
priority: after-launch
repo: wawu-backend
type: ops
status: building
depends_on: []
decisions: [R-17, R-130]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-DEL-TEST · Delete one test account that holds test wallet money, on the owner's word

## Current state

As of 11 Nov 2026.
- **Status:** building. Round 2 verifier (T2) says FIX: 2 medium findings, both small. Hub branch `wmt/OPS-DEL-TEST` at d4d76123 is the code checked. Not run on the server. Full report: [history](history/OPS-DEL-TEST.md), "Round 2 Verifier report".
- **Closed:** round 1's B1. One account per Flutterwave table (LegalRequest, WaitlistRegistration, ServiceApplication with amountPaid), StorePurchase, StoreSubscription, CreditSpendEarning, ledger of another provider and CreditsState all list in the dry run and refuse in apply, with every table unchanged; R-130 holds (seller and buyer both refused); the schema walk fails on 9f054474's list (68 unclassified) and passes on d4d76123's; the classification of the 9 named tables is right; the wallet-provider tables with a `provider` column cannot let another provider's row through; sandbox proof, phrase, no waiver flag, rerun after a cut-off are unchanged.
- **Open (both block):**
  - **M1** `scripts/ops/real-money-rows.ts:434` `take: 100` then a JS provider test: with more than 100 rows of the running provider (3000 tried, `FintavaLedgerEntry`) and one of the other provider, the dry run says `Real-money rows: none`. Fix: provider test in the query (NOT `rowsOf(running)`), `take` only for the printout, spec with over 100 rows.
  - **M2** `real-money-rows.ts:215-222` a CAC `ServiceApplication` at `awaiting_payment` has a Flutterwave charge started and `amountPaid` null, so it is not refused. Fix: `OR [amountPaid not null, status awaiting_payment]`, spec case.
- **Lows (not a round):** widen the walk's name pattern (`ref|purchase|payout|settled|cost|total|charge|currency`) and classify EventPass, PersonBilling, PointLot, PointLedger, PointHold, CommunityMessage; any StoreSubscription refuses for good.
- **NOT RUN:** full account and account-purge suites (GitHub's PR run).
- **Next:** a builder fixes M1 and M2 (the lead decides whether that is a third round), then a short re-check of those two.

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

Current commands (round 1). The deploy's `nest build` compiles `scripts/` into `dist/scripts/`. The WAWU ID database string is read without typing it into the shell and without putting it in the shell's history: it is loaded from WAWU ID's own env file inside a subshell, so it never reaches the parent shell. WAWU ID's own `DATABASE_URL` is used; the script opens it read only (`default_transaction_read_only`). If the owner prefers a separate read-only login, use the `read -rs` form below.

Both env files define `DATABASE_URL`, and the Hub's must win for the Hub, so WAWU ID's value is copied into its own name first and the Hub's file is loaded second:
```
cd /srv/wawu/hub-api
# 1. dry run, writes nothing, prints the confirmation phrase:
( set -a; . /etc/wawu/wawu-id.env; WAWU_ID_DATABASE_URL="$DATABASE_URL"; unset DATABASE_URL; . /etc/wawu/hub-api.env; set +a
  node dist/scripts/ops/delete-test-account.js --email 'THE-TEST-EMAIL' )
# 2. apply, only after reading the dry run (use the phrase it printed):
( set -a; . /etc/wawu/wawu-id.env; WAWU_ID_DATABASE_URL="$DATABASE_URL"; unset DATABASE_URL; . /etc/wawu/hub-api.env; set +a
  node dist/scripts/ops/delete-test-account.js --email 'THE-TEST-EMAIL' --apply --confirm 'DELETE THE-PHRASE' )
```
Or, with no env file for WAWU ID: `read -rs -p 'WAWU ID read-only db url: ' U; echo` then `( set -a; . /etc/wawu/hub-api.env; set +a; WAWU_ID_DATABASE_URL="$U" node dist/scripts/ops/delete-test-account.js ... )`.

There is no flag that waives a blocker or a real-money row (`--allow-test-holds` is gone and is refused as an unknown option). Exit 0 is done or nothing to do, 1 refused (nothing changed), 2 stopped part way (run the same command again).

**Known limits.**
- **900 s token window.** The access token the account held before the deletion keeps working on the Hub for its life (900 s, `GET /users/me` answers 200 for up to that long). Refresh, sign-in and the refresh tokens are gone at once. An app deletion has the same window.
- The sandbox proof is the provider's host; a live key on the sandbox host is not detectable by the script (the balance read would fail and the script would refuse).
- A test account that sold a piece or bought anything through the website (Flutterwave) is refused, so this script cannot delete it. That is the ruling (11 Nov), not a gap.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OPS-DEL-TEST.md](history/OPS-DEL-TEST.md).

## Owner sign-off
