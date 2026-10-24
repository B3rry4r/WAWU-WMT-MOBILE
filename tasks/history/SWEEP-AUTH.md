# SWEEP-AUTH · round history

Moved out of [tasks/SWEEP-AUTH.md](../SWEEP-AUTH.md) word for word, oldest first. The current state is in that file.

## Builder report

Fixed 4 (AUTH-07 N-2, N-3; SETTINGS-08 L1, L2), ruled no 2 (CHECK-1 F-6, F-8), waiting 0.
- Test N-1 in `auth-signup.test.tsx` pinned the old last-writer-wins answer; its one assertion now expects the latest ask's answer, because the row changes that behaviour.
- Checks run (EXIT 0 unless noted): mobile `tsc --noEmit`, eslint on every changed file, `npm run gates` and `check_baseline`; jest of every touched area (communities 140, push 60, paid-messages 45, door 103, buyTickets 22, organiser 21) and a wider run of chat, credits, events, schools, legal, money-attempt and auth-signup (40 suites, 799 tests); backend `tsc`, eslint on changed files (warnings only, none new), gates, the earn spec (29) and the TGIF spec (19), the protected suite (253 of 253, on a seeded test database); wawu-id `tsc`, eslint, prettier and `deletion-window.spec.ts` (28 of 28) against a local Postgres.
- Fail-before runs were made by putting the old file back for one run (no stash).
- Test databases `w4b_test_wawu_id` and `w4b_test_wawu_hub_test`, mock WAWU ID on 7841; all removed or stopped at hand-back.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

