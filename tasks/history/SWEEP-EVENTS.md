# SWEEP-EVENTS · round history

Moved out of [tasks/SWEEP-EVENTS.md](../SWEEP-EVENTS.md) word for word, oldest first. The current state is in that file.

## Builder report

Fixed 3 (EVENTS-09 N2; EVENTS-06 L1; EVENTS-08 L1), ruled no 7, waiting 2 (EVENTS-11 O7, O8).
- For the lead: EVENTS-07 R3-1 (host-erase widening) is left because its only harness is Fintava-named; EVENTS-06 L3 waits on the shared `amountJoiner` prop.
- Checks run (EXIT 0 unless noted): mobile `tsc --noEmit`, eslint on every changed file, `npm run gates` and `check_baseline`; jest of every touched area (communities 140, push 60, paid-messages 45, door 103, buyTickets 22, organiser 21) and a wider run of chat, credits, events, schools, legal, money-attempt and auth-signup (40 suites, 799 tests); backend `tsc`, eslint on changed files (warnings only, none new), gates, the earn spec (29) and the TGIF spec (19), the protected suite (253 of 253, on a seeded test database); wawu-id `tsc`, eslint, prettier and `deletion-window.spec.ts` (28 of 28) against a local Postgres.
- Fail-before runs were made by putting the old file back for one run (no stash).
- Test databases `w4b_test_wawu_id` and `w4b_test_wawu_hub_test`, mock WAWU ID on 7841; all removed or stopped at hand-back.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

