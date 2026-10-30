---
id: POINTS-13
title: Studio: every result goes into Create as a piece, Save, and a quiet Download (app)
owner: YOU
area: POINTS
order: -53
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [AITOOLS-08, POINTS-09, POINTS-10, POINTS-11]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-13 · Studio: every result goes into Create as a piece, Save, and a quiet Download (app)

## Current state

**Patch round 1 (30 Oct 2026, S2-APP-1 builder, on top of `a17686fb`; verifier said MERGE, lead's three points; same branch).**
- **Copy.** The working title names what is made, not the tool's verb phrase: "Making your image", "Editing your photo", "Making your video", "Making your talking photo" (`workingTitleFor` in `mediaToolModel.ts`); the older tools keep the board's "Making your {name}" (their names are nouns: VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio, Dubbing; their tests pin it and are untouched). The piece row reads "Into Create, as a video piece", "an audio piece", "an image piece". The screen-reader labels read "Download your image", "Your image. View larger", "Play your video" (`thingOf`); the nav title stays the tool's own name. Changed assertion: `mediaToolsFlow.test.tsx` "a creator sees Make it a piece first and largest ..." (the piece row's accessible name is now "Make it a piece. Into Create, as an image piece"). Added assertions in the same file: the four working titles, "Your image. View larger", "Download your image". No older test changed.
- **R-109** is in `DECISIONS.md`, word for word from `origin/wmt/S2-HUB-1-rec` (before R-110), so `check_tasks` passes here.
- **Pictures, retaken and added** (390 px, dark and light, each beside its nearest artboard, each looked at; stubs now answer the job reads, the piece route and Create's upload rules, so no 404 banner and no upload-rules error): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-app-1-b/beside/` (48 pairs, names `<screen>-<theme>-beside-<artboard>.png`), the app alone in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-app-1-b/shots2/`. Retaken: image-working, video-working, create-step3 (now "New Image, Step 3 of 5, Add a preview" with the cover chooser, beside M22). Added: photo-edit-photo-uploading, photo-edit-photo-refused (over 25 MB), photo-edit-result-beside-original (the edited picture with "Your photo" and the Make it a piece row), image-short-balance-sheet (PT3), talking-working, talking-failed, video-failed. Also in the folder: studio, image-input-empty, image-input-filled, photo-edit-input-empty, photo-edit-photo-chosen, video-input-filled, talking-voice-choices, talking-input-ready, image-working, image-done-creator, image-done-buyer, image-failed, video-done-creator, talking-done-creator, voiceover-done-creator. The PT3 board offers the wallet; the app shows Buy points and Not now (R-86), as the older tools do.

**Built 30 Oct 2026 (S2-APP-1, Sonnet builder, T1; mobile `wmt/S2-APP-1` on `origin/wmt/STORE-BUY-APP` `a77f50bb`, contract from backend `origin/main` `8e39c48` (`npm run api`); app only, HELD: not merged into `wmt/STORE-BUY-APP`, not sent; no native change, `package.json` and `app.json` untouched, fingerprint of this tree equals the base tree's on both platforms (`@expo/fingerprint`, Android `c2474bd9`, iOS `240378f1` as the lead keeps them); status verifying).**
- **Pictures (owner hard rule 1), 390 px dark and light, beside the nearest artboard** (PT1, PT2, PT2a, PT2b, PT2c, M22 rendered with `render_design.py`), taken from the dev web export through `/dev/studio` (a `__DEV__` gallery with canned data, tools switched off) and the real Studio and Create routes over a stubbed Hub: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-app-1-b/beside/` (pairs) and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-app-1-b/shots/` (the app alone): studio, image-input-empty, image-input-filled, image-working, image-done-creator, image-done-buyer, image-failed, photo-edit-input-empty, photo-edit-photo-chosen, video-input-filled, video-working, video-done-creator, talking-voice-choices, talking-input-ready, talking-done-creator, voiceover-done-creator, create-step3. Create's step 3 opens as "New Image, Step 3 of 5" with the file in; its upload-rules list shows its error state in that picture only because the picture script's stub of `GET /uploads/formats` is not whole (the screen is Create's own, untouched).
- **Production bundle:** `expo export --platform web` of this tree (no `--dev`): the gallery's canned text ("Describe a picture and see it.", "preview.test", "WAWU-PREVIEW") is in 0 files of the release export and in 1 file of the dev export; a control string ("Make it a piece") is in both. `app/dev/studio.tsx` requires `Gallery.tsx` only under `if (__DEV__)`; `route-guard.test.tsx` has the `dev/studio` row.
- **Gap rows** G-STUDIO2-APP-1 to G-STUDIO2-APP-3 in `BACKEND_GAPS.md`. **Default (lead), owner may override:** see each task's own line below.
- **Checks (EXIT lines in the hand-back):** tsc EXIT 0; eslint on the 29 changed files EXIT 0 (no `--fix`); jest `src/features/points`, `create`, `store`, `notifications`, `push`, `route-guard`, `abroad devRoute` 39 suites, 1,017 passed, 5 skipped (the skips are not mine), EXIT 0; new `mediaToolsFlow.test.tsx` 27, `mediaToolUnits.test.ts` 13, `resultDownload.test.ts` 4, all passing; gates EXIT 0 (0 fail, 17 pre-existing PROVISIONAL warnings), `check_baseline` EXIT 0, `check_tasks` EXIT 0.
- **POINTS-13 done.** One done view for every tool (`ResultView.tsx`, `DoneCard`): the picture, video or player, then "Make it a piece" first and largest (accent row, "Into Create, as a video | an audio | an image", creators only through `useCreatorGate`, only when the Hub's output says `pieceFormat`), then Save (every tool's done view now has it), then "Use in a product" (audio results only), then a small underlined muted "Download" under the card, then the points line. "Make it a piece": `POST /ai-tools/jobs/{id}/piece` with a fresh `Idempotency-Key` per tap (the same key again when a try got no answer), then `abandonDraft`, `setFormat`, `setFull` (the Hub's `key`, `fileUrl`, `contentType`, `bytes`, `name`; the picture's address as its preview), the title from `suggestedTitle`, and `/create-preview`; Back returns to the result intact and tapping again opens the same file without a second copy (`heldPiece`). `tier_required` opens the tiers, `product_limit_reached` the places sheet, any other refusal (no room) shows the Hub's own sentence on the result. A result with several files asks which one first in a list (`piece-picker`, `download-picker`). Download: `expo-file-system` to the cache with progress and a cancel, a picture or video to the photos (`expo-media-library`, permission asked once, words when refused), audio to the share sheet (`expo-sharing`, "Save to Files"); a failed first try reads the job again for a fresh link and tries once more. Web: the browser's own download. `ai_job_ready` (AITOOLS-08) is a notification kind and opens `/studio-tool?job=<id>` (the job names its tool; `openJobId` shows the finished job when the phone holds no record). Studio's caption reads "Every AI tool, paid in points" once a picture or video tool is drawn (R-47), the old caption otherwise.
- **Changed assertions (named, each because a done view now carries Save and "Use in a product" on every audio result and Save on a transcript, the task file's own ruling):** `studioToolsFlow.test.tsx` "PT2 · Quick voice ... runs it, and plays the audio" (was: no Save or Use in a product; now: Save and Use in a product present, no Bio, no Make it a piece for a non-creator); the same file's "PT2 · Sound effect and Music track ... plays the result", which runs for Sound effect and for Music track (two tests, same change); `fileToolsFlow.test.tsx` "PT2 · the file step: a person runs Captions, reads the transcript ..." (was: no Save; now: Save present, no Use in a product, no Bio). Every other existing test is untouched and passes: VoiceOver (`toolFlow`, `voiceExtras`), Dubbing, Clean audio, Captions, the Android back button.
- **Default (lead), owner may override:** Make it a piece replaces whatever draft Create held (the old draft's files go back to the Hub, as the Content tile does); it opens Create at step 3 and the preview stays the person's step.
- **Tests ("a user can ..."):** a creator sees Make it a piece first and largest, Save, a small Download (order and sizes asserted); taps it and Create opens on the preview step with format image, file and title, Back returns, tapping again sends no second copy; no room shows the Hub's sentence; a tier-less creator goes to the tiers; a non-creator sees Save and Download only; a result with no Create format shows no Make it a piece; Download saves to the photos, asks for permission once and says so when refused, retries an expired link once, shows progress and stops on Cancel; stems ask which file; Back leaves from input, working and done (Platform.OS android). **PHONE CHECK (not provable in jest; unchanged list in this file):** all items of the PHONE CHECK list below remain for a real phone; in jest the handlers ran over the phone's modules replaced at the edge. V9 (a real sign-in against the local backend on the stand-in): NOT RUN (builder budget; the stub-Hub pictures and jest only).

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-1. Order -53 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-1 (T1, app), tasks POINTS-13, POINTS-14, POINTS-15 in that order, one builder, branch `wmt/POINTS-13`, budget 150 steps (90 plus 30 for each extra task); a lean T1 verifier, 55 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-13` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** only VoiceOver's done view has Save and "Use in a product" (`ResultActions` and `DraftPicker`, `src/features/points/VoiceExtras.tsx`, gated by `savable = tool.id === 'voiceover'`); every other tool's done view is a player and nothing else, with no way on (the owner's complaint, 30 Oct). Create always starts at M20 and needs a picked file.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

The first thing a person sees on any finished Studio result is a way to make it a piece, with nothing to retype. Download is there but quiet.

## What a person does

- A creator finishes any tool (old or new) and taps "Make it a piece": Create opens on the preview step with the format chosen and the file already in it; Back returns to the result.
- Anyone taps the small "Download" under the card to keep the file on their phone. Anyone taps Save to keep it in their library.

## Scope

- **One done view for every tool** in `ToolScreen` (and the file tools' done states): the player or picture or video, then a card whose first row is "Make it a piece" (the primary row: the accent mark, "Into Create, as a {video | audio | image}", shown only when the Hub's output says `pieceFormat` and the account is a creator, `useCreatorGate`), then Save (as PT2b draws it), then "Use in a product" (kept, shown only for audio results, since drafts take audio), then a small text button "Download" under the card in the muted tone ("somewhat hidden", not a row, not a button). The points line stays.
- **Make it a piece:** `POST /ai-tools/jobs/{id}/piece` (AITOOLS-08) with the chosen `outputIndex` (a result with several files, such as stems, asks which one first, in the existing list pattern); on the answer `setFormat(format)` and the draft's full file are set from `{ key, fileUrl, contentType, bytes, name }`, the details step's title is prefilled from `suggestedTitle`, and the app pushes `/create-preview` (step 3 of 5), skipping M20 and M21. A person with no room is shown the storage-full words the upload step already draws. The tier and place gates are Create's own (M27, VF13) and stay as they are. A different format chosen later in Create gives the file back through the existing release.
- **Download:** the output's `downloadUrl` is fetched with `expo-file-system` to the cache, then an image or video is saved to the gallery through `expo-media-library` (permission asked once, with words if refused) and audio goes to the share sheet (`expo-sharing`, "Save to Files"). Large files show progress and can be cancelled; a failed download says so and nothing else changes. No new native module (all three are installed).
- **Result with no Create format** (a FLAC dub, an AAC clip): no "Make it a piece" is drawn (R-47); Save and Download remain.
- **Non-creators** see Save and Download only; there is no dead "Make it a piece" and no upsell inside Studio (Create's own gates do that work).
- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- The existing VoiceOver done view tests (`toolFlow`, `voiceExtras`) pass with only the assertions that the new first row changes updated, each named in the report with why.

## Hub routes it calls

- `POST /ai-tools/jobs/{id}/piece`, `GET /ai-tools/jobs/{id}` (`outputs[].pieceFormat, downloadUrl, contentType, bytes, name`), `POST/DELETE /ai-tools/jobs/{id}/save`, `PATCH /product-drafts/{id}` (existing).

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- No price here: this task adds none. Every tool keeps its own points; the done view shows "{n} points used" as PT2b draws it.

## Screens

- The done view (PT2b's frame): result, the card (Make it a piece, Save, Use in a product), the points line, the quiet Download. Create's step 3 (M22) opens prefilled; its own screens are not redrawn.
- States: the piece call working (the row shows a spinner), storage full, a result with no format, a creator and a non-creator, the download working and failed, the gallery permission refused.
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A creator finishes a VoiceOver, a Sound effect and a Captions job and taps "Make it a piece": Create opens at step 3 with format audio (or none for subtitles) and the file in the draft, the title prefilled; Continue reaches the details step with the draft intact (jest with the real handlers, then V9).
- [ ] The same for an image result (format image) and a video result (format video) from the stand-in, and for a stem picked from a list.
- [ ] A non-creator account sees no "Make it a piece" and still sees Save and Download; a result with no `pieceFormat` shows neither the row nor a dead end.
- [ ] Tapping Back from Create's step 3 returns to the result with the result intact; the player and the points line are unchanged.
- [ ] Download saves an image to the gallery, shares an audio file, shows progress and a cancel on a large file, and says so when permission is refused or the link has expired (a fresh read of the job gives a fresh link).
- [ ] Make it a piece is the first and largest thing on a creator's done view, Download the quietest (picture beside PT2b and a written comparison of sizes).
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- The done view for a creator and for a non-creator, for an audio, an image and a video result; Create's step 3 prefilled beside M22.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] Download of an image lands in the phone's gallery and opens there; an audio file saves through the share sheet to the phone's Files.
- [ ] Download of a large video (over 50 MB) on mobile data: progress, cancel, and the file plays after.
- [ ] From a finished result, Make it a piece opens Create and the piece reaches the end (price and review) on a real creator account, with the Android back button at every step.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call: this task is app only and uses the stand-in's results. Expected credit cost: none.

## Gaps and defaults

- Default (lead), owner may override: Make it a piece opens Create at step 3 (the preview stays the person's step); the product-draft attach stays for audio only.

## History

None yet. Reports go to tasks/history/POINTS-13.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
