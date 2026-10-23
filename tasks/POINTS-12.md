---
id: POINTS-12
title: Studio: Receptionist
owner: YOU
area: POINTS
order: -117
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-06, POINTS-11]
decisions: [R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
---
# POINTS-12 · Studio: Receptionist

## Current state

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T1. About 45 to 60 minutes of building.
- **Real prerequisites (not in `depends_on`):** POINTS-07 and POINTS-08 (Studio and the VoiceOver screens) are on mobile main and AITOOLS-01 is on backend main. They sit at orders 277, 278 and 267, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order and `depends_on` lists only the tasks cut with it.
- **Boards:** none draws this tool's own screen. The boards it follows are PT1 (the tile), PT2, PT2a, PT2b, PT2c (the pattern), PT3, PT3a, PT3b, PT7 (the sheets, built). They belong to POINTS-07 and POINTS-08 (a board is in exactly one screen task), so `artboards` is empty here. Where this tool needs a part no board draws, the part is built from the app's existing shared parts only, nothing new in look, and filed as G-POINTS-09-1 for the designer (R-29).
- **Starts only when its fact is known:** G-AITOOLS-06-1. No board shows what the Receptionist does or what its screen looks like. The lead starts this task after the owner either names a board for it or rules that the pattern in Scope is the screen. Until then it stays todo, and the tile is not drawn (R-47).
- **Backend it needs:** AITOOLS-06 (the agent upkeep and the message route).
- **Next:** a builder session (Sonnet) on branch `wmt/POINTS-12`, with the backend task's branch contract synced (`npm run api -- --backend <backend worktree>`); then a lean verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b and PT7 with `python3 scripts/design/render_design.py <IDs>` and LOOK at each, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-78, R-43, R-61, R-68, R-47, R-27 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/POINTS-07.md` (Studio, `useJobCheck`: PT3, PT3a, PT3b, PT7) and `tasks/POINTS-08.md` (the entry-driven tool screen `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`)
- `tasks/AITOOLS-06.md` (what the engine does and does not do)
- `BACKEND_GAPS.md` the G-AITOOLS-06 row

## Goal

A person tells their Receptionist what they offer, then tries it by sending it messages and reading the replies, paying 20 points a message.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47). `studioModel.ts` maps each tool id to its icon as PT1 draws it; a tool the Hub lists that the app does not know is not drawn.
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"), working read every 2 seconds, done, or failed with the Hub's own sentence ("No points were taken").
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and languages come from `GET /ai-tools` and the quote, never a literal. No provider name anywhere (R-68), no em-dash (R-5).
- **Tests** are written "a person can ..." and cover the tool's states through their real cause (a refused file, a failed job, a cap, a short balance).
- **Set-up:** one screen of the app's existing text fields for the details the Hub's route takes (the Hub's limits as counters), with Save and a way to clear it.
- **Try it:** PT2's frame with a message box and the replies listed above it; the cost line reads the quote ("This uses 20 points"); each message runs `useJobCheck` and then the message route; a reply that fails shows that no points were taken. PT1's tile words come from the entry ("20 a message").
- **Not built, not drawn:** answering a person's real inbox, comments or calls; voice.
- If a board arrives before the build starts, the board wins over the pattern above (R-29).

## Capability checks

- [ ] A person saves their details, sends a message, reads the reply, and the points line shows 20 points taken.
- [ ] A failed message shows that no points were taken and the balance is unchanged.
- [ ] Details over the Hub's limit cannot be saved and say why; clearing the Receptionist removes it.
- [ ] Short balance and daily cap sheets work for this tool.
- [ ] The frame and states match PT2, PT2a and PT2c in light and dark, compared picture with picture (V5), or the board the owner names; every undrawn part is recorded for the designer.
- [ ] Against the local backend on the stand-in, a real sign-in sets up, sends a message and reads the reply back (V9).

## History

None yet. Reports go to tasks/history/POINTS-12.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
