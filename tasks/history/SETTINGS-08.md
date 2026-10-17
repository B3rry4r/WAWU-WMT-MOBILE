# SETTINGS-08 · round history

Moved out of [tasks/SETTINGS-08.md](../SETTINGS-08.md) word for word, oldest first. The current state is in that file.

## Builder report

Files (wawu-id): `prisma/schema.prisma`, migration `20261017120000_deletion_window`, `src/auth/deletion-window.ts` (rules and messages), `deletion-window.service.ts` (mark, claim, record), `hub-account.client.ts` (the one Hub call, no default host), `dto/mark-deletion.dto.ts`, edits to `auth.service.ts`, `tokens.service.ts`, `session-reader.ts`, `internal.controller.ts`, `auth.controller.ts`, `contract/openapi.json` (login refusals only), docs `WAWUAfrica_API_Contracts.md`, `deploy/ENV.md`.

Checks (EXIT lines in the builder's scratchpad `settings-08-b/`):
- New spec `src/auth/deletion-window.spec.ts`, 27 cases on a real Postgres and a fake Hub over HTTP: 27 of 27, twice in a row. Mutants of my own, all killed: claim never busy, anonymise guard removed, token cut-off removed, end date ignored, date moved by a repeat mark, claim check at record removed.
- `src/auth` 31 suites, 539 tests, EXIT 0. `src/contract` 5 of 5. `npx tsc --noEmit` EXIT 0. Gates: 0 fail (22 warn, all older). The changed files add no lint error (the two left in `tokens.service.ts` and the two in `internal.controller.ts` are on older lines).
- Real pair, `stack.sh` name `s08_test`, ports 7760-7767, Hub (Nuvion stand-in) plus this wawu-id: Hub `DELETE /account` gave pending in WAWU ID with a 30 day window equal to the Hub's; a sign-in made WAWU ID active and the Hub row `cancelled`; a second delete then sign-in after the window gave 403 period ended with the Hub still `scheduled`; with the Hub row `purging` the 403 carried the Hub's sentence; three sign-ins together gave three 200 and one cancelled row. Stack down, databases dropped.

Attacks: delete asked twice (dates and sessions unchanged); sign-in during the window cancels once and the Hub is told once (2 and 5 parallel); day 30 runs once with two workers (one scrub counted by a trigger); a token from before the delete stays dead, also after a cancel; the email routes (ditto, unpaid, money check) send nothing to a deleted or deleting account; a ban is never lifted; nothing of another account changes (row, sessions, window compared before and after).

Not done: the data-export route (FIX-53) is not on this base, so only the merge tripwire covers it. No mobile screen (the delete-account screen is another task). V10 device NOT RUN.

### Builder report: the Hub half (backend @ 4491120, G-SETTINGS-08-1)

- **Code (wawu-backend `src/account/`):** `AccountDeletionIdentityService` (new) makes the one mark-deletion call with the row's `purgeAfter` and records the answer on `AccountDeletion` (`identityMarkedAt`, `identityMarkAttempts`, `identityMarkNextAt`); it matches the row by `purgeAfter`, so an answer to an earlier deletion never confirms a later one. Failures wait 5 min doubling to 6 h. Nothing is held across the call; the client call has a 10 s timeout. The hourly sweep asks again first (a claim keeps two servers off one row; three failures in a row end the ask), then purges. A due row WAWU ID has not confirmed waits: `purgeBlockedBy = identity_unconfirmed`, a warning, `identityUnconfirmed` in the pass result; the claim to `purging` names `identityMarkedAt` too. A new request after a cancel resets the confirmation.
- **Checks (builder scratchpad `settings-08-b/`):** `npx tsc --noEmit` EXIT 0; eslint on the changed files, no error added; migration applied to a fresh database, no schema drift on the new columns. Nuvion specs `account.contract`, `zz-v2-nuvion`, `zz-v3-nuvion` and the new `account-deletion-identity.contract` (9 cases: sent and equal, failing then recovering with the growing wait, the purge waiting then purging, the claim refusing, takeover reset, outage stop, two passes at once): 4 suites, 26 of 26, EXIT 0. The Fintava-harness account specs were not run (rule); CI runs them.
- **Spec changes (ruling-driven):** two pinned call arguments gained `purgeAfter`: `account.contract.spec.ts` (the date equals the answer) and `account-deletion.contract.spec.ts` (`[id, any Date]`). SHARED-CHANGES SETTINGS-08 #1.
- **Rows already `scheduled` before this ships** have no confirmation: the first pass asks WAWU ID for each (idempotent there) before any is purged. A row already `purging` is asked too, and waits if WAWU ID is down.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

