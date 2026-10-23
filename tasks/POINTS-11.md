---
id: POINTS-11
title: Studio: Dubbing
owner: YOU
area: POINTS
order: -118
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-05, POINTS-10]
decisions: [R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
---
# POINTS-11 · Studio: Dubbing

## Current state

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T1. About 45 to 60 minutes of building.
- **Real prerequisites (not in `depends_on`):** POINTS-07 and POINTS-08 (Studio and the VoiceOver screens) are on mobile main and AITOOLS-01 is on backend main. They sit at orders 277, 278 and 267, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order and `depends_on` lists only the tasks cut with it.
- **Boards:** none draws this tool's own screen. The boards it follows are PT1 (the tile), PT2, PT2a, PT2b, PT2c (the pattern), PT3, PT3a, PT3b, PT7 (the sheets, built). They belong to POINTS-07 and POINTS-08 (a board is in exactly one screen task), so `artboards` is empty here. Where this tool needs a part no board draws, the part is built from the app's existing shared parts only, nothing new in look, and filed as G-POINTS-09-1 for the designer (R-29).
- **Backend it needs:** AITOOLS-05 (the long job, the language list, the dubbed audio and subtitles). Until it is on the Hub, the tile is not drawn.
- **Next:** a builder session (Sonnet) on branch `wmt/POINTS-11`, with the backend task's branch contract synced (`npm run api -- --backend <backend worktree>`); then a lean verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b and PT7 with `python3 scripts/design/render_design.py <IDs>` and LOOK at each, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-78, R-43, R-61, R-68, R-47, R-27 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/POINTS-07.md` (Studio, `useJobCheck`: PT3, PT3a, PT3b, PT7) and `tasks/POINTS-08.md` (the entry-driven tool screen `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`)
- `tasks/AITOOLS-05.md` (the language list, the long working state, FLAC output)
- `BACKEND_GAPS.md` G-POINTS-08-3 and the G-AITOOLS-05 rows

## Goal

A person picks a recording and a language and gets it back dubbed, leaves the screen while it works, and finds the result when they return.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47). `studioModel.ts` maps each tool id to its icon as PT1 draws it; a tool the Hub lists that the app does not know is not drawn.
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"), working read every 2 seconds, done, or failed with the Hub's own sentence ("No points were taken").
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and languages come from `GET /ai-tools` and the quote, never a literal. No provider name anywhere (R-68), no em-dash (R-5).
- **Tests** are written "a person can ..." and cover the tool's states through their real cause (a refused file, a failed job, a cap, a short balance).
- **File and language:** the file step of POINTS-10, then one language chosen from the Hub's list in single-choice rows (the same row as PT2's voice rows), then the cost line from the quote ("From 1,500 a minute" on the tile; the quote's number for this file and language on the screen).
- **Working:** PT2a with "You can leave this screen". The job id is kept on the phone until the person has seen the end, as POINTS-08 does for VoiceOver, so reopening Dubbing (or Studio) finds a job in flight. A dub can take minutes: the poll gentles after the first minute (the builder picks the steps and records them).
- **Done:** the dubbed audio in the player and the subtitles (WebVTT) offered through the phone's share sheet; the points line. The provider's lossless FLAC must play on the app (expo-audio): checked on the web export and on a device, or NOT RUN with the reason; if it cannot play, the job's audio is not offered and the gap is filed (G-AITOOLS-05-1 names it).
- **A video in gives audio out:** the file step may accept a video (the Hub reads the audio), and the done state says nothing about a video coming back.
- **Not drawn, filed as gaps (G-POINTS-09-1):** more than one language, the premium choice, a push when the dub is done, a list of past dubs (the clock icon).

## Capability checks

- [ ] A person picks a recording and a language and sees the cost for that file and language before anything runs.
- [ ] A person starts a dub, leaves the screen, comes back and finds the job still working, then done with the dubbed audio and the subtitles.
- [ ] A failed dub shows that no points were taken and the balance is unchanged; a language outside the Hub's list cannot be chosen.
- [ ] Short balance and daily cap sheets work for this tool.
- [ ] The states match PT2a, PT2b and PT2c in light and dark, compared picture with picture (V5); the language rows are recorded as an undrawn part.
- [ ] Playing the dubbed audio: checked on the web export and on a device, or reported NOT RUN with the reason (V10 is the owner's device run).
- [ ] Against the local backend on the stand-in, a real sign-in runs one dub to the end and reads it back (V9).

## History

None yet. Reports go to tasks/history/POINTS-11.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
