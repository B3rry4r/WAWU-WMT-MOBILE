---
id: POINTS-18
title: Studio: Audiobook and Podcast maker (app)
owner: YOU
area: POINTS
order: -42
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-13, POINTS-16]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-18 · Studio: Audiobook and Podcast maker (app)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-2. Order -42 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-2 (T1, app), tasks POINTS-16, POINTS-17, POINTS-18, POINTS-12 in that order, one builder, branch `wmt/POINTS-16` (it merges `wmt/POINTS-13` in), budget 180 steps; a lean T1 verifier, 65 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-16` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** VoiceOver is capped at 5,000 characters; there is no long-form tool. The Create flow's audio format takes one long mp3 or wav.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A person turns a long text into an audiobook, or a text or link into a podcast, and the result is one tap from being an audio piece.

## What a person does

- Audiobook: pastes text or picks a text file, picks a voice, sees chapters, length and cost, runs it, may leave, and is told when it is ready.
- Podcast maker: gives a text or a link, picks one host or two, a length and a language, sees the cost, runs it and plays it.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"); working read every 2 seconds; done, or failed with the Hub's own sentence ("No points were taken"). A long job keeps working if the person leaves: reopening the tool resumes the running job (`voiceoverIntent`, one record per account and tool), and the `ai_job_ready` notification opens it (a row in `src/features/push/routes.ts` and `kinds.ts`).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- **The done view is POINTS-13's** (Make it a piece first for creators, Save, Use in a product where it applies, quiet Download); this task only supplies the result to show.
- Audiobook: `ToolScreen`'s `text` kind with a larger box and a text-file choice (`.txt` through the document picker), a chapters line from the Hub's quote, the length and the cost from the quote, voice rows. Podcast: `ToolScreen`'s `podcast` kind: a Text or Link switch, the box or link field (https only, checked with words before Run), a host chips row (one or two, with a voice row each), a length row (short, standard, long from the entry) and a language row from the entry.
- Both work for minutes: the working screen says they can be left, the ready notification opens them, and the result plays in the existing player (seek bar for a long file). The done view is POINTS-13's: an audiobook is one audio piece.

## Hub routes it calls

- `GET /ai-tools`, `POST /points/quote`, `POST /ai-tools/audiobook/jobs`, `POST /ai-tools/podcast/jobs`, `GET /ai-tools/jobs/{id}`.

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Every cost is the Hub's. **points cost: PROVISIONAL, owner sets.** Suggested: Audiobook 250 a minute (900 characters x 1 credit x 0.278; the per-character factor NOT KNOWN); Podcast short 750, standard 1,250, long 2,500 (3, 5 and 10 minutes at 250; the provider's language-model cost is NOT KNOWN and not included). The daily cap (5,000) stops an audiobook over 20 minutes: the owner decides on a long-form cap. The owner reviews them before this app ships.

## Screens

- Audiobook: text box (large), file choice, voice rows, chapters and length line, cost line, Run. Podcast: Text or Link, host chips, length, language, cost, Run. Working with "you can leave", done with a long-file player, failed.
- States: text over the Hub's limit, a link that is not https, the daily cap sheet (PT7), a podcast unavailable (not listed), a long job reopened after the app was closed.
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A person pastes 40,000 characters, sees the chapters, length and cost from the Hub, runs the Audiobook, leaves, and the ready notification opens a long audio that plays and seeks.
- [ ] A person picks a `.txt` file and it fills the box; a file of another type or over the limit is refused with the reason.
- [ ] A person runs a Podcast from a text and from an https link; a link that is not https is refused before Run; two hosts need two different voices.
- [ ] Past the daily cap the PT7 sheet names the reset time and nothing runs; a double tap on Run sends one request.
- [ ] A finished audiobook's "Make it a piece" opens Create with format audio and the one long file.
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- The large text box with a file chosen, the chapters line, the Podcast length and host rows, the long-file player.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] A long audiobook plays on the phone with the screen locked and from the notification, and seeking works on a file of an hour or more.
- [ ] A text file picked from the phone's files app fills the box; pasting a very long text does not freeze the keyboard.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call in this task (stand-in only); the real proof calls are AITOOLS-13's. Expected credit cost: audiobook about 100 for the 100 character proof if the model bills 1 a character (NOT KNOWN); podcast NOT KNOWN.

## History

None yet. Reports go to tasks/history/POINTS-18.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
