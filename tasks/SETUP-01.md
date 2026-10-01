---
id: SETUP-01
title: Verify the mobile repo setup
owner: YOU
area: SETUP
day: 0
repo: wawu-wmt-mobile
type: setup
status: verifying
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V5]
artboards: []
---
# SETUP-01 · Verify the mobile repo setup

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

The repo was set up by one session on 1 Oct 2026. Before anyone builds on it, a different session proves every part of the setup works as the setup report claims.

## Scope

Read-only check of the whole repo. Fixes go back to the owner as findings.

## Capability checks

- [ ] `npm ci` then `npm run check` exits 0 on a fresh clone, and the gates report a non-zero 'files scanned'.
- [ ] `npx expo-doctor` passes, and `npm view expo dist-tags.latest` matches the installed SDK line.
- [ ] `python3 scripts/design/render_design.py W1 H1 SC5` writes six images that show Alan Sans and real icons (open them).
- [ ] `python3 scripts/design/render_design.py --list` lists 297 artboards, matching design/canvas-inventory.json.
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

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
