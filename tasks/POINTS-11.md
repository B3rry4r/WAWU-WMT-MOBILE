---
id: POINTS-11
title: Studio: Dubbing
owner: YOU
area: POINTS
order: -118
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [AITOOLS-05, POINTS-10]
decisions: [R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-11 · Studio: Dubbing

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B11), mobile `wmt/POINTS-11` on `origin/wmt/POINTS-10` `cbdb3f7d` (POINTS-10 is under check and not on main: this branch carries its file tool kind and merges its later pushes, no rebase). Status verifying. App only: no backend change. The Hub routes are on backend `wmt/AITOOLS-05` `4aeff65` (not merged): the app's contract is copied from that commit (`contract/SOURCE_COMMIT` says so), SHARED-CHANGES POINTS-11 #2. Sync again from backend main once AITOOLS-05 merges; the file should not change.

| # | Before (`wmt/POINTS-10`) | After |
|---|---|---|
| 1 | Dubbing had no tile and no screen (`isBuiltTool` stopped at six tools) | a tile "Dubbing, From 1,500 a minute" (PT1's own words, the Hub's figure; mark `Languages`), in Studio and on the Create hub's Studio card, only while the Hub lists the tool as on with its `input.file` rule AND at least one language in `input.file.dubbing.languages` (R-47) |
| 2 | the file tool took a recording and nothing else | Dubbing is that file tool plus one choice: the language, in single-choice rows (PT2's voice rows, the same row, label "Language") of the Hub's own list, in the Hub's order, none chosen until the person chooses. A language outside the list has no row, so it cannot be chosen; Run waits for a recording AND a language |
| 3 | quote and job routes were Captions' and Clean audio's | the recording goes up and `POST /ai-tools/dubbing/quote` reads it ("About 1 minute", "This uses 1,500 points": the Hub's reading for one language); Run is `useJobCheck` over `{ action: dub_standard_per_min_lang, units, languages: 1 }`, then `POST /ai-tools/dubbing/jobs` with `fileKey`, `targetLanguage` and the quote token under one `Idempotency-Key` kept on the phone (the same key and language on a resend, a new key on Try again). The language spoken is left out: the Hub detects it |
| 4 | the working view said "About a minute" | Dubbing's working view says "This can take a few minutes. You can leave this screen." (PT2a's frame; the board's line would not be true). The job id, the recording's name and the language are kept on the phone until the person has seen the end, so reopening Dubbing finds the job still working |
| 5 | every job was read each 2 seconds | a dub is read each 2 seconds for its first minute, each 5 seconds until its fifth minute, then each 10 (`pollMsFor`, from the Hub's `createdAt`; every other tool stays at 2 seconds). The first read after reopening is at once |
| 6 | a done job was a link or a transcript | a done dub shows PT2b's player with the dubbed audio, a Subtitles card under it (each line with where it starts, read from the Hub's WebVTT: header, notes and markup left out) and "Share subtitles" through the phone's share sheet (the Hub's `.vtt` file, untouched, `text/vtt`; the web draws no share row), then "1,500 points used · 4,500 left". A dub the Hub kept without subtitles draws no card. A video in gives audio out: the file step takes video, and nothing on the done state mentions a video |
| 7 | a failed job and the sheets worked for the other file tools | the same here: "No points were taken", the balance back, Try again asks for the recording again (the language stays chosen); a short balance (PT3) and the daily cap (PT7) use the same sheets over the dub's quote (`languages: 1`); the Hub's `ai_language_unsupported` shows in its own sentence with nothing held |
| 8 | `studioToolsFlow.test.tsx` used Dubbing as "a tool the app has no screen for" | one fixture changed with a comment: that tool is Receptionist now (POINTS-12 builds it); no assertion was loosened |

- **Playing FLAC.** The dub's audio is the provider's lossless FLAC. `expo-audio` 57.0.5 plays through ExoPlayer on Android (`androidx.media3:media3-exoplayer`, FLAC built in) and `AVPlayer` on iOS (FLAC since iOS 11), so the audio is offered on all three. **Web export, Chromium: checked.** The stand-in's FLAC is a header and filler, which the browser reads (duration 50 s) but cannot decode (`MediaError` 2); with a real 50 second FLAC from ffmpeg served in its place (a browser-side route, the app's own player untouched), the app's player read it, `audio.paused` was false, `currentTime` ran to 2.9 s after a tap, `error` null, and the button said "Pause Dubbing". **On a phone: NOT RUN** (no device on a build machine; V10 is the owner's device run). If a device cannot play it, the audio row is not offered and G-AITOOLS-05-1 stands.
- **Default (lead), owner may override:** no language is chosen until the person chooses (a dub costs points in every language); the cost line is the file's quote and shows once the recording is ready (the price is for one language, so it does not change with the choice); all 94 of the Hub's languages are rows in one list, with no search (no board draws one).
- **Not drawn, filed:** G-POINTS-11-1 (the language rows, the subtitles card and the working line for a long job are no board's), G-POINTS-11-2 (the language spoken, more than one language, premium dubbing G-AITOOLS-05-2, a push when the dub is done, a list of past dubs behind the clock icon, a search over the languages), G-POINTS-11-3 (a finished dub cannot be found again once seen: G-POINTS-08-3).
- **Checks (EXIT 0 each):** tsc; eslint (no --fix) on the 12 changed `.ts`/`.tsx` files; jest `src/features/points`, `src/features/settings` and `src/features/create` 19 suites 409/409 (POINTS-10's 17 suites 379 all pass untouched; new: `dubbingFlow` 20 tests, `dubbingModel` 10); gates 0 fail, 18 warn, 0 accepted (as before), `check_baseline`; `check_tasks --write`. Mutation check: with the poll steps removed (always 2 seconds) the slow-down test fails (it saw 10 reads in a 20 second window where 3 to 5 are allowed).
- **Live look (V9; local stack `b11dub`, backend `wmt/AITOOLS-05` `4aeff65` on the Nuvion, voice and storage stand-ins, web export at 390 by 844, Chromium dark then light, a real sign-in on the sign-in screen through the mock sign-in service, one person with 6,000 points):** Studio drew "Dubbing, From 1,500 a minute" and opened it; 94 language rows; a 50 second WAV went up (presign, bytes, confirm), the Hub read it ("About 1 minute", "This uses 1,500 points"); a language chosen; Run made one job ("Making your Dubbing", "This can take a few minutes. You can leave this screen."); in the dark run the person left for Studio and came back to the job still working with the recording's name; the dub ended about a minute after it started: the player and 25 subtitle lines showed ("1,500 points used · 4,500 left" dark, "· 3,000 left" light); the light run did the same with a real FLAC in the player and the audio played. Pictures: `scratchpad/points-11-b/` `dubbing-1-empty`, `-2-quoted`, `-3-working`, `-4-done`, each `-dark` and `-light`; boards `board-PT2`, `-PT2a`, `-PT2b`, `-PT2c`, `-PT1`; side by side `cmp-points-11-dark.png` and `-light.png` (PT2 board, empty, quoted, PT2a board, working, PT2b board, done).
- **Found live, worked around (not the app's):** the storage stand-in answers no CORS preflight, so the browser ran with web security off (a phone has no CORS); the shared backend `node_modules` has no `music-metadata` (AITOOLS-04's dependency), so the Hub answered "We couldn't read that file" until it was put on the Hub's path from a folder outside both repos. Neither touches a repo.
- **Not done (for the verifier):** the play on a phone (NOT RUN); a failed dub, the daily cap and a short balance NOT RUN live (tests: `a failed dub says no points were taken`, `past the daily limit`, `with too few points the sheet appears`); the Share subtitles row NOT RUN on a phone (the web draws none; the test hands the Hub's `.vtt` to the mocked share sheet and checks the file's name, text and `text/vtt`); a real provider was never called (the stand-in's lines are `dubbed line N` and its FLAC is a header and filler); not compared picture by picture beyond the builder's own look (the boards have no file row, language rows, subtitles card or share row: G-POINTS-11-1).
- **History:** none yet. Reports go to tasks/history/POINTS-11.md.

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
