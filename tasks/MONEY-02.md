---
id: MONEY-02
title: The PIN sheet
owner: YOU
area: MONEY
order: 41
priority: launch
repo: wawu-wmt-mobile
type: component
status: done
depends_on: [UI-01, UI-02]
decisions: [R-22, R-26]
passes: [V1, V5, V6, V10]
artboards: [W11, H15, M13]
---
# MONEY-02 · The PIN sheet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W11 H15 M13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A3.json`, `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for W11, H15 and M13 (the brief is part of the design: build its version)
- `DECISIONS.md`: R-22 (sizes from the board kit), R-26 (biometric approval)

## Goal

One PIN sheet, reused by every payment (W11 and the same sheet on H15, M13, E4, S6, SC6).

## Scope

src/components/pin-sheet/ with states: entering, wrong PIN with tries left, locked with time, biometric
option, submitting. Built on UI-02's bottom sheet and UI-01's buttons in this task, not a later one; sizes are
the board kit's, as named constants (R-22), never substituted.

The biometric option is the phone's own fingerprint or face unlock, whichever it has (`expo-local-authentication`,
R-26). Its label names what the phone has ("Use fingerprint" on most Android phones). A failed or cancelled
prompt shows "<Name> failed. Use your PIN." (for example "Fingerprint failed. Use your PIN.") and never uses up a
PIN try. Copy for states the canvas doesn't draw is written by the builder in the canvas's voice and listed in
`docs/designer/BRIEF.md`; it is not a question for the owner.

V10 runs on a real Android phone only (R-24): the fingerprint prompt only exists on a device.

## Brief changes (build these, not the canvas)

- **W11**: the same rows as the new W10 (₦40 + ₦25 = ₦65, Total ₦25,065.00), and the sheet's line "Approve ₦25,000 to Chidinma Okoro" becomes "Approve ₦25,065 to Chidinma Okoro". (Why: R-10 and rule 5.)
- **W11**: the phone's own fingerprint or face unlock, whichever it has; the label names it ("Use fingerprint" on most Android phones). When it fails: "<Name> failed. Use your PIN." (for example "Fingerprint failed. Use your PIN."), and no PIN try is used up. The same on H15, M13 and every PIN sheet. (Why: R-26. Testing is Android first (R-24); Face ID is Apple's.)
- **H15**: "Approve ₦2,523.25 to Chidi Eze". (Why: rule 5, following H14.)
- **M13**: "₦2,023.25 for the professional tick". (Why: rule 5, following M12.)

## Capability checks

- [ ] A user can enter a PIN, see it rejected with tries left, and see the locked state.
- [ ] A user sees the sheet exactly as W11 draws it, with the brief's total on the Approve line, light and dark (V5).
- [ ] A user whose phone has a fingerprint or face unlock set up can approve with it; when it fails they see "Fingerprint failed. Use your PIN." (or Face) and still have every PIN try.

## Builder report

- **Files:** `src/components/pin-sheet/` (`PinSheet.tsx` on the shared `BottomSheet`, `PinEntry.tsx` states, `Keypad.tsx`, `kit.ts` sizes, `biometric.ts`, `format.ts`, `types.ts`, `index.ts`, `__tests__/PinSheet.test.tsx`); dev-only `src/app/preview/pin-sheet.tsx`. Owner-instructed shared edits (SHARED-CHANGES Applied, MONEY-02 #8 and #9): `Fingerprint` through a documented `EXTRA` list in `scripts/design/gen_icons.js` (`npm run icons` still yields it after the merge); `expo-local-authentication` via `npx expo install`, its plugin in `app.json`.
- **Sizes (R-22):** the frame is UI-02's `BottomSheet` (kit `sheet()`: padding 10/20/34, 40 by 5 grabber, `--shadow-sheet`) with `gap={14}` as W11 passes; copy is the shared `Text`: `sheetTitleSm`, `muted`, and the Lead-authorised `errorLine` (auth.js line 14) and `linkStrong` (wallet.js line 81). The rest are kit constants in `kit.ts`: heading gap 6, `dots()` 16 and 18 apart, `keypad()` rows 58 and 2 apart, digits 26/500/-0.02em, icons 26 and 24 at 1.8, the error icon 15 at 2.2 and 6 apart. Measured from the grabber at 2x, W11 and the build put the title at 54, dots at 115, keys at 190 (`build/screens/W11-rhythm.txt`): no 4 px difference left; digit rows differ by 1 px at 2x (glyph rasterisation).
- **Shared components:** `formatMoney` for the total (kobo, R-21); `Text` for every line of copy except the keypad digits (kit `keypad()` cells); `BottomSheet` for the frame, `dismissible={false}` while a PIN is checked. kit.js draws the keys and "Forgot PIN?" as keypad cells and a text line, never `Btn` or `IconBtn`, so no shared `Button` or `IconButton` applies. Shared edits authorised by the Lead (2 Oct 2026) and recorded under SHARED-CHANGES Applied: `BottomSheet` `gap` prop (default 18, MONEY-02 #10, request 10 closed) and the two `Text` variants (MONEY-02 #11).
- **Contract (MONEY-04, CONVENTIONS.md 3 to 5):** `onSubmit(pin)` feeds `X-Transaction-Pin` and resolves `approved`, the contract's `reason` objects `{ code: 'pin_incorrect', triesLeft }` (403) and `{ code: 'pin_locked', lockedUntil }` (423), or `unanswered`; the `lockedUntil` prop is `PinStateView.lockedUntil`. Both fields exist, so no gap. `PinRefusal` should come from the generated `MoneyErrorReason` once the money contract reaches `schema.generated.ts`.
- **Idempotency-Key:** the caller reuses one key per payment after a wrong PIN (refusals before money moves are not stored, CONVENTIONS 4.6) and after an `unanswered` request. Written in `types.ts`.
- **Lock time:** a running clock in the canvas's countdown format (W37 "Resend in 0:42"): "m:ss" under an hour, "h:mm:ss" from an hour; no rounding to minutes or hours; seconds round up, never 0:00 while locked.
- **Owner ruling, biometric (2 Oct 2026):** whatever the phone has, read with `expo-local-authentication`. Fingerprint: `Fingerprint` icon, "Use fingerprint". Face only: `ScanFace`, "Use Face ID" (iOS) or "Use face unlock" (Android). Both: fingerprint on Android, face on iOS. No hardware or nothing enrolled: no key. Icon at the canvas's ScanFace size and stroke.
- **Owner ruling, biometric failure copy (2 Oct 2026):** a refused or failed check shows "<Name> failed. Use your PIN." ("Fingerprint failed. Use your PIN.", "Face ID failed. Use your PIN.", "Face unlock failed. Use your PIN.") in the wrong-PIN line's style, and uses up no PIN try. A cancelled prompt returns to the keypad silently. G-9 (MONEY-14) asks the server for its refusal code. The earlier open question is closed.
- **Still for the owner to confirm:** builder-written lines for undrawn states: "Wrong PIN. 2 tries left.", "PIN locked" with "Too many wrong tries. Try again in 14:59.", "We couldn't check your PIN. Try again."
- **Fixes from verification:** cold-cache timeout (Modal and react-native-svg now load at file load; fake clock throughout; cold first test 4.7 s before, 0.3 s after; no timeout raised); busy flag reset when the entry unmounts mid-check (two tests).
- **Checks:** 26 jest tests in `PinSheet.test.tsx` (entry, 403 tries left, 423 lock and countdown, busy, each biometric device type with `expo-local-authentication` mocked, the failure line). Screens in `build/screens/` (not committed): 22 state shots light and dark plus `W11-vs-built-{light,dark}.png`; the verifier decides.
- **Gates:** before (round 1) 9 gates, 6 files, 0/0/0, jest 2 suites, 5 tests. After (merged origin/main 7148749): 9 gates, 63 files, 0 fail, 0 warn, 0 accepted; jest 11 suites, 219 tests; lint 0 errors; `npm run check` exit 0.
- **Not done:** the server side (MONEY-09, MONEY-14); the slide-in motion (UI-02); no native device run, so the biometric prompt itself is untested on hardware (V10 not in this task's passes).
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

### Round 2 (final)

Verifier session, 2 Oct 2026, on a fresh detached worktree of 38b4969 (contains main 7148749; `origin/main` is still 7148749), `node_modules` symlinked from the main checkout (expo-local-authentication 57.0.3), no install. Nothing in this session wrote the task's code. Evidence is in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money02-r2/`, not committed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` exit 0, 2 runs: tsc 0, lint clean, jest 11 suites / 219 tests, gates run 9, files scanned 63, 0 fail / 0 warn / 0 accepted, task check passes (`check1.log`, `check2.log`). `expo-doctor` 21/21; `gen_tokens.py --check` up to date; `gen_icons.js` regenerates `icons.generated.ts` with no diff (Fingerprint kept); production `expo export --platform web` exit 0. Cold cache (`npx jest --ci --cacheDirectory <empty>`, full suite, 3 runs): `PinSheet.test.tsx` passed all 3 (27 tests, first test 123 ms); runs 1 and 2 failed on `src/__tests__/lists.test.tsx` "filter chips" (finding 2, main's test); run 3 exit 0. PIN sheet suite alone, cold, 3 runs: 27/27 each |
| V5 | passed | `shots/W11-vs-built-{light,dark}.png`, `shots/W11-vs-built-sheet-{light,dark}.png`; renders `shots/W11-*`, `H15-*`, `M13-*` |
| V6 | passed (server answers simulated through the preview; device biometrics through a mocked `expo-local-authentication`) | `shots/01` to `shots/17`, light and dark; `shots/states-grid-{light,dark}.png`; `shoot.log`; `shots/18-prod-preview-redirect.png` |
| V10 | NOT RUN | not in this task's passes; no Android build yet includes `expo-local-authentication`, so the real fingerprint and face prompts are untested on hardware |

Capability checks: "A user can enter a PIN, see it rejected with tries left, and see the locked state": passed by clicks in the dev web export (`shots/03`, `04`, `05`, `15`). "It matches W11 in light and dark": passed (below).

**1. Round-1 defects, re-checked with my own tests.**
- **Round-1 finding 1 (cold-cache timeout): closed.** The PIN sheet suite never timed out cold (6 cold runs, full and alone).
- **Round-1 finding 2 (busy flag): closed.** My own throwaway jest tests, deleted afterwards, both passed:
  - hidden mid-check, answered, reopened, Close pressed: `onClose` called once;
  - hidden mid-check and reopened before any answer: Close works.

  The fix is the unmount cleanup at `PinEntry.tsx:67-79`.

**2. Picture against W11.** I measured ink rows from the grabber's top edge at 2x (W11 render against `preview/pin-sheet?answer=hold&biometric=face&forgot=1` with two digits).

| Element | W11 (2x px) | Built (2x px) |
|---|---|---|
| Title and line block | 54 to 93 | 54 to 93 |
| Dots | 115 to 138 | 115 to 138 |
| Key row 1 | 190 to 221 | 190 to 221 |
| Key rows 2 to 4 (tops) | 305, 425, 545 | 306, 426, 546 |
| Bottom row (glyphs) | 662 to 705 | 662 to 705 |
| "Forgot PIN?" | 779 to 802 | 779 to 802 |

Light and dark are the same. The builder's 54 / 115 / 190 are confirmed. The 1 px on digit rows 2 to 4 is glyph rasterisation; row bottoms match. Element by element, these all match:
- the frame, through the shared `BottomSheet`: scrim, 44 radius, hairline, 40 by 5 grabber, `--shadow-sheet`;
- `sheetTitleSm` 21 and `muted` copy;
- dots 16 / 18 / 1.5 ring;
- keypad 58 + 2, digits 26 / 500 / -0.02em;
- ScanFace 26 and Delete 24 at stroke 1.8;
- "Forgot PIN?" 14 / 600 `accent-fg`.

The Approve line reads "Approve ₦25,065 to Chidinma Okoro", the total, as brief rule 5 and its W11 entry ask. Round-1 findings 3 and 4 (token substitutions) are closed: R-22 sizes from the kit, each cited in `kit.ts`.

**3. States.** All reached in the dev web export, light and dark.
- Entering: with the face key, the fingerprint key, or no key (`01`, `07`, `02`).
- Wrong PIN: "Wrong PIN. 2 tries left." / "1 try left." with the CircleAlert line and red rings (`03`, `04`).
- Locked from `lockedUntil`: counts "14:59" then "14:57" (`05`).
- Opens locked at 61 minutes: "1:00:57" (`06`).
- A 6 s lock counts 0:06, 0:03, then gives the keypad back (`15`, `16`).
- Biometric failed: "Fingerprint failed. Use your PIN." and "Face unlock failed. Use your PIN." These show no red rings and no tries line, and `onSubmit` is never called (`08`, `09`).
- Submitting, by PIN and by biometric: the grabber, a scrim click, Escape and a digit all did nothing (`10`, `11`, `12`).
- Error: "We couldn't check your PIN. Try again." (`13`).
- Approved: keys off (`14`).
- Scrim close when idle works.

Device kinds come from my own jest tests with `expo-local-authentication` mocked. The real enum is FINGERPRINT 1, FACIAL_RECOGNITION 2, checked in node_modules. Results:

| Phone | Key | Failure line |
|---|---|---|
| Android, fingerprint | Use fingerprint | "Fingerprint failed. Use your PIN." |
| Android, face only | Use face unlock | "Face unlock failed. Use your PIN." |
| iOS, face | Use Face ID | "Face ID failed. Use your PIN." |
| iOS, fingerprint | Use fingerprint | "Fingerprint failed. Use your PIN." |
| Android, both | fingerprint | |
| iOS, both | Face ID | |
| no hardware | no key | |

Also from my jest tests:
- a cancelled prompt goes back to the keypad with no message;
- a double tap on the last digit submits once (`onSubmit` once with `7395`);
- no duration or try count is a literal: the clock is `format.ts:45-51` from `lockedUntil`, with no rounding to minutes, and `PIN_LENGTH = 4` is backed by the contract's `^[0-9]{4}$`.

**4. Shared additions.**
- **`BottomSheet` `gap`** (`BottomSheet.tsx:37`, 49, 80) defaults to `sheetMetrics.between` = 18, kit.js line 64 `gap:${o.gap ?? 18}`. Existing callers are unchanged:
  - the only other caller, Showcase (`Showcase.tsx:306`), passes no gap;
  - UI-02's sheet tests in `lists.test.tsx` pass, and the two new tests cover 18 and 14.
- **`Text` variants** (`src/theme/index.ts:105`, 111), number by number:
  - `errorLine` 13 / 600 / `danger` / untracked / normal line = auth.js line 14 `font-size:13px;font-weight:600;color:var(--danger)`, with CircleAlert 15 at 2.2 and gap 6 (`kit.ts` `ALERT`, `ICON_STROKE.button` = 2.2);
  - `linkStrong` 14 / 600 / `accent-fg` / untracked = wallet.js line 81 "Forgot PIN?" `font-size:14px;font-weight:600;color:var(--accent-fg)`.

**5. No stand-ins.**
- `src/components/pin-sheet/` holds no Modal, scrim, SVG, money formatter or icon drawing. It uses `BottomSheet`, `Text`, `Icon` and `formatMoney` (through `sheetAmount`) from main.
- The keypad digits use React Native `Text` with kit `keypad()` constants. This is not a stand-in: main has no keypad-digit component or variant, and kit.js draws them as grid cells, not `Btn`.
- SHARED-CHANGES row ids are unique: 1 to 7 once each; MONEY-02 #6, #7, #8, #9, 2.1, #10, #11; MONEY-03 #6, #7, #8.
- BACKEND_GAPS has G-7, G-8, G-9 and G-10 exactly once each.

**6. Contract** (wawu-backend `origin/wmt/MONEY-04` `docs/contract/CONVENTIONS.md`): `pin_incorrect` 403 with `triesLeft`, `pin_locked` 423 with `lockedUntil`, and the PIN in `X-Transaction-Pin` all match `types.ts`. On the app side the PIN goes only to `onSubmit` and is cleared on every answer.
- No `console`, fetch, router, storage or URL use in the sheet or the preview.
- The browser console over every run held no PIN, and no request URL or body carried one (`shoot.log`).
- In my jest test the console spies caught no PIN.
- The preview's query parameters are `answer`, `tries`, `lockMinutes`, `opensLocked`, `biometric`, `forgot`. Production redirects `/preview/pin-sheet` to `/`, and the preview's text is absent from the production bundle.

**7. Branch scope** (`git diff --stat 7148749 38b4969`, 25 files):
- the task's own files: `src/components/pin-sheet/`, `src/app/preview/pin-sheet.tsx`, the task file, LOG, PROGRESS, SHARED-CHANGES, BACKEND_GAPS G-9;
- the Lead-authorised additions: `BottomSheet.tsx`, `Text.tsx`, `src/theme/index.ts` (the two variants only), and their tests in `lists.test.tsx` and `kit-components.test.tsx`;
- the owner-instructed changes (SHARED-CHANGES MONEY-02 #8, #9): `gen_icons.js` EXTRA, `icons.generated.ts`, `package.json`, `package-lock.json`, `app.json`.

Nothing else changed, including nothing in `src/api`, any `_layout.tsx` or `pay-sheet/`.

**8.** `npm run check` exit 0 (V1 row).

#### Findings

1. **None open against MONEY-02.**
2. **unclear** (owner; not this task's): `src/__tests__/lists.test.tsx:56` "filter chips › lets a user pick Money out" (UI-02's test, already on main) exceeds jest's 5 s on a cold cache. It failed 2 of 3 cold runs on this branch and 1 of 2 on main 7148749 alone, under load average about 5 on 4 cores. CI runs cold (`npx jest --ci`), so CI can go red without any change. WORKFLOW section 10 makes a flaky suite an owner stop. A separate task should make that test independent of cache warmth, as MONEY-02 did for its own.
3. **unclear** (owner copy, already listed by the builder): the builder's lines for undrawn states await the owner. Separately, the lock line reads "Try again in 14:59." A screen reader may announce "14:59" as a time of day rather than a wait. Only the owner's copy decision can settle it.

Ran:
- `git diff --stat 7148749 38b4969` and per-file diffs of every shared file;
- `npx jest --ci --cacheDirectory <empty>` x3, full suite, and x3 for the PIN sheet alone;
- main 7148749 cold x2 for comparison;
- `npm run check` x2;
- `npx expo-doctor`, `gen_tokens.py --check`, `gen_icons.js` (no diff);
- `python3 scripts/design/render_design.py W11 H15 M13`;
- `npx expo export --platform web --dev --clear` and the production export, with a private TMPDIR (own Metro cache);
- a static server on port 8794 and Playwright (Chromium 1194) at 390 px, 2x, light and dark;
- one throwaway jest file (12 tests, deleted).

Not run: V10 (above); real server answers (MONEY-09 is on its branch, not in this app's contract types yet).

Status `review`: no open defects.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
