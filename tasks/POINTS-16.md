---
id: POINTS-16
title: Studio: Voice changer, Dialogue and Clone your own voice (app)
owner: YOU
area: POINTS
order: -46
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-11, POINTS-13]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-16 · Studio: Voice changer, Dialogue and Clone your own voice (app)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-2. Order -46 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-2 (T1, app), tasks POINTS-16, POINTS-17, POINTS-18, POINTS-12 in that order, one builder, branch `wmt/POINTS-16` (it merges `wmt/POINTS-13` in), budget 180 steps; a lean T1 verifier, 65 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-16` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** VoiceOver offers "Your voice" from the Voice Intro recording (`OwnVoiceConsent`, `ownVoiceApi.ts`); there is no changer, no scene tool and no kept clone.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A person changes a recording into another voice, writes a scene for several voices, and keeps a clone of their own voice for all the voice tools.

## What a person does

- Voice changer: records or picks a clip, picks a voice, sees the cost for its length, runs it and hears the new voice.
- Dialogue: adds lines, picks each line's voice, sees the cost, runs it and hears the scene.
- Clone your own voice: reads the consent line, records a short sample, names it, taps Agree; "Your voice" is then offered everywhere a voice is picked; can remove it.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"); working read every 2 seconds; done, or failed with the Hub's own sentence ("No points were taken"). A long job keeps working if the person leaves: reopening the tool resumes the running job (`voiceoverIntent`, one record per account and tool), and the `ai_job_ready` notification opens it (a row in `src/features/push/routes.ts` and `kinds.ts`).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- **The done view is POINTS-13's** (Make it a piece first for creators, Save, Use in a product where it applies, quiet Download); this task only supplies the result to show.
- Voice changer reuses the file-tool parts (`FileParts.tsx`, `fileToolApi.ts`) with the voice rows (and the sample play button) of PT2. Dialogue: `ToolScreen` gains the `dialogue` kind, a list of line cards (a text box and a voice chip each, add and delete a line, at most the Hub's voices and characters, counter), built from existing rows. Clone: the consent card (`OwnVoiceConsent`) then a recording step (the existing recorder), a name field and Agree; a saved clone shows as a row with Remove (a confirm).
- "Your voice" appears in the voice lists of VoiceOver, Quick voice, Dialogue and Voice changer from the Hub's entry (the app adds no list of its own).

## Hub routes it calls

- `GET /ai-tools`, `POST /points/quote`, `POST /ai-tools/voice-changer/quote` and `/jobs`, `POST /ai-tools/dialogue/jobs`, `GET/POST/DELETE /ai-tools/my-voice`, `POST /uploads/presign` and confirm (`ai/input-audio`).

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Every cost is the Hub's. **points cost: PROVISIONAL, owner sets.** Suggested: Dialogue 250 a minute (900 characters x 1 credit x 0.278, working in API-FACTS "Points ratio"; the `eleven_v3` factor NOT KNOWN); Voice changer 400 a minute if it bills like the isolator (NOT KNOWN); Clone placeholder 100 once (not derived). The owner reviews them before this app ships.

## Screens

- Voice changer: clip row (record or choose), voice rows, cost line, Run. Dialogue: line cards, add a line, cost line, Run. Clone: consent, record, name, Agree, saved state with Remove. Working, done, failed as PT2a to PT2c.
- States: recording and playback, microphone refused, a clip too long or too short (the Hub's words), a line over the limit, more than the allowed voices, clone already saved, clone removed.
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A person records a clip, picks a voice, runs Voice changer and hears the result; a clip over the Hub's length is refused before Run.
- [ ] A person writes 3 lines with 2 voices and runs Dialogue; adding past the Hub's voice or character limit is refused with the reason.
- [ ] A person reads the consent, records, names and agrees: "Your voice" appears in VoiceOver's voice list for them; Remove deletes it and it disappears; a second clone is refused with the Hub's words.
- [ ] Declining the consent creates nothing; the consent line is the Hub's own words, shown exactly.
- [ ] A finished result's "Make it a piece" opens Create with format audio.
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- The consent card, the recording state, the saved-clone row with Remove, a dialogue with three lines.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] Recording a sample and a clip with the phone's microphone, permission asked once with words; playback before use; a recording interrupted by a phone call or the app going to the background is handled.
- [ ] A real clone of the owner's own voice made, used in VoiceOver, and removed.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call in this task (stand-in only); the real proof calls are AITOOLS-11's. Expected credit cost: NOT KNOWN except Dialogue (about 1 credit a character if `eleven_v3` bills like the standard models).

## History

None yet. Reports go to tasks/history/POINTS-16.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
