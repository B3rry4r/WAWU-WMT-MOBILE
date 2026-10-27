# PRICE-PICKER history

## Builder round 1 (27 Oct 2026)

Picker, six screens and the tip sheet built and pushed: mobile `wmt/PRICE-PICKER` on `origin/wmt/BATCH-PRICES-APP` `4f582b0e`. See the task file, Current state.

Checks (each gated on its log's EXIT line):

- Tests, the folders I touched (community-host, create, library, paid-messages, tips, verify, events, components/__tests__, prices, plus `src/__tests__/textFieldTapBox.test.tsx`): 68 suites, 958 tests, EXIT 0. Before the screens were rewritten for the picker, the same folders had 82 failing tests (12 suites), which is the red-first run for the screens and the tip sheet. The picker's own 16 component tests and 5 model tests were written after the component.
- `npx tsc --noEmit`: EXIT 0.
- `npx eslint` on the 35 changed files: EXIT 0, no warnings.
- `npm run gates`: EXIT 0 (10 gates, 0 findings failing, baseline empty).
- `python3 scripts/tasks/check_tasks.py --write`: EXIT 0.
- Android fingerprint (`@expo/fingerprint`, platform android): 17ffb13d520882bf144982b61d03f3994c6e40e4, unchanged. `app.json` and `package.json` untouched.
- The full mobile check (`npm run check`) was not run: it runs once per batch (the merge agent).

Screenshots: web export of the committed head, 390 by 844 at 2x, Playwright Chromium. The Hub was a STAND-IN inside the screenshot harness (Playwright route answering `GET /prices` with the launch list and tips, the paid-DM settings, an event with two ticket types, and the tip quote), not the local test stack; no port was left listening. The screens were reached through a temporary route that was not committed. In `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/price-picker-b/shots/`: `1-create-price-dark.png`, `2-paid-question-price-dark.png`, `3-community-pass-price-dark.png`, `4-ticket-price-dark.png`, `5-tip-sheet-dark.png`, `6-create-price-light.png` (picked 5,000). Differences from the design page that stay: the tip button reads the wallet total with the Hub's fee ("Tip ₦2,023.25", payment unchanged) and the sheet opens on ₦2,000; no store note and no "Paid with Google Play" (not built); the paid-question screen keeps its own title and the design's free-question line is not drawn.

## Builder round 2 (27 Oct 2026)

The verifier's findings on `e2da837a` (HIGH 1, MEDIUM 2 to 4, LOW 5 to 8), each reproduced red first (22 failing tests on the first run of the new and changed tests), then fixed; see the task file, Current state. Head: mobile `wmt/PRICE-PICKER` `eed58518` plus this report.

Checks (each gated on its log's EXIT line):

- Tests, the folders I touched (community-host, create, library, paid-messages, tips, verify, events, components/__tests__, prices, textFieldTapBox): 68 suites, 972 tests, EXIT 0.
- `npx tsc --noEmit`: EXIT 0. `npx eslint` on the changed files: EXIT 0, no warnings. `npm run gates`: EXIT 0.
- `python3 scripts/tasks/check_tasks.py --write`: EXIT 0.
- Android fingerprint: 17ffb13d520882bf144982b61d03f3994c6e40e4, unchanged.

Re-shot (the screens whose look changed; same stand-in Hub inside the harness, same folder `.../price-picker-b/shots/`): `1-create-price-dark.png` and `6-create-price-light.png` (the Listing fee row is back), `3-community-pass-price-dark.png` (a price picked; with none the strip shows "Pick a price"), `5-tip-sheet-dark.png` (opens on ₦1,000). `2-paid-question-price-dark.png` and `4-ticket-price-dark.png` are unchanged from round 1.
