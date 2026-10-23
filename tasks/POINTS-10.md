---
id: POINTS-10
title: Studio: Captions and Clean audio
owner: YOU
area: POINTS
order: -119
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-04, POINTS-09]
decisions: [R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
---
# POINTS-10 · Studio: Captions and Clean audio

## Current state

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T1. About 45 to 60 minutes of building.
- **Real prerequisites (not in `depends_on`):** POINTS-07 and POINTS-08 (Studio and the VoiceOver screens) are on mobile main and AITOOLS-01 is on backend main. They sit at orders 277, 278 and 267, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order and `depends_on` lists only the tasks cut with it.
- **Boards:** none draws this tool's own screen. The boards it follows are PT1 (the tile), PT2, PT2a, PT2b, PT2c (the pattern), PT3, PT3a, PT3b, PT7 (the sheets, built). They belong to POINTS-07 and POINTS-08 (a board is in exactly one screen task), so `artboards` is empty here. Where this tool needs a part no board draws, the part is built from the app's existing shared parts only, nothing new in look, and filed as G-POINTS-09-1 for the designer (R-29).
- **Backend it needs:** AITOOLS-04 (the person's file going in, the length read by the Hub, Captions and Clean audio). Until it is on the Hub, neither tile is drawn.
- **Next:** a builder session (Sonnet) on branch `wmt/POINTS-10`, with the backend task's branch contract synced (`npm run api -- --backend <backend worktree>`); then a lean verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b and PT7 with `python3 scripts/design/render_design.py <IDs>` and LOOK at each, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-78, R-43, R-61, R-68, R-47, R-27 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/POINTS-07.md` (Studio, `useJobCheck`: PT3, PT3a, PT3b, PT7) and `tasks/POINTS-08.md` (the entry-driven tool screen `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`)
- `tasks/AITOOLS-04.md` (the upload folders, the types and byte cap, the length rule)
- `src/features/create/pickFile.ts`, `src/features/works/pickMedia.ts` and the upload parts they use (the app's existing way to pick and upload a file)
- `docs/elevenlabs/API-FACTS.md` sections "Speech to text" and "Voice isolator" (the accepted types and limits that the refusal words rest on)

## Goal

A person picks a recording from the phone, sees what it costs for its length, and gets a transcript with subtitles (Captions) or the cleaned recording (Clean audio).

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47). `studioModel.ts` maps each tool id to its icon as PT1 draws it; a tool the Hub lists that the app does not know is not drawn.
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"), working read every 2 seconds, done, or failed with the Hub's own sentence ("No points were taken").
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and languages come from `GET /ai-tools` and the quote, never a literal. No provider name anywhere (R-68), no em-dash (R-5).
- **Tests** are written "a person can ..." and cover the tool's states through their real cause (a refused file, a failed job, a cap, a short balance).
- **The file step** (`input.kind: file`): the screen shows the PT2 frame with a choose-a-recording row where the text box is. It uses the app's existing picker and presigned upload (progress, retry and a refusal in the Hub's own words for a wrong type, a file over the byte cap or a length over the minute cap). The cost line appears after the upload and reads the quote for the Hub's own reading of the length ("This uses 30 points" for 2 minutes), never a length the phone worked out.
- **Captions done:** the transcript as selectable text in the card where PT2b has the player, the subtitle file offered through the phone's share sheet (R-68), the points line ("15 points used" and what is left). Language is detected; no language picker (not drawn).
- **Clean audio done:** PT2b's player with the cleaned audio and the points line.
- **Working and failed:** PT2a and PT2c with the tool's name; a failed job says no points were taken.
- **Not drawn, filed as gaps (G-POINTS-09-1):** recording on the phone inside the tool, a before-and-after listen, editing the transcript, Save and Use in a product.

## Capability checks

- [ ] A person picks a 90 second recording and sees a cost for 2 minutes before anything runs.
- [ ] A person runs Captions and reads the transcript and can share the subtitle file; runs Clean audio and plays the result.
- [ ] A wrong type, a file over the byte cap, a recording over the minute cap and a failed upload each show the Hub's reason and nothing is held; a failed job shows that no points were taken.
- [ ] Short balance and daily cap sheets (PT3 family, PT7) work for these tools.
- [ ] The frames and states match PT2, PT2a, PT2b and PT2c in light and dark, compared picture with picture (V5); the file row, the transcript card and the share row are recorded as undrawn parts.
- [ ] Against the local backend on the stand-in, a real sign-in uploads, runs and reads back both tools (V9).

## History

None yet. Reports go to tasks/history/POINTS-10.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
