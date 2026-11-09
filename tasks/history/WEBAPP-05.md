# WEBAPP-05 · round history

Moved out of [tasks/WEBAPP-05.md](../WEBAPP-05.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/components/pin-sheet/useKeypadKeys.ts` (new), `Keypad.tsx`, `src/components/amount-entry/AmountKeypad.tsx`, `src/features/send/AmountScreen.tsx` (Enter = Continue), `src/features/open-wallet/api/hostedPage.ts` (new), `liveness.ts`, `HostedSelfieScreen.tsx`. The two keypad files are in the fenced `src/components/**` but the ticket's scope names them; no shared-change row.
- Keys: only the keypad mounted last listens (a screen left open under a sheet hears nothing); it takes every digit, Backspace, Delete and Enter and Space (so a button left focused behind the sheet is never pressed; that button is blurred when the keypad opens) even while locked or checking, and ignores Ctrl/Alt/Meta keys and a held key. The amount keypad leaves a focused text field (the note) its own keys. No input element exists, so the PIN is never in the DOM; nothing is logged.
- Tests: `src/components/pin-sheet/__tests__/laptopKeys.test.tsx` (8: type 1234 submits once with 1234; held key and a fifth digit; wrong PIN five times locks and later keys are swallowed; focus; PIN not in the tree or console; a sheet over a keypad; amount keys; no listener on android) and one case in `hostedSelfie.test.tsx` (web: same tab, `https://usewmt.com/selfie`, no Linking).
- Stack proof (real Hub, Nuvion stand-in): wrong PIN x5 -> 403 pin_incorrect (4,3,2,1 left) then 423 pin_locked on the fifth; the right PIN afterwards is still 423; balance unchanged (5,000,000 kobo). In a real Chromium on the stack web export, typing 4829 on the keyboard filled the dots and paid.
- Checks: tsc EXIT 0; eslint on 24 changed files EXIT 0; gates 0 fail; jest of 77 suites in the touched areas EXIT 0 (1192 passed, 5 skipped); laptopKeys 8 passed; hostedSelfie 38 passed.
- Gaps: none filed; no Hub change.

- Pictures: 40 of 40 taken (10 states x dark and light x 390 and 1440) on the stack web export, into /tmp/wmt-shots/webapp05/ (no artboard exists for these states: the tasks list none, so there is no picture beside an artboard; the pay sheet is the shared one). Money proofs: /tmp/wmt-shots/webapp05/money-proofs.txt.

## Verifier report

