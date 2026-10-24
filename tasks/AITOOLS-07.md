---
id: AITOOLS-07
title: VoiceOver's four undrawn parts: your own voice, a sample before choosing, Save to the library, Use in a product
owner: YOU
area: POINTS
order: -117
priority: launch
repo: wawu-backend
type: third-party
status: building
depends_on: [AITOOLS-02]
decisions: [R-43, R-68, R-47, R-29, R-65]
passes: [V1, V2, V3, V4, V5, V6, V8, V9]
artboards: [PT2, PT2b]
tier: T2
---
# AITOOLS-07 · VoiceOver's four undrawn parts (backend and app)

## Current state

As of 24 Oct 2026, round 2 (Sonnet builder, T2, bundle B10; the first round's text is in [history](history/AITOOLS-07.md)). Backend `wmt/AITOOLS-07` `7679d5d` plus one header fix (below) on `origin/main` `c3a2c7a`; mobile `wmt/AITOOLS-07` with `origin/main` `206365d8` merged in (POINTS-10 edits `ToolScreen.tsx` too; the contract was synced from the backend branch by copying its `contract/openapi.json`, since `sync_contract.py --backend` reads `origin/main`, then `python3 scripts/api/sync_contract.py`; 297 added lines, none removed). **Status verifying.**

**Verifier round 1 (24 Oct 2026, full T2, report in [history](history/AITOOLS-07.md)): FIX. Status building.** Passed live and by spec: own voice from the person's own recording only and after the agreement (another person's id, a forged key and no recording refused), removed when the job ends, on failure, after a kill mid-run (swept at 15 minutes) and by DELETE; the public sample route (catalogue voices only, CORP change on that route alone); Save; Use in a product; the app on a 390 x 844 export in light and dark. Backend merges cleanly with `origin/main` `b69aa7f` and the stamp `20261105100000` is still the latest; mobile conflicts only in generated `docs/PROGRESS.md` and `tasks/INDEX.md`. Open for the fix round:
- **medium 1:** the data export omits `ownVoiceConsentAt` and `ownVoiceConsentLine` (`data-export-sections.ts:287-300`; also `savedAt`, `mediaJobId`).
- **medium 2:** account deletion does not remove a clone the provider still holds (no AI tools purge hook; repro: purge a person whose job notes `voice:<id>`, the stand-in keeps the voice).
- **low (sweep list):** a clone is forgotten after 24 hours (`provider-copy.service.ts:394`); a kill mid-run leaves one for 15 to 16 minutes and the instant before it is noted leaves one unnoted; `noteCopy` answers true when the note write failed (`ai-job.service.ts:514`); `?saved=false` answers every job (`ai-job.service.ts:344`).
- **unclear:** "Use in a product" takes any own finished job with audio, not only a saved one (`product-draft.service.ts:253`).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | G-POINTS-08-1: a voice row had no play button | each voice the Hub gives a `sampleUrl` has PT2's round play button (32, as the board); it plays the sample from the Hub and stops on a second tap; it never chooses the voice |
| 2 | G-AITOOLS-01-1: no "Your voice" | the row leads the list for a person with a Voice Intro recording and plays their Voice Intro (`audioUrl`) when they have one; tapping it asks for the Hub's words, "I agree" sends them back unchanged, a VoiceOver is made with `voiceId: own`; "Take my voice off VoiceOver" takes the agreement back |
| 3 | G-AITOOLS-01-4: Save not built | PT2b's Save row toggles Saved and back (`POST` and `DELETE /ai-tools/jobs/{id}/save`) |
| 4 | G-POINTS-08-2: Use in a product not built | PT2b's row lists the person's drafts and one tap attaches the result (`PATCH /product-drafts/{id}` with `mediaJobId`); a "Attached to ..." notice with the tick |

- **The red `voiceExtras.test.tsx` was a wrong test, not the screen.** `@testing-library/react-native` 14 makes `render`, `fireEvent` and `unmount` async; the test called them without `await`, so no press had happened when the assertions ran (and tsc said so: `unmount` is not on a Promise). Awaited; no assertion weakened; one wait gets 8 s because a lost connection is tried again twice (api/query.ts) before the picker's error shows. 11/11. The live run (below) proved the screen plays, agrees, saves and attaches.
- **Live, one local stack** (`b10r2`: backend `wmt/AITOOLS-07` on the Nuvion stand-in, the voice and storage stand-ins, the mobile web export at 390 x 844, sign-in through the app's own form with the mock WAWU ID as `creator-pro@test.wawu.dev`; the account's points were granted in the database and its Voice Intro recorded through the Hub's own routes, because the stand-in has no microphone). Run in light and dark: a sample played (the Hub's route answered the `<audio>` element), the own-voice sample played, consent read the Hub's line and "I agree" chose "Your voice", VoiceOver ran with `voiceId: own` (250 points, 2,050 to 1,800), the result was Saved and the Hub listed it under `saved=true`, "Use in a product" attached it (the draft read back with that job's id as `mediaJobId`), the voice was taken off (`ready` false). The voice stand-in's state after the runs: every clone made was deleted (`cloned` 5, `deleted` 5, `active` 0), and the job's `providerRef` was empty. Voice making, speech and delete on the real provider are NOT RUN (out of credits).
- **A defect found live and fixed (backend):** `GET /ai-tools/voices/{id}/sample` answered with the Hub's default `Cross-Origin-Resource-Policy: same-origin`, so a web player on another address was blocked (`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`, the element's error 4). The controller now sends `cross-origin` for this one public preview; the contract spec asserts it. A phone's native player was never affected.
- **Fixed in the app while looking at the pictures:** the Save and Use rows and the draft list were built by hand and sat flush against the card's edge with no inset (the board's card has a 16 inset and the divider inside it): they now use the shared `GroupedList`. The play button was drawn 44 across, the board's is 32 with a 13 mark. "Attached to ..." and "Your voice is off VoiceOver." wore the danger icon (the screen had one toast tone); they now wear the tick (`tool-notice-ok`).
- **Pictures** (390 px, light and dark, the board on the left, the built screen on the right): `scratchpad/aitools-07-b/pt2-light.png`, `pt2-dark.png`, `pt2b-light.png`, `pt2b-dark.png`; every state alone is in `scratchpad/aitools-07-b/live/` (`light-10` to `light-20`, `dark-10` to `dark-20`: the list, a sample playing, the agreement, Your voice chosen, working, done, saved, the drafts, attached, the voice taken off). Differences from the boards, all known: the board's player shows 0:58 and the "Bio" chip (the stand-in's audio is under a second, and the chip is the Voice Intro's, G-AITOOLS-07-4); the board's voice list has no Tunde and no "Take my voice off" button (G-AITOOLS-07-5); "Example values" on the board's cost line is the board's own mark.
- **Default (lead), owner may override:** PT2b's Save and Use in a product rows are drawn for VoiceOver only. Quick voice, Sound effect and Music track keep their done view without them (their tests in `studioToolsFlow.test.tsx` pin "no Save, no Use in a product", and the task is VoiceOver's). The Hub saves any finished job, so adding the rows to them is one line (`savable` in `ToolScreen.tsx`) and three assertions.
- **Routes added (8):** `GET /ai-tools/voices/{voiceId}/sample`, `GET`/`POST`/`DELETE` `/ai-tools/own-voice[/consent]`, `POST`/`DELETE /ai-tools/jobs/{id}/save`; additive fields `sampleUrl`, `saved`, the `saved` query and `mediaJobId`. **Migration:** `20261105100000_ai_tools_voiceover_extras` (four nullable columns; rollback refuses while any holds a value). Round 2 changes no route and no migration.
- **Changed assertions (flag for the verifier):** `toolFlow.test.tsx` line 337 (round 1) pinned "no Save, no Use in a product" on the VoiceOver done view; this task builds them. Two typed fixtures (`tierModel.test.ts`, `verify/__tests__/model.test.ts`) gain `mediaJobId: null`. No other assertion was touched; `studioToolsFlow.test.tsx` is unchanged and passes.
- **Checks, round 2 (EXIT lines in `scratchpad/aitools-07-b/`):** app: tsc EXIT 0; eslint (no --fix) on the 8 changed `.ts`/`.tsx` files EXIT 0; jest `src/features/points`, `src/features/create`, `tierModel.test.ts` and `verify/__tests__/model.test.ts` (`--testTimeout=120000`): 16 suites, 288 tests, all pass, EXIT 0 (`voiceExtras` 11/11, `toolFlow` 32/32 with 8 new through the screen: the sample, no recording, Your voice leading and playing the Voice Intro, no play button without a Voice Intro, agree and run with `voiceId: own` and take it off, a refused agreement, Save and take out, Use in a product); gates 0 fail, 18 warn, EXIT 0 (one fix: a component named `SamplePlay` tripped the fake-data gate, now `PreviewPlay`; one literal gap now a token); `check_baseline` EXIT 0; `check_tasks --write` EXIT 0 (the first round's `order: -118` was taken by POINTS-11, now -117, and the `third-party` type lists V8). Backend (changed one header and one assertion): tsc EXIT 0; eslint on the two files EXIT 0; `ai-tools-voiceover-extras.contract.spec.ts` 17/17 EXIT 0; `contract:build` leaves the contract unchanged; gates 0 fail (134 warn, 88 accepted) and `check_baseline` EXIT 0. No route is added or changed, so the publishing-gate and rate-limit route inventories are not re-run. **`test:protected` (253 tests, 2 suites): 253/253 pass, EXIT 0, on this branch and on `origin/main` `b69aa7f`, both on a fresh migrated database with `npm run db:seed` and the plain mock WAWU ID on :8227. Round 1's 5 failures do not reproduce on either side under that setup: they were the environment (an unseeded or reused database or the mock's state), not this branch.**
- **Not done:** publishing a draft does not read `mediaJobId` yet (G-AITOOLS-07-3); the real provider's voice making, speech and delete (NOT RUN); a phone (the app was driven in the web export only).

## Gap rows (BACKEND_GAPS)

G-AITOOLS-01-1, G-POINTS-08-1, G-AITOOLS-01-4, G-POINTS-08-2 (and G-VOICE-01-6, the same fact) are closed by this task on the server and in the app. Filed: **G-AITOOLS-07-1** (no board draws a consent for VoiceOver; built from VF8's parts with the Voice Intro's line ending "for my VoiceOver", R-29), **G-AITOOLS-07-2** (no board draws where saved results are listed; the Hub lists them, `GET /ai-tools/jobs?saved=true`), **G-AITOOLS-07-3** (no board draws the draft list behind "Use in a product"; built from PT2b's rows, and publish does not use the audio yet), **G-AITOOLS-07-4** (the "Bio" chip on PT2b's player is the Voice Intro's, not drawn), **G-AITOOLS-07-5** (no board draws taking the agreement back; one secondary button), **G-AITOOLS-07-6** (the "Your voice" play button plays the Voice Intro, not a sample of the recording).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `docs/elevenlabs/API-FACTS.md`; `tasks/AITOOLS-01.md`, `AITOOLS-02.md`, `AITOOLS-04.md`, `POINTS-08.md`; `tasks/POINTS-10.md` (on `origin/wmt/POINTS-10`)
- Backend `src/ai-tools/own-voice/`, `src/ai-tools/ai-job.service.ts`, `src/ai-tools/voice/provider-copy.service.ts`

## Goal

A person hears a voice before choosing it, can read a VoiceOver in their own voice after agreeing to it (and take it back), and can save a finished result or attach it to a product draft.

## Capability checks

- [x] A voice row's sample plays from the Hub (backend spec check 1; app tests; live).
- [x] "Your voice" needs a recording and the person's agreement; the voice is made from their own recording and removed at the provider; the delete drops a voice the provider could not drop (checks 2 to 8).
- [x] A finished result can be saved and taken out; another person's cannot (check 9).
- [x] A result attaches to a draft and detaches; another person's cannot (checks 10 to 12).
- [x] The app screens match PT2 and PT2b in light and dark (pictures beside the boards, with the known differences above).

