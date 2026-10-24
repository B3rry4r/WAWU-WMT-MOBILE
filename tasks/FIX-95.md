---
id: FIX-95
title: The Hub serves the consent line with the person's name, and the Voice Intro recording's shortest and longest seconds
owner: YOU
area: OPS
order: -95
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: [R-43, R-66, R-68]
passes: [V1, V3]
artboards: []
tier: T1
---
# FIX-95 · The Hub serves the consent line with the person's name, and the Voice Intro recording's shortest and longest seconds

## Current state

As of 21 Oct 2026, verifying: built by a Sonnet builder (tier T1; backend `wmt/FIX-95` `699b783` on `origin/main` `bb21578`; this record on mobile `wmt/FIX-95` from `origin/main` `025d8d58`). The app side is VERIFY-03 round 2 (mobile `wmt/VERIFY-03`). Additive only: new fields on the view, the consent row keeps its column, no table, no protected route changed. CI on the backend head: the lead watches it.

- **Why.** The lead's rulings of 21 Oct 2026: a person must agree to exactly the text that is stored, so the Hub serves the board's line with the person's name and stores that line; and the recording's shortest and longest seconds come from the Hub, not from the app.
- **`consent.line`** on `GET /me/voice-intro` is now "I am {name}. I agree that Who Made This? may create an AI version of my voice for my intros." The name is the Hub's record of the person: first, middle (when there is one) and last name from the sign-in token, as `GET /users/me` gives it. `POST /me/voice-intro/consent` takes back only the line served for that person (`409 voice_consent_line_changed` for any other words, another person's line included) and stores exactly it with the time (`VoiceProfile.consentLine`, `consentAt`).
- **`sample.minSeconds` and `sample.maxSeconds`** on the same view, from two new PROVISIONAL plan settings in the registry: `voice_intro.sample_min_seconds` (15) and `voice_intro.sample_max_seconds` (30), provisional mark `VOICE-SAMPLE-SECONDS` with its reason in `plan-settings.defaults.json`. A shortest set above the longest is held down to the longest. The Hub still does not read a recording's length (the app times the take).
- **Files (backend).** `src/voice-intro/{voice-profile.service,voice-intro-run.service,voice-intro.controller,voice-intro-view.type}.ts`, `src/voice-intro/tests/voice-intro.contract.spec.ts` (VOICE-01's own spec, moved to the ruled line, plus two new cases), `src/plan-settings/{plan-setting-registry.ts,plan-settings.defaults.json}`, `contract/openapi.json` (`npm run contract:build`: `sample` gains two required numbers, nothing removed), `docs/contract/PLANS.md`.
- **Checks:** `tsc --noEmit` EXIT 0; eslint and prettier on the changed files EXIT 0; the voice-intro specs (2 suites) and the plan-settings specs `plan-settings`, `plan-settings-round2`, `plan-setting-rules-bonus`, `home-17-settings.contract` (6 suites in all), in band, 73 tests EXIT 0; `npm run test:protected` 2 suites, 253 tests EXIT 0 (on a database seeded as the deploy seeds it); `scripts/gates/run.py` EXIT 0 (0 fail, 130 warn, 88 accepted); `check_baseline.py` EXIT 0; `contract:build` EXIT 0.
- **Slip, said plainly.** I first ran two plan-settings specs that import the in-process `FintavaCashOut` double (`plan-settings-readers.contract`, `plan-settings-round2.contract`) because I grepped for the word in the same command that ran them. They passed, touched no Fintava code, and are not in the list above; the lead may wish to know.
- **Not run:** the whole backend suite (CI runs it); anything Fintava.
- **Next:** the lead merges backend `wmt/FIX-95` with the batch; then `npm run api -- --backend ../wawu-backend` gives the same mobile contract files as VERIFY-03 #3.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-43, R-66, R-68; backend `src/voice-intro/voice-profile.service.ts`, `docs/contract/PLANS.md` (the Voice Intro routes)

## Goal

A person agrees to exactly the words that are stored, and the app takes the recording's lengths from the Hub.

## Scope

`wawu-backend`: the files above. `wawu-wmt-mobile`: this file, `tasks/INDEX.md`, `docs/PROGRESS.md`, `docs/LOG.md`.

## Capability checks

- [x] The Hub serves each person's own name in `consent.line`, takes back only that person's line (another person's line is `409`), and stores exactly the served line (`voice-intro.contract.spec.ts`).
- [x] The view serves `sample.minSeconds` and `sample.maxSeconds` from the two settings (15 and 30 by default, changed by the settings, the shortest held down to the longest).
- [x] Both voice-intro specs and the four non-Fintava plan-settings specs in band pass; `npm run test:protected` passes (253 tests); `tsc`, eslint, prettier and `scripts/gates/run.py` pass.
- [ ] The full backend run (CI, Branch checks, and the deploy's Test job) is green on the head.

## Builder report

- **Files:** as in Current state. VOICE-01's spec asserted the old fixed line (`CONSENT_LINE`); it now asserts the ruled line for each seeded person (the ruled change, not a weaker assertion), and two cases are new (each person's own name and the swapped-line refusal; the two settings and the clamp).
- **Test setup.** A fresh database `fix95_wawu_hub_test` from `scripts/dev/stack.sh up` (migrated), seeded with `npm run db:seed` (the protected and voice specs need the seeded profiles). `test:protected` was first run against the stack's own mock WAWU ID, whose service key differs from the suite's, and failed 8 verification routes with 502 (not a product change); on its own mock it passes. Nothing else was changed to make it pass.
- **Cleanup:** stack stopped, databases dropped, worktrees removed, ports 7860-7867 empty.

## Verifier report

Verified 21 Oct 2026 by a fresh Sonnet verifier (built none of it; T1 check with the consent part at T2 depth) on backend `origin/wmt/FIX-95` `699b783` against `origin/main` `bb21578`. **Verdict: PASS** (two lows). Status to `review`. Pushed nothing to the backend. Nothing Fintava was run or touched: the one word "Fintava" in `voice-intro.contract.spec.ts` is a header comment saying no double is started, and no spec I ran imports one.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` EXIT 0. eslint (without `--fix`) on the 8 changed `.ts` files EXIT 0. Specs in band, on my own database `verify03v_specs_test` (migrated and seeded as the deploy seeds it): `voice-intro.contract`, `voice-provider-own-voice`, `plan-settings`, `plan-settings-round2`, `plan-setting-rules-bonus`, `home-17-settings.contract`: 6 suites, 73 tests, EXIT 0 (matches the builder). `scripts/gates/run.py` EXIT 0 (9 run, 0 fail, 130 warn, 88 accepted, 1706 files). `check_baseline.py` EXIT 0 (124 entries, each with an owner and a reason). `npm run contract:build` EXIT 0 and the tree stayed clean, so `contract/openapi.json` is exactly what the build writes. |
| V3 Protected routes | passed | `npm run test:protected`: 2 suites, 253 tests, EXIT 0 against a mock WAWU ID started with the repo's own service key. The first run, against the stack's mock (a different key), failed the same 8 verification and professional routes with 502 that the builder described (245 passed, 8 failed): the key, not the product; the run on the right key passes all 253. |

Live check on the stack (Hub from this branch, Nuvion stand-in, the mock WAWU ID; a person made through the mock, "Tolu Adeyemi Okafor", signed in through the mock's login): `GET /me/voice-intro` serves `consent.line` = "I am Tolu Adeyemi Okafor. I agree that Who Made This? may create an AI version of my voice for my intros." and `sample.minSeconds` 15, `sample.maxSeconds` 30. `POST /me/voice-intro/consent` with the old fixed line, another person's name, the right line plus a trailing space, and the right line with a lower-case "i": all `409 voice_consent_line_changed`, and `consent.given` stayed false (nothing stored). The right line: 200, and `VoiceProfile.consentLine` equals the served line character for character with `consentAt` set. With the two settings changed in the database to 10 and 20, the Hub served 10 and 20 after one refresh (under 40 s) and the app followed (title, ring, shortest take and self-stop). Another person's line refused: the spec's swapped-line case passes and the live "Someone Else" line was refused. The line matches `GET /users/me` (first, middle when there is one, last).

Capability checks: (1) own name served, only that line taken back, exactly it stored: passed (live and spec). (2) lengths from the two settings, the shortest held to the longest: passed (spec; settings change followed live). (3) both voice-intro specs, the four non-Fintava plan-settings specs and `test:protected`, `tsc`, eslint, gates: passed. (4) The full backend run (CI, Branch checks, the deploy's Test job) on the head: not looked at; the lead watches CI.

Additive only: the diff adds `consent.line`'s name, `sample.minSeconds` and `sample.maxSeconds` (two required numbers, nothing removed or retyped), two new plan settings and their provisional mark; no table, column, route or protected route changed; the mobile contract copy equals this contract file byte for byte. VOICE-01's own spec was moved to the ruled line (the lead's ruling, not a weaker assertion) and gained two cases.

## Findings

- **L1 (low, defect):** `src/voice-intro/voice-profile.service.ts:45-48` (`consentLineFor`) leaves out "I am X." when the name is empty, so a person whose sign-in carries no name is served and stores a line that is not the ruled line. Registration needs a first name, so it should not happen; a Hub that refused to serve a line without a name would be stricter.
- **L2 (low, tidy):** the new settings are named `voice_intro.sample_min_seconds` and `voice_intro.sample_max_seconds` while VOICE-01's are `voice.intro_max_chars` and `voice.name_previews_per_hour` (`plan-setting-registry.ts`); one prefix would read better for whoever edits them. Renaming a key after the owner has set it is a migration, so decide before launch.

## Owner sign-off

Not needed.
