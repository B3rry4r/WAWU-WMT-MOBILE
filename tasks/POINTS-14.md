---
id: POINTS-14
title: Studio: Make an image and Edit a photo (app)
owner: YOU
area: POINTS
order: -50
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-09, POINTS-13]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-14 · Studio: Make an image and Edit a photo (app)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-1. Order -50 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-1 (T1, app), tasks POINTS-13, POINTS-14, POINTS-15 in that order, one builder, branch `wmt/POINTS-13`, budget 150 steps (90 plus 30 for each extra task); a lean T1 verifier, 55 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-13` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** Studio has no image tool; `ToolScreen` takes `text`, `prompt` and `file` kinds only.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A person describes a picture and sees it, or edits their own photo with words, and the result is one tap from being a piece.

## What a person does

- Make an image: describes it, picks square, portrait or wide, sees "This uses N points", taps Run, sees the picture.
- Edit a photo: picks a photo (library or camera), says the change, sees the cost, taps Run, sees the edited photo next to the original.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"); working read every 2 seconds; done, or failed with the Hub's own sentence ("No points were taken"). A long job keeps working if the person leaves: reopening the tool resumes the running job (`voiceoverIntent`, one record per account and tool), and the `ai_job_ready` notification opens it (a row in `src/features/push/routes.ts` and `kinds.ts`).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- **The done view is POINTS-13's** (Make it a piece first for creators, Save, Use in a product where it applies, quiet Download); this task only supplies the result to show.
- `ToolScreen` gains the `image` input kind: the description box (counter against the entry's limit), a shape row (the entry's options as three chips), and for Edit a photo a "Choose a photo" row (library or camera through the existing pick and upload parts, one photo, jpeg, png or webp up to 25 MB, a thumbnail once chosen, replaceable). A HEIC photo from an iPhone is converted to JPEG on the phone before upload (the Hub takes jpeg, png, webp only).
- The result is shown full width in the existing result frame with a tap to view larger; the done view is POINTS-13's. Icons: "Make an image" and "Edit a photo" are added to `studioModel.ts` from the app's icon set.

## Hub routes it calls

- `GET /ai-tools`, `POST /points/quote`, `POST /uploads/presign` and confirm (folder `ai/input-image`), `POST /ai-tools/image/jobs`, `POST /ai-tools/photo-edit/jobs`, `GET /ai-tools/jobs/{id}`.

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Every cost is the Hub's (AITOOLS-09's settings). **points cost: PROVISIONAL, owner sets.** Provider cost per image NOT KNOWN; placeholder 100 each, not derived; measured by the AITOOLS-09 proof call. The owner reviews the figure before this app ships.

## Screens

- Make an image: description, shape chips, cost line, Run. Edit a photo: the same plus the photo row. Working (PT2a with the tool's name), done (the picture; POINTS-13's card), failed (PT2c).
- States: no photo chosen (Run off), photo uploading, photo refused (type or size), moderated (the Hub's sentence), offline.
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A person types a description, picks a shape, sees the cost from the Hub, runs it and sees the stand-in's picture; the same with each shape.
- [ ] A person picks a photo from the library, uploads it, types a change, runs it and sees the result; a camera shot works the same (jest on android with the real picker handlers and FormData upload, mocked only at the network edge).
- [ ] A photo of the wrong type or over 25 MB is refused before Run with the reason; a HEIC photo is converted and accepted; replacing the photo deletes the old upload.
- [ ] A moderated result says so and that no points were taken; a result tapped opens larger and closes with Back.
- [ ] A finished picture's "Make it a piece" opens Create with format image (POINTS-13's path).
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- Edit a photo with a chosen photo, uploading and refused states; the result beside the original.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] A photo taken with the camera and one chosen from the gallery both upload and edit, including an iPhone HEIC photo and a photo over 10 MB.
- [ ] Camera permission asked once with words, and a refusal leaves the library pick working.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call in this task (stand-in only); the real proof call is AITOOLS-09's, one 512 px image. Expected credit cost: NOT KNOWN.

## History

None yet. Reports go to tasks/history/POINTS-14.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
