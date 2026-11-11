---
id: OPS-DEL-TEST
title: Delete one test account that holds test wallet money, on the owner's word
owner: YOU
area: OPS
order: 383
priority: after-launch
repo: wawu-backend
type: ops
status: todo
depends_on: []
decisions: [R-17, R-130]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-DEL-TEST · Delete one test account that holds test wallet money, on the owner's word

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from the owner's ask (11 Nov, about 08:48 UTC by the owner's phone). The owner asked to delete their own test account, which holds test wallet money: "we are not wiping the database but deleting just this test account... in fact just this my own". The app cannot delete it, because R-17 refuses deletion while the wallet holds money, and the money is sandbox money that cannot be withdrawn.
- **Facts checked by the lead:**
  - The Hub has no admin delete.
  - `DELETE /account` waits `DELETION_GRACE_DAYS` (30) and then `AccountPurgeService.purge(wawuUserId)` runs.
  - The deletion blockers are in `src/account/account-deletion-money.service.ts`.
  - Admin dashboard logins are their own `AdminUser` rows (README, "Admin surface"), so deleting an app account never touches an admin login.
  - The live server's wallet provider is Nuvion on its TEST keys (the owner switches to live keys themselves).
- **Next:** a builder on wawu-backend `wmt/OPS-DEL-TEST`, then a T2 verifier. The owner then runs the script on the server themselves.

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

## Verifier report

## Owner sign-off
