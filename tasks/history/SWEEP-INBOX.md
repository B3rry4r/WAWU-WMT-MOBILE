# SWEEP-INBOX · round history

Moved out of [tasks/SWEEP-INBOX.md](../SWEEP-INBOX.md) word for word, oldest first. The current state is in that file.

## Builder report

Fixed 9 (INBOX-05 34; INBOX-21 R2-1, R2-2; INBOX-12 4, R2-1, R2-2; INBOX-16 F3 as a gap note; HOME-16 F1; INBOX-20 L1), ruled no 11, waiting 0.
- Decision made here: INBOX-12 finding 4 shows the saved off-list reply time as an extra tab.
- Gap rows added: G-INBOX-16-1, G-INBOX-16-2, and the forced-end case in G-268 (b).
- A SHARED-CHANGES row applied: INBOX-13 #3 (`MediaCard` `bare`).
- Checks run (EXIT 0 unless noted): mobile `tsc --noEmit`, eslint on every changed file, `npm run gates` and `check_baseline`; jest of every touched area (communities 140, push 60, paid-messages 45, door 103, buyTickets 22, organiser 21) and a wider run of chat, credits, events, schools, legal, money-attempt and auth-signup (40 suites, 799 tests); backend `tsc`, eslint on changed files (warnings only, none new), gates, the earn spec (29) and the TGIF spec (19), the protected suite (253 of 253, on a seeded test database); wawu-id `tsc`, eslint, prettier and `deletion-window.spec.ts` (28 of 28) against a local Postgres.
- Fail-before runs were made by putting the old file back for one run (no stash).
- Test databases `w4b_test_wawu_id` and `w4b_test_wawu_hub_test`, mock WAWU ID on 7841; all removed or stopped at hand-back.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

