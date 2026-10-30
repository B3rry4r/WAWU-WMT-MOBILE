---
id: POINTS-17
title: Studio: Music for a video and Split a song (app)
owner: YOU
area: POINTS
order: -45
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [AITOOLS-12, POINTS-16]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-17 · Studio: Music for a video and Split a song (app)

## Current state

**Built 30 Oct 2026 (S2-APP-2, Sonnet builder, T1; mobile `wmt/S2-APP-2` on `origin/wmt/S2-APP-1` `91be8d5c`, contract from backend `origin/wmt/S2-HUB-3` `483a27d` (`npm run api`, main plus part 3); app only, HELD: not merged into `wmt/STORE-BUY-APP`, not sent; no native change, `package.json` and `app.json` untouched, fingerprints equal the base tree's: Android `c2474bd9`, iOS `240378f1`; status verifying).**
- **Pictures (owner hard rule 1), 390 px dark and light, each beside its nearest artboard** (PT1, PT2, PT2a, PT2b, PT2c, PT3 rendered with `render_design.py`; no board draws these tools, so every picture is "PT2 pattern"): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2app2-b/pics/beside/` (pairs) and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2app2-b/pics/shots/` (the app alone), 49 screens in both themes, taken from the dev web export over a stubbed Hub (no real host: every non-local address is stopped). Studio with the eight new tiles; for each tool the empty and filled input, working, done, failed, and the PT3 short-balance sheet (Dialogue, Receptionist). The tools stay switched off in production: the gallery (`/dev/studio`, `__DEV__` only) is extended with the new tools, and a production `expo export` has 0 files carrying its canned text ("preview.test", "WAWU-PREVIEW", "Warm and clear", "Say it again in another voice") where the dev export has 1; the screens' own code ("Make it a piece", `scene-add`, `receptionist-setup`) is in both.
- **POINTS-17 done.** Music for a video and Split a song (icons Video, SlidersHorizontal) are file tools that list only their one kind of file (`only`). Music for a video: a video from the library, checked before upload against the Hub's bytes and, when the phone says how long it is (`ChosenFile.seconds`), its longest in seconds; an optional mood box with its counter; a big upload shows progress and a Cancel that stops it and holds nothing; the done view is the player and one line that the music is separate from the video. Split a song: a Parts row (the Hub's 2 and 6), and a parts list (`PartsList.tsx`): each part a play button (one plays at a time), the Hub's name and its own "Make it a piece" (the `outputIndex` of that part, `usePieceMaker` extracted from the piece row); the single card row is not drawn for it. A flat price (one use, one track) takes its units from the Hub's quote and the length line says how long the Hub read the file to be.

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-2. Order -45 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-2 (T1, app), tasks POINTS-16, POINTS-17, POINTS-18, POINTS-12 in that order, one builder, branch `wmt/POINTS-16` (it merges `wmt/POINTS-13` in), budget 180 steps; a lean T1 verifier, 65 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-16` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** Studio's Music track makes music from words; a person's own video or song cannot go in except through Captions, Clean audio and Dubbing.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A creator gets music made for their clip, and splits a song into parts, and moves a part into Create.

## What a person does

- Music for a video: picks a video from the library, optionally says the mood, sees the cost, runs it and plays the music (audio only; it is not put on the video).
- Split a song: picks a song, chooses two parts or six, sees the cost, runs it and plays each part, then makes the one they want a piece.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"); working read every 2 seconds; done, or failed with the Hub's own sentence ("No points were taken"). A long job keeps working if the person leaves: reopening the tool resumes the running job (`voiceoverIntent`, one record per account and tool), and the `ai_job_ready` notification opens it (a row in `src/features/push/routes.ts` and `kinds.ts`).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- **The done view is POINTS-13's** (Make it a piece first for creators, Save, Use in a product where it applies, quiet Download); this task only supplies the result to show.
- Both are file tools on `FileParts.tsx`: Music for a video picks a video (library or camera roll, size and length checked against the Hub's limits before upload, a big upload with progress and cancel) and has an optional mood box; the done view says in one line that the music is separate from the video. Split a song picks audio and shows a two or six parts choice from the entry; the result is a list of parts, each with a play button, a name from the Hub and "Make it a piece" (POINTS-13's outputIndex path).

## Hub routes it calls

- `GET /ai-tools`, `POST /points/quote`, `POST /ai-tools/video-music/quote` and `/jobs`, `POST /ai-tools/stems/quote` and `/jobs`, `POST /uploads/presign` and confirm (`ai/input-video`, `ai/input-audio`).

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Every cost is the Hub's. **points cost: PROVISIONAL, owner sets.** Provider cost NOT KNOWN for both; placeholders 500 a track and 300 a song, not derived; measured by AITOOLS-12's proof calls. The owner reviews them before this app ships.

## Screens

- Music for a video: video row (thumbnail, length, size), mood box, cost line, Run. Split a song: audio row, parts chips, cost line, Run. Working, done (the music, or the parts list), failed.
- States: video too long or too big (the Hub's words), upload in progress and cancelled, the parts list with one playing at a time, a plan refusal ("This isn't available right now").
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A person picks a 20 second video, runs Music for a video and plays the music; a video over the limits is refused before upload with the reason.
- [ ] A person splits a song into two and into six parts and plays each; only one part plays at a time; picking one part and "Make it a piece" opens Create with that part.
- [ ] Cancelling a big upload stops it and holds nothing; the same upload resumed or retried sends once.
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- The video row with a thumbnail, the upload progress, the parts list with a part playing.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] A video of 100 MB or more from the phone's library uploads on mobile data with progress, and a cancel works.
- [ ] Each part plays through the speaker and only one at a time; the app in the background keeps or stops playback as the app's player does elsewhere.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call in this task (stand-in only); the real proof calls are AITOOLS-12's. Expected credit cost: NOT KNOWN.

## History

None yet. Reports go to tasks/history/POINTS-17.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
