---
id: MONEY-02
title: The PIN sheet
owner: YOU
area: MONEY
order: 11
priority: launch
repo: wawu-wmt-mobile
type: component
status: building
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

Verifier session, 2 Oct 2026, on a detached worktree of 9ae7b17 (branch with origin/main ab2df44 merged; main has not moved since). Nothing in this session wrote the task's code. Evidence below is in the verifier's scratch folder (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money02/`), not committed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | **failed** | Warm cache: `npm run check` exit 0, 3 runs; tsc and lint clean; jest 4 suites, 19 tests; gates run 9, files scanned 25, 0 fail, 0 warn, 0 accepted; task check passes. Cold jest cache (a fresh clone, and CI's `npx jest --ci` on a new runner): `PinSheet.test.tsx` fails 3 of 3 runs, first test "Exceeded timeout of 5000 ms" (5003 ms); the other 18 pass. Production `expo export --platform web` exit 0. Logs: `check.log` (first run, red), `check1.log`, `check2.log` |
| V5 | passed, with token substitutions | `shots/W11-vs-built-{light,dark}.png`, `shots/W11-vs-built-sheet-{light,dark}.png` (W11 render beside the built sheet, 390 px, 2x); `shots/W11-*.png`, `shots/H15-*.png`, `shots/M13-*.png` |
| V6 | passed (server answers simulated: MONEY-09 is not built) | `shots/01` to `shots/14`, light and dark; `shots/states-grid-{light,dark}.png`, `shots/states-grid-extra.png`; `shots/16-prod-preview-redirect.png` |

Capability checks: "A user can enter a PIN, see it rejected with tries left, and see the locked state": passed by clicks in the dev web export (`shots/01`, `03`, `04`, `06`, `13`). "It matches W11 in light and dark": passed apart from the token substitutions below.

**Diff vs report.** `git diff --stat ab2df44 9ae7b17`: `src/components/pin-sheet/` (8 files), `src/app/preview/pin-sheet.tsx`, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/MONEY-02.md`. Matches the report. Nothing in `src/theme`, `src/api`, any `_layout.tsx` or `src/components/pay-sheet/`.

**V5, element by element against W11 (Approve line amended by brief rule 5 and W11).** Scrim, panel colour, 44 top radius, top hairline, side gutter 20, handle 40 by 5 in `border-strong`, 16 px dots (filled `text-primary`, 1.5 ring `border-strong`), 3-column keypad at 60 pitch (58 + 2), tabular digits, Face ID and delete glyphs at stroke 1.8, "Forgot PIN?" in `accent-fg` 600: all match, both themes. Approve line reads "Approve ₦25,065 to Chidinma Okoro" (the total, as the brief's W11 entry asks); H15's "₦2,523.25" and M13's "₦2,023.25 for the professional tick" are formatted correctly (jest). H15 and M13 draw no "Forgot PIN?": `onForgotPin` is optional, so both are reachable.

**V6, states.** Entering (with and without Face ID: the cell is empty when `biometric` is not passed, `shots/02`). Wrong with tries left from the answer ("Wrong PIN. 2 tries left.", "1 try left.", `shots/03`, `04`). Locked from `until`: "Try again in 15 minutes" (`shots/06`), opens locked "3 hours" (`shots/07`), and a 6 second lock counted 6, 3, then returned to the keypad by itself (`shots/13`, `14`). No try count or lock length is a literal in the component: `format.ts` and `PinEntry.tsx` hold only unit constants (1000 ms, 60 s, 60 min) and `PIN_LENGTH = 4` (W11, W36, MONEY-09 "4-digit PIN"); the "15" in the builder's copy comes from the preview's `lockMinutes`. Submitting: spinner, keys and "Forgot PIN?" off; a click on the scrim and on "7" while checking changed nothing (`shots/10`); a second submit is blocked by the `inFlight` ref (`PinEntry.tsx:55`, 125) and the jest test. Error ("We couldn't check your PIN. Try again.", `shots/11`), also from a rejected promise (jest). Approved: dots full, keys off (`shots/12`).

**Security.** `onSubmit` receives the PIN; nothing in `src/components/pin-sheet/` or the preview calls `console`, a router or a URL. Browser console over every run had no PIN. The preview's query parameters are `answer`, `tries`, `lockMinutes`, `opensLocked`, `faceId`, `forgot`; its `onSubmit` ignores the PIN (`src/app/preview/pin-sheet.tsx:70`). In the production export `/preview/pin-sheet?...` redirects to `/` and the preview's text is not in the bundle (`shots/16`).

### Findings

1. **defect**: `src/components/pin-sheet/__tests__/PinSheet.test.tsx:24`. The first test exceeds jest's 5 s default whenever the transform cache is cold, so `npm run check` fails on a fresh clone and CI (`npx jest --ci`, `.github/workflows/ci.yml`) will be red. Reproduced 3 of 3 cold (`npx jest --cacheDirectory <empty dir>`, alone and with the full suite); passes 3 of 3 warm. The builder's green run was on a warm cache. WORKFLOW section 10 lists a flaky suite as an owner stop, so this is raised, not waived.
2. **defect** (minor): `src/components/pin-sheet/PinSheet.tsx:33` with `PinEntry.tsx:88-91`. If the caller hides the sheet (`visible={false}`) while a check is in flight, `settle` returns early on the unmounted entry and never calls `onBusyChange(false)`, so `busy` stays true. Reopened, the sheet cannot be closed by scrim or back button until another PIN is checked. Reproduced with a throwaway jest test (hide mid-check, answer, reopen, press Close: `onClose` called 0 times). The sheet is shared by every payment.
3. **differs-for-recorded-reason** (no token exists; CLAUDE.md "never a literal"; recorded in the builder report). Checked against `design/_ds/wawu/tokens/`: type sizes are 40, 30, 24, 18.5, 16, 15, 13.5, 12.5, 11; spacing 4, 8, 12, 16, 20, 24, 32. Each is acceptable:
   - Title 21 to `text.h1` 24: no 21; h1 is the token labelled "sheet titles" and carries W11's 700 and -0.03em. Visibly larger on screen (`W11-vs-built-sheet-*`).
   - Digits 26 to `type.size.h1` 24: no 26 type token.
   - Dot gap 18 to `space.lg` 16, section gap 14 to `space.md` 12: both midway between two tokens.
   - "Forgot PIN?" 14 to `text.secondary` 13.5 (`--text-sec`).
   - Face ID glyph 26 to `space.s2xl` 24: no icon-size token.
4. **differs-for-recorded-reason**, same cause but **not in the builder report** (add them to it): heading gap 6 to `space.xs` 4 (`PinEntry.tsx:234`); panel top padding 10 to `space.sm` 8 (`PinSheet.tsx:79`); digit tracking -0.02em to `type.tracking.heading` -0.025em (`Keypad.tsx:99`); W11's `--shadow-sheet` is not drawn, because `src/theme` does not generate elevation tokens (they appear only as comments in `tokens.generated.ts`), and it is invisible behind the scrim. Dimension literals with no token: `HANDLE_H = 5`, `EDGE = 1` (`PinSheet.tsx:12`, 14), `RING = 1.5` (`PinEntry.tsx:230`), glyph geometry in `icons.tsx` (temporary until SHARED-CHANGES 1.1). Gates pass on them.
5. **unclear** (owner, MONEY-04/MONEY-09): the sheet depends on a `wrong` answer carrying `triesLeft` and a `locked` answer carrying `until`. MONEY-09's scope says "locked after 5 wrong tries" and "the lock is shown with when it ends" (so `until` is backed), but nothing names a tries-left count and no BACKEND_GAPS row was filed for it. Until MONEY-04's contract says the server returns it, "Wrong PIN. 2 tries left." shows a number nothing writes (WORKFLOW section 4, "A number with nothing that writes it").
6. **unclear** (owner, MONEY-09): Face ID. MONEY-09 defines no biometric approval, so "resolves like a PIN check" has no server behaviour behind it. Also, a rejected Face ID shows "Wrong PIN. 3 tries left." (`shots/08`), which names a PIN the person did not type and implies Face ID failures use up PIN tries, which nothing defines.
7. **unclear** (owner, MONEY-04): "We couldn't check your PIN. Try again." If `onSubmit` is the debit itself (MONEY-04 decides how the PIN is sent), a network error does not prove no money moved, and "Try again" invites a second request. That is safe only if the caller reuses the same Idempotency-Key; the sheet's contract does not say so.
8. **unclear** (minor copy): `format.ts:57` rounds hours up, so 61 minutes left reads "Try again in 2 hours". It never under-promises, but it can over-state by up to 59 minutes. Matters only if MONEY-09's lock is longer than an hour (its length is not defined).

Copy check: no em-dashes in any added line; no "Flutterwave". "Wrong PIN. 2 tries left.", "PIN locked" and "Too many wrong tries. Try again in N minutes." read clearly. "Too many wrong tries" is backed by MONEY-09's 5-try lock.

Ran: `git diff --stat`; `npm run check` x3 (warm); `npx jest --cacheDirectory <fresh>` x3 (cold); `npx jest src/components/pin-sheet` x3; `python3 scripts/design/render_design.py W11 H15 M13`; `npx expo export --platform web --dev --clear` and `npx expo export --platform web --clear` with a private TMPDIR (Metro cache); static server on port 8794; Playwright (Chromium 1194) at 390 px, 2x, light and dark; one throwaway jest probe for finding 2, deleted. Not run: native device (V10 not in this task's passes); real server answers (MONEY-09 not built).

Status back to `building` for findings 1 and 2.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
