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
- **Merged (lead, 11 Nov 2026):** the lead's re-cut (M1 provider filter in the query, M2 a CAC application awaiting payment refuses) accepted on the lead's diff read (27 lines, WORKFLOW section 5). Hub PR #263 merged as ced17eb7 (contract regenerated for schema order; all 18 checks green on 7dfd5cf8); on the server since 12:46 UTC. The owner runs the command (two accounts).
- **Status:** review. The lead's re-cut (M1, M2) was accepted on the lead's diff read (merged, above). Hub `wmt/OPS-DEL-TEST` at 2546bf13. Not run on the server.
- **Closed:** M1 (the provider test is in the query, so `take` cannot hide a row of another provider) and M2 (a CAC application at `awaiting_payment` refuses). Both have a spec.
- **Next:** the owner runs the commands (two accounts). Full account and account-purge suites ran green in GitHub's PR run. The one low goes to SWEEP-1111 (D1).

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
