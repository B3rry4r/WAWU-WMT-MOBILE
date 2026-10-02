---
id: SETUP-01
title: Verify the mobile repo setup
owner: DEV
area: SETUP
order: 1
priority: launch
repo: wawu-wmt-mobile
type: setup
status: done
depends_on: []
decisions: []
passes: [V1, V5]
artboards: []
---
# SETUP-01 · Verify the mobile repo setup

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)

## Goal

The repo was set up by one session on 1 Oct 2026. Before anyone builds on it, a different session proves every part of the setup works as the setup report claims.

## Scope

Read-only check of the whole repo. Fixes go back to the owner as findings.

## Capability checks

- [ ] `npm ci` then `npm run check` exits 0 on a fresh clone, and the gates report a non-zero 'files scanned'.
- [ ] `npx expo-doctor` passes, and `npm view expo dist-tags.latest` matches the installed SDK line.
- [ ] `python3 scripts/design/render_design.py ` writes six images that show Alan Sans and real icons (open them).
- [ ] `python3 scripts/design/render_design.py ` lists 297 artboards, matching design/canvas-inventory.json.
- [ ] Planting an em-dash in JSX text, a raw colour, an empty onPress and 'we will email you' in a throwaway .tsx makes the gates fail on each one; deleting it makes them pass.
- [ ] `npm run tokens -- --check` and `python3 scripts/api/sync_contract.py` leave no diff.
- [ ] `npx expo export --platform web`, served locally, shows the WAWU wordmark in Alan Sans in both light and dark at 390 px.

## Builder report

_Setup session, 1 Oct 2026. This session built the setup, so it cannot verify it: a different session runs the checks above._

**Built**
- Expo SDK 57 app (`expo` 57.0.26, the npm `latest` tag on 1 Oct 2026; SDK 58 was only on `next`), Expo Router in `src/app/`, strict TypeScript, TanStack Query. All versions aligned by `npx expo install --fix`; `npx expo-doctor` 21/21.
- `src/theme/tokens.generated.ts` generated from `design/_ds/wawu/tokens/*.css` by `scripts/design/gen_tokens.py` (colours in both themes, gradients, spacing, radii, type, motion; shadows and blurs listed as not generated). `src/theme/index.ts`: `useWawu()`, `text` styles, `font(weight)`.
- Alan Sans cut into seven static weights from the OFL variable font (`assets/fonts`, licence included). App icons made from the WAWU mark in `design/_ds/wawu/assets`.
- `src/api/schema.generated.ts` from the backend contract (wawu-backend@231cb64, `contract/SOURCE_COMMIT`) minus admin, ops, webhook and Shop routes (`contract/mobile-exclusions.json`, 94 operations). `src/api/client.ts` (openapi-fetch). `openapi-typescript` 7.13.0 runs through npx because its TypeScript peer range (^5) excludes SDK 57's TypeScript 6.
- `scripts/design/render_design.py`, adapted from the verification harness: this export keeps artboards in lazily loaded `*.sections.json`, which the original renderer cannot see (it would report zero). `design/canvas-inventory.json`: 297 artboards with a hash each.
- Gates (`scripts/gates`, verification harness, node stack). Three gaps found and fixed by probing: copy rules and the unbacked-promise rule did not read JSX text (most React Native copy); the comment stripper cut every `https://` URL; raw colours only warned (now fail via `color_severity`).
- CI (`.github/workflows/ci.yml`), docs, decisions, 194 task files, `scripts/tasks/check_tasks.py`.

**Checks run here (not a verification)**
- `npx tsc --noEmit` clean; `npx expo lint` exit 0 (proved it fires on a planted unused variable); `npx jest` 4/4.
- Gates: 0 findings, files scanned 5. Planted violations each failed: em-dash in JSX, "Flutterwave" in multi-line JSX, `https://wawu.africa/` link, raw colour, hand-written response interface, empty onPress, "We will notify you" and "We'll email you" in JSX.
- `render_design.py W1 W7 H1 SC5`: 8 images; opened W1-dark and W7-light: Alan Sans and icons present.
- `npx expo export --platform web` served at 390 px: wordmark in Alan Sans SemiBold, #C368EA on dark and #9411C9 on light, no console errors.
- Task checker: proved it fails on a task of 3 days, a missing required pass, an unknown dependency, and "ready" while its decision is open.

**Found and filed**
- Alan Sans has no ₦ glyph (U+20A6): D15.
- The backend contract repeats inline response shapes: BACKEND_GAPS G-1 (task MONEY-04).

**Not run**
- CI on GitHub: runs on the first push.
- A build on a real phone: needs the owner's Apple, Google and Expo accounts (SHELL-03).

### Builder report (fix round 1)

_Builder session, 2 Oct 2026, branch `wmt/SETUP-01`, not committed. Fixes verifier findings 1 and 2 only; edits to `scripts/**` and `docs/WORKFLOW.md` approved by the user for these two defects._

- **Finding 1, files:** `scripts/design/render_design.py` (answers the React 18.3.1 and Alan Sans requests from local files, aborts every other external request), `scripts/design/requirements.txt` (playwright, Pillow), `scripts/design/vendor/` (react and react-dom UMD, Alan Sans variable woff2, React MIT and Alan Sans OFL licences), `docs/WORKFLOW.md` (setup line). React bytes match the SRI hashes in `design/support.js`.
- **Finding 1, tested:** `pip install -r scripts/design/requirements.txt`, then `render_design.py W1 W7 H1` with no wrapper: 6 images (exit 0), opened W1-dark: Alan Sans and icons present. `--list` still prints 297.
- **Finding 2, files:** `scripts/gates/checks/hardcoded_signals.py` (new strict mode), `scripts/gates/gates.config.json` (`literal_strictness: all`, `spacing_severity: fail`), `scripts/gates/tests/test_hardcoded_signals.py` (10 tests), `src/__tests__/gates.test.ts` (runs them inside `npm test`, so `npm run check` covers them), `docs/WORKFLOW.md` (V1 row).
- **Finding 2, now fails:** 3/4/6/8 digit hex, rgb/rgba/hsl/hsla, CSS named colours on a colour property, non-zero numeric padding/margin/gap/rowGap/columnGap/all corner radii (object and JSX prop form). Planted violations for 19 colour forms and 16 spacing forms each fail; clean code, theme values, `0`, `'transparent'`, `src/theme/**`, generated tokens and tests pass.
- **Allowed and why:** `0` (no spacing), `'transparent'` (names no hue). The old exemption for alpha black/white overlays is closed in strict mode, because the rule says never a literal. Width, height, borderWidth and font sizes are not spacing or radii and are not checked.
- **Counts before / after:** typecheck clean / clean; jest 4 / 5 tests; gates 9 run, 0 fail, 0 warn, baseline 0 / 9 run, 0 fail, 0 warn, baseline 0; files scanned 5 / 6 (the new test file); tasks 187 / 187. `npm run check` exit 0 after.
- **Not done:** findings 3 to 5 (not asked). No existing source violated the stricter rule, so nothing was baselined. Python deps are not yet in ci.yml (CI does not render designs).

## Verifier report

_Verifier session, 2 Oct 2026, branch claude/nice-dirac-co5cl0 (equal to main). Evidence is in `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SETUP-01/`. Nothing was fixed; planted files were deleted and the working tree is unchanged apart from this report. Note: `npm ci` ran in the existing checkout, not a fresh clone._

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed: `npm ci` exit 0, `npm run check` exit 0 (typecheck, lint, jest 4/4, gates 9 run, files scanned 5, 0 findings, baseline 0 entries, tasks 187). Re-run after the plants were deleted: exit 0, files scanned 5 | npm-ci.log, check.log, check-final.log |
| V5 Picture | passed for the only built screen (boot screen, WAWU wordmark) at 390 px light and dark; there is no artboard for it, so no side by side exists. The wordmark is in Alan Sans, #9411C9 on light, #C368EA on dark | web-light.png, web-dark.png, shot.log |

| Capability check | Result | Evidence |
|------------------|--------|----------|
| npm ci + npm run check exit 0, files scanned non-zero | passed (5 files) | check.log |
| `npx expo-doctor` passes | NOT RUN to a pass: 19/21 passed, 2 failed for network reasons only (config schema check and React Native Directory check: the proxy answers "Host not in allowlist", cdp.expo.dev and reactnative.directory are blocked). The builder's 21/21 could not be reproduced here | doctor.log |
| `npm view expo dist-tags.latest` matches SDK line | passed: latest 57.0.26, installed 57.0.26, package.json ~57.0.26. `next` is 58.0.2, as the report says | dist-tags.txt |
| render_design.py with ids writes six images showing Alan Sans and real icons | passed with a workaround (see defect 1): W1 W7 H1 gave 6 images (3 artboards x light/dark). Opened W1-dark, W7-light, H1-light: Alan Sans headings and numerals, real line icons (scan, copy, send, wifi, bolt, tab bar), no fallback face. Not all six were opened (W1-light, W7-dark, H1-dark were not) | W1-dark.png, W7-light.png, H1-light.png and the other three, render.log |
| render_design.py --list lists 297 artboards matching canvas-inventory.json | passed: 297 listed, 297 unique ids, set equal to the 297 ids in the inventory, no difference | list.txt |
| Planted em-dash, raw colour, empty onPress, "we will email you" each fail the gates; deleting passes | passed, attributed one at a time: em-dash in JSX text fails product_invariants; `#ff0000` fails hardcoded_signals; `onPress={() => {}}` fails dead_controls; "we will email you a receipt" fails unbacked_promises; the control file with none of them passed (exit 0, files scanned 6). Also failed correctly: em-dash in a prop and in a string expression, "Flutterwave", "We'll email you", a https:// link. After deletion `npm run check` exit 0. See defect 2 for what did not fail | plant-*.log |
| `npm run tokens -- --check` and `sync_contract.py` leave no diff | passed: tokens "up to date", exit 0; sync_contract.py (regenerate mode) exit 0, `git status` clean. Backend copy mode not run, but ../WAWU-Backend origin/main is 231cb64 and its contract/openapi.json is byte-identical to contract/openapi.json | tokens.log, sync.log |
| `npx expo export --platform web`, served, wordmark in Alan Sans, light and dark at 390 px | passed: export exit 0; Playwright Chromium at 390x844, no console errors, no horizontal overflow (scrollWidth 390), AlanSans-SemiBold and Black loaded, wordmark text "WAWU" centred on both themes. Exported to the scratchpad (`--output-dir`), not into the repo | export.log, web-light.png, web-dark.png, shot.log |

### Findings

1. **defect** (tooling, not the app): `scripts/design/render_design.py` cannot run as the docs say on a clean machine. It needs the Python packages `playwright` and `Pillow`, which are declared nowhere (no requirements file, not in CLAUDE.md, WORKFLOW or ci.yml): the first run failed with ModuleNotFoundError for each. It also launches Chromium with `--no-proxy-server` and needs unpkg.com (React 18.3.1) and cdn.jsdelivr.net (Alan Sans, from design/_ds/wawu/tokens/fonts.css) at render time, so it fails ("NOT RENDERED ... React never loaded", then "Alan Sans did not load") wherever those hosts are blocked, as in this session. It does fail loudly rather than render the wrong font, which is correct. To get the six images I installed playwright and pillow into the scratchpad and used a wrapper (`/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SETUP-01/../run_render.py`) that runs the repo script unmodified but answers the unpkg and jsdelivr requests from npm tarballs of react 18.3.1 and the Alan Sans woff2 embedded in design/WAWU Mobile - Light.html. Unblocks: declare the two packages and the two CDN dependencies in docs/WORKFLOW.md or vendor them.
2. **defect**: the colour gate is narrower than CLAUDE.md rule "Colours, spacing, radii and type come from @/theme. Never a literal". Probed with `scripts/gates/checks/hardcoded_signals.py` (regex is 6-digit hex only): `#f00`, `#ff000080`, `rgb(...)`, `rgba(...)`, `hsl(...)`, a named colour (`'white'`) and a literal `padding: 13, borderRadius: 7` all pass the gates (exit 0). A builder can ship these and V1 stays green. Planted files were removed.
3. **unclear**: expo-doctor 2 of 21 checks could not run here (network). Needs a run on a machine with egress to confirm the builder's 21/21.
4. **unclear**: builder report says "194 task files"; there are 188 task files in tasks/ (excluding INDEX.md) and `check_tasks.py` reports 187 tasks and 280 of 297 artboards covered. The report is probably stale after commit 2fb311e (re-own by feature); confirm the count and that the 17 uncovered artboards (Shop is 15) are the "not built" list in DECISIONS.md.
5. **unclear**: the boot screen has no artboard, so V5 is the wordmark check only. The only part of the builder report I could not check is "D15, Alan Sans has no U+20A6": the design renders show a naira sign in the design's Alan Sans (W1-dark), so the app would need that glyph from a fallback or the full font; not tested because no app screen shows an amount yet.
6. Builder report claims checked and matching: Expo 57.0.26 latest, 297 artboards with a hash each, 94 operations excluded, contract at 231cb64, tokens and contract regenerate with no diff, jest 4/4, 8 images from 4 ids (4 x 2), wordmark colours #9411C9 / #C368EA, planted violations fail. The claimed 21/21 expo-doctor and 194 task files did not reproduce (findings 3 and 4). Not diffed against `git diff --stat main...`: the branch equals main and history has 36 commits beyond the setup commit, so no file list isolates the setup.

**NOT RUN:** two expo-doctor checks (network); CI on GitHub (no push); a device build. V5 side by side (no artboard). Status set to `building` because defects 1 and 2 are open.

## Verifier report (round 2)

_Verifier session, 2 Oct 2026, branch wmt/SETUP-01 (uncommitted working tree). Re-checks fix round 1 (defects 1 and 2 of the first report). Evidence is in `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SETUP-01-r2/`. Nothing was fixed; planted files and the `src/zzplant/` directory were deleted; `build/design_shots/` was restored to the files that were there._

| Check | Result | Evidence |
|-------|--------|----------|
| Diff against the report | passed: `git status` shows exactly the builder's files (render_design.py, requirements.txt, vendor/, hardcoded_signals.py, gates.config.json, scripts/gates/tests/, src/__tests__/gates.test.ts, docs/WORKFLOW.md) plus the task file. No extra or missing file. One unreported line change: gates.config.json em-dash pattern rewritten from the literal character to `\u2014` (same string, still fails, proved by the em-dash plant) | git status, st-before.txt |
| `npm run check` | passed: exit 0; typecheck clean; lint exit 0; jest 2 suites, 5/5 tests; gates 9 run, files scanned 6, 0 fail, 0 warn, baseline 0; tasks 187, 280 artboards covered. Matches the builder's counts | check.log, check-final.log |
| V1 Gates (defect 2) | passed, with bypasses recorded below | plant-all.log, flagged.txt |
| Defect 1: render_design.py W1 W7 H1, no wrapper, proxy env unset | passed: exit 0, 6 images. `pip install -r scripts/design/requirements.txt` is the only setup. Script reads: React and Alan Sans are fulfilled from `scripts/design/vendor/`, every other non-127.0.0.1 request is aborted, so no unpkg/jsdelivr request can succeed or be needed | render.log |
| Six images show Alan Sans and real icons | passed: opened 4 of 6 (W1-light, W1-dark, H1-dark, W7-dark): Alan Sans headings and naira amounts, line icons (scan, copy, send, wifi, bolt, tab bar, bell, scales), dark and light themes correct, no fallback face. W7-light and H1-light not re-opened (the first verifier opened them with the old setup) | build/design_shots/*.png |
| `--list` gives 297 | passed: "297 artboards in 12 flows", 297 rows; canvas-inventory.json has 297 artboards | list.txt |
| Vendored files and licences | passed: react.production.min.js sha384 DGyLxAyj... and react-dom.production.min.js sha384 gTGxhz21... equal REACT_SRI and REACT_DOM_SRI in design/support.js; LICENSE-react.txt (MIT) and LICENSE-alan-sans-OFL.txt present with the font. The Alan Sans woff2 (38,664 bytes) matches the URL fonts.css requests (fontsource alan-sans vf 5.3.0) by name only; I could not hash it against the original (no network to jsdelivr), but the renders show Alan Sans | scripts/design/vendor/ |
| Planted em-dash, empty onPress, "we will email you" | passed: each fails (product_invariants, dead_controls, unbacked_promises) | plant-all.log |
| Planted 3, 4, 6, 8 digit hex, rgb(), rgba(), hsl(), 'white', padding: 13, borderRadius: 7, gap={8} | passed: each fails hardcoded_signals. Also fail: template-string hex, rgb(${r}...), 'WHITE', 'whitesmoke' on backgroundColor, `background: 'red'`, marginHorizontal, paddingTop, borderTopLeftRadius, borderBottomRightRadius, StyleSheet.create, style array, negative and decimal values, colors={['red','blue']}, shadowColor 'black', uppercase hex | plant-all.log |
| Clean code passes | passed: theme tokens, 0, 'transparent', width/height/borderWidth/elevation/fontSize, "Order #123", `#section` in a URL, `marginLeft: 'auto'`, `borderRadius: 999 / 2`, the words "red" and "white" in text: no false positive (the one failure was my own https://wawu.africa/ link, a correct existing rule) | clean.tsx run |
| Delete plants, `npm run check` green | passed: exit 0 | check-final.log |
| `npm run tokens -- --check` | passed: up to date | tokens.log |
| `sync_contract.py` leaves no diff | passed: exit 0, `git status` identical before and after | sync.log |
| `npx expo-doctor` | NOT RUN to a pass: 19/21, the same two network checks fail (config schema, React Native Directory) because the proxy answers "Host not in allowlist" | doctor.log |
| Round 1 report intact; status | passed: first Verifier report is unchanged. The task status moved verifying to building in the working tree, which is the first verifier's correct move; the builder did not set it to review | git diff HEAD |

### Findings

1. **unclear (minor gaps in the stricter gate, none in what the builder claimed)**: these still pass the gates, probed against the strict rules: a quoted or computed key (`'padding': 13`, `['padding']: 13`); a number written as a string (`padding: '13'`, `'13px'`); arithmetic or conditionals on literals (`padding: 8 + 4`, `8 * 2`, `+8`, `space.sm + 3`, `x ? 8 : 12`); a value on the line after its key (`borderRadius:` newline `7`); `marginBlock`; colour forms `hwb()`, `oklch()`, and numeric colours (`color: 0xff0000ff`, `backgroundColor: 4294901760`). Also not checked, by the builder's stated design: top/left/right/bottom, width, height. None of these is in the rule list the builder claimed, and the common forms fail, so I do not count them as an open defect; the owner can decide whether to close them. The arithmetic and string-number gaps are the easiest for a builder to hit by accident.
2. **unclear (process)**: the `\u2014` rewrite in gates.config.json is unreported and unrelated to the two defects. It is behaviour-neutral (verified by the em-dash plant) and may be intentional so the file holds no literal em-dash.
3. **unclear (carried over, not in this round's scope)**: first-round findings 3 to 5 stay as they were (expo-doctor network checks, "194 task files" vs 187, boot screen V5 has no artboard). The builder did not touch them.
4. Review of the gate change: it weakens nothing existing. In strict mode the old hex branch is skipped by `continue`, but the strict hex rules are a superset of it, and every other pattern in the loop runs before it. The alpha black/white overlay exemption is closed, which matches CLAUDE.md. The 10 Python unit tests run inside `npm test` through gates.test.ts, so `npm run check` covers them. No test or baseline was edited to make a check pass; baseline stays at 0 entries. Python deps are not in ci.yml (the builder said so; CI does not render).

**NOT RUN:** two expo-doctor checks (network); CI on GitHub (no push); a device build; hash of the vendored Alan Sans against the jsdelivr original (no egress).

**Status: review.** Defects 1 and 2 are closed; no open defect.

## Owner sign-off

Owner, 2 Oct 2026: signed off ("carry on with SHELL-01"); merged from wmt/SETUP-01.
