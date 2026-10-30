---
id: POINTS-13
title: Studio: every result goes into Create as a piece, Save, and a quiet Download (app)
owner: YOU
area: POINTS
order: -53
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-08, POINTS-09, POINTS-10, POINTS-11]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-13 · Studio: every result goes into Create as a piece, Save, and a quiet Download (app)

## Current state

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
