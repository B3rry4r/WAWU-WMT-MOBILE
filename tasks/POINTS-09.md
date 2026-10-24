---
id: POINTS-09
title: Studio: Quick voice, Sound effect and Music track
owner: YOU
area: POINTS
order: -120
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [AITOOLS-02, AITOOLS-03]
decisions: [R-79, R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
---
# POINTS-09 · Studio: Quick voice, Sound effect and Music track

## Current state

As of 24 Oct 2026, built, status verifying (builder: Sonnet, T1; mobile `wmt/POINTS-09` on `origin/main` `80828caf`; no PR). The Hub routes are on backend `wmt/AITOOLS-03` `542bc86` (not merged yet): the app's contract is synced from that branch (`contract/SOURCE_COMMIT` says so), so `npm run api -- --backend` once AITOOLS-02 and AITOOLS-03 are on backend main gives the same file.
- **Before:** one tool had a screen (VoiceOver). `ToolScreen` took words and a voice only, `voiceoverApi.startVoiceover` posted to one route, `studioModel.LOOKS` was keyed by guessed ids (`quick_voice`, `sound_effect`) that the Hub never sends, StudioScreen drew a tile for every tool the Hub listed, `costLine` said "a track".
- **After:** the three tools are catalogue entries on the same screen. `ToolScreen` branches on the entry's `input.kind` (a missing kind is `text`, so VoiceOver's entry and its 21 tests are untouched):
  - **Quick voice** (`text`): PT2 as drawn, titled from the entry: words box and counter, voice rows from the entry, "About N minutes", cost line from the quote ("This uses 125 points"), Run.
  - **Sound effect and Music track** (`prompt`): PT2's layout with the description box (placeholder is the Hub's own line for the tool, label "Description", count against the entry's limit), no voice rows, no length line; the quote is one use or one track whatever the length ("This uses 75 points", "This uses 500 points").
  - **PT2a, PT2b, PT2c:** "Making your {name}" from the entry, the player without "Bio", no Save or Use in a product; failed shows the Hub's own sentence.
  - **Tiles:** `isBuiltTool` (ids `voiceover`, `quick-voice`, `sound-effect`, `music`, the Hub's own) gates the tile in Studio and the names on the Create hub's Studio card; a tool the Hub lists that the app has no screen for is not drawn (R-47), and its route opens "not available". PT1's words: "125 a minute", "75", "500" (`costLine`: a use or a track is the count alone).
  - **Generalised without changing VoiceOver:** `voiceoverApi.startJob` posts to the tool's own route by id (`voiceover`, `quick-voice`, `sound-effect`, `music`), one `Idempotency-Key` per job, the same key on a resend, a new one on Try again; `voiceoverIntent` keeps one record per account and per tool (VoiceOver's storage key is unchanged), so a Sound effect left working is never written over by a Music track; `AiTool` reads a missing `input.kind` as `text`.
- **Not drawn, filed (G-POINTS-09-1, -2, -3):** a length for a sound effect or a track, the instrumental switch, the play button on a voice row, Save and Use in a product, the clock icon's history, the "Bio" tag.
- **Checks (EXIT 0 each):** tsc; eslint (no --fix) on the 9 changed `.ts`/`.tsx` files; jest `src/features/points` and `src/features/create` 11 suites 217/217 (198 before, plus `studioToolsFlow` 19; VoiceOver's `toolFlow` 21 and `voiceoverModel` 6 untouched; the 19 on a checkout of main: 16 fail, 3 pass); gates 0 fail, 18 warn, 0 accepted (as before), `check_baseline`; `check_tasks --write`.
- **Live look (V9; local stack `pt09`, backend `542bc86` on the Nuvion and voice stand-ins, web export at 390 by 844, Chromium, dark and light):** one person with 3,000 points ran one job of each tool. Each showed "Making your {name}", then done with a player that played (Sound effect and Music track: the label went to "Pause", `currentTime` 0.97 s; Quick voice, on a long text: the same). The Hub's costs, 125 (a minute), 75 and 500, were held at once (balance 3,000 to 2,875 to 2,800 to 2,300) and kept. A job the stand-in failed (`[[fail]]`) said "That didn't work / No points were taken. Try again." for each tool and the balance went back to 2,300. A person with 60 points asked to run a Sound effect got "Not enough points" and nothing was started. Pictures: `scratchpad/points-09-b/pics/` (`studio`, `{tool}-1-empty` to `-5-playing`, `-4-failed`, `sound-effect-6-short`, each `-dark` and `-light`).
- **Not done / for the verifier:** the Hub's list order (VoiceOver, Quick voice, Sound effect, Music track) sets the tile order, PT1 draws Music before Sound effect; the daily cap (PT7) is covered by tests, not run on the stack; no real provider (the audio is the stand-in's silent clips); PT2a's "About a minute" is the board's line and a real track may take longer (G-POINTS-09-3).
- **History:** tasks/history/POINTS-09.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b and PT7 with `python3 scripts/design/render_design.py <IDs>` and LOOK at each, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-79 (what Quick voice is), R-78, R-43, R-61, R-68, R-47, R-27 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
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
- **Quick voice** (`input.kind: text`; a fast, cheaper read-aloud: the same voices as VoiceOver on the provider's faster model, 125 points a minute, R-79): PT2 exactly, titled from the entry ("Quick voice"): the text box with its counter, the voice rows from the entry, "About N minutes", the cost line from the quote ("This uses 125 points" for one minute), Run.
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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-09.md](history/POINTS-09.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
