---
id: POINTS-09
title: Studio: Quick voice, Sound effect and Music track
owner: YOU
area: POINTS
order: -120
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-02, AITOOLS-03]
decisions: [R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
---
# POINTS-09 · Studio: Quick voice, Sound effect and Music track

## Current state

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T1. About 45 to 60 minutes of building.
- **Real prerequisites (not in `depends_on`):** POINTS-07 and POINTS-08 (Studio and the VoiceOver screens) are on mobile main and AITOOLS-01 is on backend main. They sit at orders 277, 278 and 267, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order and `depends_on` lists only the tasks cut with it.
- **Boards:** none draws this tool's own screen. The boards it follows are PT1 (the tile), PT2, PT2a, PT2b, PT2c (the pattern), PT3, PT3a, PT3b, PT7 (the sheets, built). They belong to POINTS-07 and POINTS-08 (a board is in exactly one screen task), so `artboards` is empty here. Where this tool needs a part no board draws, the part is built from the app's existing shared parts only, nothing new in look, and filed as G-POINTS-09-1 for the designer (R-29).
- **Backend it needs:** AITOOLS-02 (Quick voice, the catalogue shape and the job list) and AITOOLS-03 (Sound effect and Music track). Until each is on the Hub, its tile is not drawn.
- **Next:** a builder session (Sonnet) on branch `wmt/POINTS-09`, with the backend task's branch contract synced (`npm run api -- --backend <backend worktree>`); then a lean verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b and PT7 with `python3 scripts/design/render_design.py <IDs>` and LOOK at each, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-78, R-43, R-61, R-68, R-47, R-27 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/POINTS-07.md` (Studio, `useJobCheck`: PT3, PT3a, PT3b, PT7) and `tasks/POINTS-08.md` (the entry-driven tool screen `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`)
- `tasks/AITOOLS-02.md` and `tasks/AITOOLS-03.md` (the routes, the entry shape, the limits)
- `BACKEND_GAPS.md` G-POINTS-07-3, G-POINTS-08-1, G-POINTS-08-2, G-POINTS-08-3

## Goal

A person opens Quick voice, Sound effect or Music track from Studio, sees what it costs, runs it and plays what comes back. The three share POINTS-08's screen: they are catalogue entries, not new screens.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47). `studioModel.ts` maps each tool id to its icon as PT1 draws it; a tool the Hub lists that the app does not know is not drawn.
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"), working read every 2 seconds, done, or failed with the Hub's own sentence ("No points were taken").
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and languages come from `GET /ai-tools` and the quote, never a literal. No provider name anywhere (R-68), no em-dash (R-5).
- **Tests** are written "a person can ..." and cover the tool's states through their real cause (a refused file, a failed job, a cap, a short balance).
- **Quick voice** (`input.kind: text`): PT2 exactly, titled from the entry ("Quick voice"): the text box with its counter, the voice rows from the entry, "About N minutes", the cost line from the quote ("This uses 125 points" for one minute), Run.
- **Sound effect and Music track** (`input.kind: prompt`): PT2's layout with the prompt box (its counter against the entry's limit) and no voice rows and no "About N minutes" line (these are flat prices: a use, a track). The cost line reads the quote ("This uses 75 points", "This uses 500 points"). PT1's tile words come from the entry's unit ("75", "500", as the board draws a flat tool without "a minute").
- **Working, done, failed:** PT2a ("Making your Sound effect" from the entry's name), PT2b without the "Bio" tag (that tag names the Voice Intro) and without Save or "Use in a product" until those exist (G-AITOOLS-01-4, as POINTS-08), PT2c.
- **Not drawn, filed as gaps:** a length for a sound effect or a track, an instrumental switch, the play button on a voice row, Save and Use in a product, the clock icon's history (the route `GET /ai-tools/jobs` exists after AITOOLS-02, no board draws the list: G-POINTS-09-1).
- Regenerate the API types from the backend branches; add the three icons to `studioModel.ts`; generalise `voiceoverApi.ts` and `voiceoverIntent.ts` by tool id without changing VoiceOver's behaviour (its tests pass untouched).

## Capability checks

- [ ] A person opens Quick voice from Studio, sees "125 a minute" from the Hub, types text, picks a voice, sees the cost, runs it and plays the audio.
- [ ] A person describes a sound and a track and plays each result; the cost lines read 75 and 500 points from the quote.
- [ ] A failed job shows that no points were taken and the balance is unchanged, for each tool.
- [ ] With too few points the PT3 sheets appear for these tools and nothing runs until confirmed; past the daily cap PT7 names the reset time.
- [ ] A tool the Hub lists that the app has no screen for is not drawn; a tool the Hub does not list is not drawn.
- [ ] PT2, PT2a, PT2b and PT2c, as rendered for each tool, match the boards in light and dark, compared picture with picture (V5).
- [ ] VoiceOver still passes its tests untouched.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool and reads the audio back (V9).

## History

None yet. Reports go to tasks/history/POINTS-09.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
