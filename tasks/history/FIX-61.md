# FIX-61 · round history

Moved out of [tasks/FIX-61.md](../FIX-61.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: the four above; no `src/` product file.
Checks (Nuvion only, no Fintava spec run): tsc EXIT 0; eslint on the four files EXIT 0; prettier ok. Eleven specs (the five-case unit spec, `earning-daily-move`, `earning-sweep-start`, `host-share`, `legal-fee-wallet`, `tip-wallet`, `paid-dm-wallet`, `unlock-wallet`, `event-host-payout`, `earning-settlement-nuvion`, `nuvion-earnings`): 78 of 78, EXIT 0. Protected suite 253 of 253, EXIT 0. Gates passed (0 fail, 128 warn, 88 accepted), baseline ok.
Before: `FIX61_NOW=2026-10-17T22:13:00Z` (Date only, timers real, a jest setup file kept outside the repo) fails line 731; the rows above show the window.
Not done: the date-faking repro is not committed (a faked Date and the database's own `now()` disagree for specs that read both, `host-share` among them), so the committed proof is the pure rule plus the spec call.
No gap filed; no shared-change row (test files only).

## Verifier report

