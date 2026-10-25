---
id: POINTS-08
title: One AI tool: VoiceOver, working, done, failed
owner: YOU
area: POINTS
order: 278
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [POINTS-07, AITOOLS-01, VERIFY-01]
decisions: [R-43, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [PT2, PT2a, PT2b, PT2c]
---
# POINTS-08 · One AI tool: VoiceOver, working, done, failed

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 15.
- **Status:** merging (lead). Verdict: PASS (one job and one hold per key; done commits, failure releases; the poll stops; no provider name); 2 lows and a note (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-08.md`). Stacked in batch 15 by MERGE-15 (backend `wmt/MERGE-15`, mobile `wmt/MERGE-15`); not on main.
- **Branch:** mobile `wmt/POINTS-08` on `origin/wmt/POINTS-07` `1cd84d3b` (contract synced from backend `90ab9aa`, no backend change, no PR).
- **Built:** `/studio-tool?tool=voiceover` (`ToolScreen`, PT2, PT2a, PT2b, PT2c), driven by the tool's description from `GET /ai-tools` (name, text limit, characters per minute, cost, voices); Studio's VoiceOver tile now opens it. Run mounts `useJobCheck` (PT3, PT3a, PT3b, PT7) then `POST /ai-tools/voiceover/jobs` with one `Idempotency-Key` kept on the phone (`voiceoverIntent.ts`); working reads `GET /ai-tools/jobs/{id}` every 2 s; done plays the audio (`ResultPlayer`) and says what it took; failed shows the Hub's own sentence.
- **Not drawn (R-47), gaps filed:** the play button on each voice row (G-POINTS-08-1), Save and "Use in a product" (G-POINTS-08-2, same fact as G-AITOOLS-01-4, so the capability check "attach the audio to a draft" is open), "Your voice" (G-AITOOLS-01-1), the "Bio" chip (it names the Voice Intro), "Example values". G-POINTS-08-3: the Hub has no job list, so a finished job seen once cannot be found again.
- **Shared-change rows:** POINTS-08 #1 (`VoicePlayer` takes a `name`; until then `ResultPlayer` stands in and goes with it), #2 (one `studioFlow` case changed because its tile is now a button).
- **NOT RUN:** a real voice provider (never called); V10 on a device; playing the audio on a phone (web export only: a click plays the stand-in's file).
- **Next:** the batch 15 pull request (the lead). The verifier's lows are in SWEEP-APP (POINTS-08 L1, L2).
- **History:** none yet. Reports go to tasks/history/POINTS-08.md.

Status set to review by the records sync, 25 Oct 2026: merged as app ec35fb48, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person runs VoiceOver from text: the input, the voice, the cost, Run; sees it working; gets the audio to play, save and use in a product; or a failure that says no points were taken. The pattern serves every tool the Hub adds later.

## Scope

- New files under `src/features/points/`. Input up to the Hub's character limit, voice list, cost line from the quote ("This uses 250 points"), Run calls `POST /ai-tools/voiceover/jobs`, working polls `GET /ai-tools/jobs/{id}`, done shows a player (not the Voice Intro player), Save and "Use in a product" attach the audio to a draft (VERIFY-01 drafts). PT2c: the failed state reads "No points were taken" from the Hub.
- Built as one reusable tool screen driven by the tool's description from `GET /ai-tools`, so a later tool is a catalogue entry, not a new screen.

## Capability checks

- [ ] A person types text, sees the cost first, runs it, and plays the finished audio.
- [ ] A failed job shows that no points were taken and the balance is unchanged.
- [ ] A person can attach the audio to one of their drafts.
- [ ] Each board above (PT2, PT2a, PT2b, PT2c) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-08.md](history/POINTS-08.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
