---
id: MONEY-02
title: The PIN sheet
owner: YOU
area: MONEY
order: 11
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: []
passes: [V1, V5, V6]
artboards: [W11, H15, M13]
---
# MONEY-02 · The PIN sheet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W11 H15 M13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A3.json`, `docs/analysis/evidence/A4.json`

## Goal

One PIN sheet, reused by every payment (W11 and the same sheet on H15, M13, E4, S6, SC6).

## Scope

src/components/pin-sheet/ with states: entering, wrong PIN with tries left, locked with time, Face ID option, submitting.

## Capability checks

- [ ] A user can enter a PIN, see it rejected with tries left, and see the locked state.
- [ ] It matches W11 in light and dark.

## Builder report

- **Files:** `src/components/pin-sheet/` (`PinSheet.tsx` frame, `PinEntry.tsx` states, `Keypad.tsx`, `icons.tsx`, `format.ts`, `types.ts`, `index.ts`, `__tests__/PinSheet.test.tsx`); dev-only harness `src/app/preview/pin-sheet.tsx` (redirects home when not `__DEV__`).
- **Contract:** `onSubmit(pin)` and `biometric.onPress()` resolve `ok` / `wrong {triesLeft}` / `locked {until}` / `error` / `cancelled`; `lockedUntil` opens it locked; `pinLength` (default 4, W11/W36). No tries, lock length or policy in the component: all from the answer (MONEY-09). One check at a time; the sheet can't be closed mid-check.
- **Copy (brief W11, H15, M13, rule 5):** `approval.totalKobo` is the total with fees: "Approve ₦25,065 to Chidinma Okoro", "₦2,023.25 for the professional tick". Undrawn states written here: "Wrong PIN. 2 tries left.", "PIN locked" + "Too many wrong tries. Try again in 15 minutes.", "We couldn't check your PIN. Try again.", a spinner while checking.
- **Check 1 (enter, rejected with tries left, locked):** jest, 12 tests in `PinSheet.test.tsx` (enter and delete digits, submit once; wrong with 2 then 1 tries left; locked from the answer with a countdown that unlocks; opens locked; submitting refuses digits and close; error and rejected request; Face ID; Forgot PIN; scrim close). Also driven by clicks in the web export (Playwright).
- **Check 2 (W11 light and dark):** screenshots at 390 px, 2x, both themes, in `build/screens/` (not committed): entering, entering-no-faceid, wrong, locked, opens-locked, faceid, faceid-pressed, submitting, error; `W11-vs-built-{light,dark}.png` side by side with `build/design_shots/W11-*.png`. Whether it matches is the verifier's call.
- **Token choices where W11's inline value is not a token:** title `text.h1` 24 (tokens: "sheet titles"; W11 21), digits `type.size.h1` 24 (W11 26), dot gap `space.lg` (W11 18), section gap `space.md` (W11 14), "Forgot PIN?" 13.5 (W11 14), Face ID glyph 24 (W11 26). Key pitch `controlH + space.md` = 60, as W11's 58 + 2.
- **Gates before:** 9 gates, 6 files, 0 fail, 0 warn, 0 accepted; jest 2 suites, 5 tests. **After** (merged origin/main ab2df44, SHELL-01): 9 gates, 25 files, 0 fail, 0 warn, 0 accepted; jest 4 suites, 19 tests; `npm run check` exit 0.
- **Shared changes filed:** SHARED-CHANGES 1.1 (lucide `scan-face` and `delete` in the shared icon renderer, then delete `icons.tsx`), 2.1 (adopt UI-02's sheet, UI-01's buttons and money formatting).
- **Not done:** the real PIN check and lockout (MONEY-09); Face ID itself is only a callback (no biometric library installed; `package.json` is fenced); the sheet fades in rather than sliding (UI-02's sheet will own motion); no native device run (web export only; V10 not in this task's passes).
- **Note:** analysis A1 conflict 4 quotes an old web line "no Face-ID"; W11 draws the Face ID key and the task asks for it, so it is shown only when the caller passes `biometric`.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
