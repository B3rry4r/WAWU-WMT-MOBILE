---
id: POINTS-10
title: Studio: Captions and Clean audio
owner: YOU
area: POINTS
order: -119
priority: launch
repo: wawu-wmt-mobile
type: flow
status: review
depends_on: [AITOOLS-04, POINTS-09]
decisions: [R-78, R-43, R-61, R-68, R-47, R-27]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-10 · Studio: Captions and Clean audio

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B2), mobile `wmt/POINTS-10` on `origin/main` `2847eb32`, status review (a separate Sonnet verifier said PASS, 24 Oct 2026; report below, moved to tasks/history/POINTS-10.md). App only: no backend change. The Hub routes are on backend `wmt/AITOOLS-04` `4dac644` (not merged; it holds `origin/main` `0e87d06`): the app's contract is copied from that commit (`contract/SOURCE_COMMIT` says so), SHARED-CHANGES POINTS-10 #3. Sync again from backend main once AITOOLS-04 merges; the file should not change.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | Captions and Clean audio had no tile and no screen (`isBuiltTool` ids stopped at music) | a tile for each, in Studio and on the Create hub's Studio card, only while the Hub lists the tool as on with its `input.file` rule (R-47) |
| 2 | the one tool screen took words or a description | a third kind, `file`: PT2's frame with a choose-a-recording row where the text box is, and the Hub's types and limits under it ("MP3, WAV, ... Up to 500 MB and 60 minutes.", all from `input.file`) |
| 3 | no way to send the person's file | the phone's picker, a type and byte check in the Hub's numbers, the upload to the Hub's folder for audio or video with progress, then `POST /ai-tools/{tool}/quote` with the key: the length ("About 2 minutes") and the cost line ("This uses 30 points") are the Hub's reading, never worked out on the phone; the quote is asked before anything runs and holds nothing |
| 4 | a done job was a job with an audio link | a done job is a link or a transcript (`hasResult`); Captions shows the transcript as selectable text in PT2b's card and "Share subtitles" through the phone's share sheet (written to a cache file, `expo-sharing`; the web draws no share row); Clean audio shows PT2b's player; both end with "30 points used · 1,220 left" |
| 5 | Run was the quote of words | Run is the same `useJobCheck` path (PT3, PT3a, PT3b, PT7) over the Hub's minutes, then `POST /ai-tools/{captions or clean-audio}/jobs` with `fileKey` and the quote token under one `Idempotency-Key` kept on the phone (the same key on a resend, a new one on Try again); a job left running is found again with the recording's name |
| 6 | a refusal had no home | a wrong type, a file over the byte cap, an empty file (all stopped on the phone with the Hub's numbers), a failed upload, a storage refusal, a file the Hub cannot read and a recording over the minute cap (`minutes_per_job`, the Hub's own sentence) each show a banner, draw no cost and hold nothing; a failed job says "No points were taken" and the balance is back |
| 7 | Settings had no "Use wallet" switch (G-POINTS-07-1) | "Use wallet for AI tools" in the preferences group, `GET` and `PUT /me/points/settings`, so PT3's wallet offer can be reached; a placeholder while loading and a retry on failure, like TGIF |
| 8 | VoiceOver's missing parts (G-AITOOLS-01-1 your own voice, G-POINTS-08-1 sample play, G-AITOOLS-01-4 and G-POINTS-08-2 Save to library and Use in a product) | **not drawn, rows updated.** The Hub serves none of them: `AiVoiceView` is id, name, description (no sample link, no own voice); `CreateVoiceoverJobDto` takes a `voiceId` from `GET /ai-tools` only; no route saves a job's audio or attaches it to a draft (`CreateProductDraftDto` has no media field). Each row now names the backend task it needs (R-47) |

- **Default (lead), owner may override:** a failed job asks for the recording again (the Hub lets the file go when a job settles, G-POINTS-10-2); no language picker (the Hub detects it, G-POINTS-10-3); the cap on the recording's length is shown at once from the file quote and not at Run.
- **Not drawn, filed:** G-POINTS-10-1 (the row, the limits line, the transcript card and the share row are no board's), G-POINTS-10-2, G-POINTS-10-3 (language, recording inside the tool, before-and-after listen, editing, Save and Use in a product), and the four VoiceOver rows above.
**Checks (EXIT 0 each):** tsc; eslint (no --fix) on the 15 changed `.ts`/`.tsx` files; jest `src/features/points`, `src/features/settings` and `src/features/create` 17 suites 379/379 (121 points tests before: all pass untouched; new: `fileToolsFlow` 26, `fileToolModel` 10, four Settings tests); gates 0 fail, 18 warn, 0 accepted (as before), `check_baseline`; `check_tasks --write`.
- **Live look (V9; local stack `b2stu`, backend `4dac644` on the Nuvion, voice and storage stand-ins, web export at 390 by 844, Chromium dark then light, a real sign-in through the mock sign-in service, one person with 6,000 points):** a 90 second WAV went up (presign, bytes, `POST /uploads/confirm`), the Hub read it ("About 2 minutes") and quoted it ("This uses 30 points", "This uses 800 points"); Captions ran and the transcript showed ("30 points used · 5,970 left"); Clean audio ran and its player played ("Pause Clean audio" after a tap; "800 points used · 5,170 left"); both again in light. Settings: "Use wallet for AI tools" appears off and a tap sent `PUT /me/points/settings` and showed on. Pictures: `scratchpad/points-10-b/pics/cmp-points-10-dark.png` and `-light.png` (PT2 board, Captions ready, Captions done, Clean audio done, PT2b board, Settings) and each state alone (`captions-1-empty` to `-4-done`, `clean-audio-1-empty` to `-4-done`, `settings-use-wallet`, each `-dark` and `-light`; boards `PT2-` and `PT2b-`).
- **Found live, fixed:** the Hub opens a file for a tool only once the storage host has confirmed it. The first live run uploaded the bytes and the quote answered "We couldn't find that file", because the app did not call `POST /uploads/confirm` (the first version of the tests answered for a flow the Hub does not have). `uploadRecording` now confirms and treats anything but `confirmed` as a failed upload; the test Hub refuses a file that was not confirmed, and a test covers `abandoned`.
- **Not done (for the verifier):** not compared picture by picture with PT2 and PT2b beyond the builder's own look (the boards have no file row, transcript card or share row: G-POINTS-10-1); the failed job and the daily cap were NOT RUN live (tests: `a failed job says no points were taken`, `past the daily limit`, `with too few points the sheet appears`); the Share subtitles row is NOT RUN on a phone (the web draws none; the test hands a file to the mocked share sheet and checks the file's name and text); a recording over the minute cap was NOT RUN live (tests); a real provider was never called (the stand-in's words are `word1 word2 ...` and its audio silent); the stack's Hub gives a 10 minute cap, which the limits line shows.
- **History:** none yet. Reports go to tasks/history/POINTS-10.md.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-10.md](history/POINTS-10.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
