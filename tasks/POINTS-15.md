---
id: POINTS-15
title: Studio: Make a video and Talking photo (app)
owner: YOU
area: POINTS
order: -49
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [AITOOLS-10, POINTS-14]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-15 · Studio: Make a video and Talking photo (app)

## Current state

**Built 30 Oct 2026 (S2-APP-1, Sonnet builder, T1; mobile `wmt/S2-APP-1` on `origin/wmt/STORE-BUY-APP` `a77f50bb`, contract from backend `origin/main` `8e39c48` (`npm run api`); app only, HELD: not merged into `wmt/STORE-BUY-APP`, not sent; no native change, `package.json` and `app.json` untouched, fingerprint of this tree equals the base tree's on both platforms (`@expo/fingerprint`, Android `c2474bd9`, iOS `240378f1` as the lead keeps them); status verifying).**
- **Pictures (owner hard rule 1), 390 px dark and light, beside the nearest artboard** (PT1, PT2, PT2a, PT2b, PT2c, M22 rendered with `render_design.py`), taken from the dev web export through `/dev/studio` (a `__DEV__` gallery with canned data, tools switched off) and the real Studio and Create routes over a stubbed Hub: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-app-1-b/beside/` (pairs) and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-app-1-b/shots/` (the app alone): studio, image-input-empty, image-input-filled, image-working, image-done-creator, image-done-buyer, image-failed, photo-edit-input-empty, photo-edit-photo-chosen, video-input-filled, video-working, video-done-creator, talking-voice-choices, talking-input-ready, talking-done-creator, voiceover-done-creator, create-step3. Create's step 3 opens as "New Image, Step 3 of 5" with the file in; its upload-rules list shows its error state in that picture only because the picture script's stub of `GET /uploads/formats` is not whole (the screen is Create's own, untouched).
- **Production bundle:** `expo export --platform web` of this tree (no `--dev`): the gallery's canned text ("Describe a picture and see it.", "preview.test", "WAWU-PREVIEW") is in 0 files of the release export and in 1 file of the dev export; a control string ("Make it a piece") is in both. `app/dev/studio.tsx` requires `Gallery.tsx` only under `if (__DEV__)`; `route-guard.test.tsx` has the `dev/studio` row.
- **Gap rows** G-STUDIO2-APP-1 to G-STUDIO2-APP-3 in `BACKEND_GAPS.md`. **Default (lead), owner may override:** see each task's own line below.
- **Checks (EXIT lines in the hand-back):** tsc EXIT 0; eslint on the 29 changed files EXIT 0 (no `--fix`); jest `src/features/points`, `create`, `store`, `notifications`, `push`, `route-guard`, `abroad devRoute` 39 suites, 1,017 passed, 5 skipped (the skips are not mine), EXIT 0; new `mediaToolsFlow.test.tsx` 27, `mediaToolUnits.test.ts` 13, `resultDownload.test.ts` 4, all passing; gates EXIT 0 (0 fail, 17 pre-existing PROVISIONAL warnings), `check_baseline` EXIT 0, `check_tasks` EXIT 0.
- **POINTS-15 done, except one item the Hub does not allow.** "Make a video": description, shape chips (the Hub's), a length row (the Hub's lengths as chips), the optional photo row (POINTS-14's), the cost line from the Hub's quote for the chosen seconds (units = seconds, never multiplied by the app), Run, a working view that says it can be left and that the app will say when it is ready; reopening the tool finds the running job (the intent keeps the shape, seconds and photo key) and sends no second request; the finished clip plays in the player's own controls (`expo-video`: play, pause, scrub, full screen). "Talking photo": the photo row (required) and a voice row with two ways, "Choose a recording" (an MP3 or WAV, the Hub's list; uploaded to `ai/input-audio`, the Hub reads its length through `POST /ai-tools/talking-photo/quote` and the row shows "Your voice runs N seconds") and "Use a voice result" (the person's own finished voice jobs from `GET /ai-tools/jobs`, newest first); the cost is the Hub's for those seconds; a recording the Hub refuses (too long, unreadable) is refused before Run in the Hub's own sentence; the job body is `photoKey` with `audioKey` or `sourceJobId` and the quote's token. **"Record now" is NOT built (R-47):** the Hub takes only `audio/mpeg` and `audio/wav` for a talking photo and the phone's recorder (`expo-audio`) writes m4a on both phones and has no WAV encoder on Android; the line is filed as G-STUDIO2-APP-1 with the one fact that unblocks it (the Hub taking `audio/mp4` for this tool); the task file's "records now" capability check and the PHONE CHECK recording item are therefore NOT RUN. The ready notice opens the finished job (see POINTS-13).
- **Tests:** a person describes a clip, picks 6 seconds and the cost follows (1,500), picks 4 seconds and tall, runs it, leaves, reopens on the running job (one request), and the finished video plays; the ready notice opens the tool on the finished video; a start photo uploads and is used, removing it releases the upload, and the finished video becomes a video piece in Create; a large video shows progress and stops on Cancel; a person picks a photo and a recording and runs Talking photo (cost for the 12 seconds the Hub read); uses a voice result instead (only voice results are listed); a recording of the wrong type or one the Hub refuses is refused before Run. **PHONE CHECK:** the list below stays; the recording items are not applicable until G-STUDIO2-APP-1 closes. Real provider call: none, credits used none.

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-1. Order -49 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-1 (T1, app), tasks POINTS-13, POINTS-14, POINTS-15 in that order, one builder, branch `wmt/POINTS-13`, budget 150 steps (90 plus 30 for each extra task); a lean T1 verifier, 55 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-13` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** Studio has no video tool; the app has `expo-video` and `expo-audio` installed, so no native change is expected (the builder confirms the Android fingerprint is unchanged and reports it).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A person makes a short video from words (or from their photo), or makes their photo speak, and the result is one tap from being a video piece.

## What a person does

- Make a video: describes it, picks wide or tall and 4, 6 or 8 seconds, optionally adds a photo to start from, sees the cost, runs it, and may leave: a notification says when it is ready.
- Talking photo: picks a photo and a voice (records now, picks a recording, or picks one of their finished voice results), sees the cost for its length, runs it and watches the photo speak.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"); working read every 2 seconds; done, or failed with the Hub's own sentence ("No points were taken"). A long job keeps working if the person leaves: reopening the tool resumes the running job (`voiceoverIntent`, one record per account and tool), and the `ai_job_ready` notification opens it (a row in `src/features/push/routes.ts` and `kinds.ts`).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- **The done view is POINTS-13's** (Make it a piece first for creators, Save, Use in a product where it applies, quiet Download); this task only supplies the result to show.
- `ToolScreen` gains the `video` input kind: description, shape chips, a length row (the entry's lengths), the optional photo row (POINTS-14's), and the cost line that follows the chosen length ("This uses N points" = seconds times the Hub's rate, read from the quote, never multiplied by the app). Talking photo: the photo row and a voice row with three ways (record with the existing recorder, choose a file, "Use a voice result" listing the person's own finished voice jobs from `GET /ai-tools/jobs`), the speech length read by the Hub's quote and shown.
- Working takes minutes: the working screen says it can be left and the tool reopens on the running job; the result plays in the existing video player (`expo-video`) with play, pause and full screen. Icons added to `studioModel.ts`.

## Hub routes it calls

- `GET /ai-tools`, `POST /points/quote`, `POST /ai-tools/talking-photo/quote`, `POST /uploads/presign` and confirm (`ai/input-image`, `ai/input-audio`), `POST /ai-tools/video/jobs`, `POST /ai-tools/talking-photo/jobs`, `GET /ai-tools/jobs`, `GET /ai-tools/jobs/{id}`.

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Every cost is the Hub's. **points cost: PROVISIONAL, owner sets.** Provider cost per second NOT KNOWN for both; placeholders 250 a second of video and 200 a second of speech, not derived; measured by AITOOLS-10's two proof calls. The daily cap (5,000) bounds an 8 second clip at the placeholder; the owner decides on a video cap. The owner reviews the figures before this app ships.

## Screens

- Make a video: description, shape, length, photo row, cost line, Run. Talking photo: photo row, voice row (record, choose, use a result), cost line, Run. Working (PT2a, "you can leave"), done (the video; POINTS-13's card), failed (PT2c).
- States: recording (timer, stop, retake), recording refused (microphone permission), photo or voice uploading and refused, moderated, still working after the app was closed.
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A person describes a clip, picks 4 seconds and wide, sees the cost for 4 seconds, runs it, leaves the tool, and the ready notification opens the finished video, which plays (jest for the real handlers; V9 on the stack).
- [ ] A person adds a start photo to Make a video and it uploads and is used; removing it removes the upload.
- [ ] A person records a voice clip, picks a photo and runs Talking photo: the cost is for the clip's length as the Hub read it; choosing a finished voice result instead works; a clip over the Hub's limit is refused before Run.
- [ ] Closing and reopening the app while the clip is working returns to the running job, not a second one; a double tap on Run sends one request.
- [ ] A finished video's "Make it a piece" opens Create with format video.
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- The recording state, the voice row's three choices, and a video result with the player controls.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] Recording a voice clip with the phone's microphone (permission asked once with words, a refusal leaves choose-a-file working), and the recording plays back before it is used.
- [ ] A video made and watched on the phone, full screen and back; a 20 MB or larger result downloads and plays.
- [ ] The ready notification arrives with the app closed and opens the right job; the app killed and reopened mid-job returns to it.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call in this task (stand-in only); the real proof calls are AITOOLS-10's (a 4 second clip, a 480p talking photo). Expected credit cost: NOT KNOWN.

## History

None yet. Reports go to tasks/history/POINTS-15.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
