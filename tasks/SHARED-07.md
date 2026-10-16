---
id: SHARED-07
title: The phone plays video and audio, reads PDFs in place, and shares the picture
owner: YOU
area: SHARED
order: 227
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [SHARED-04]
decisions: []
passes: [V1, V2, V5, V6, V7, V10]
artboards: [H2, H4, H5, H6, H35, M35]
---
# SHARED-07 · The phone plays video and audio, reads PDFs in place, and shares the picture

## Current state

As of 16 Oct 2026 (builder, Sonnet, round 3).
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SHARED-07.md`): verdict merge, nothing medium or worse. Stacked in batch 5 (backend and mobile `wmt/MERGE-5`). Round 3 of the check. Mobile only, app-only.
- **Built:**
  - H2, H5, H6: `src/features/feed/player/index.tsx` plays through `expo-video` (a texture view, so H5's frame can blur and grow) and `expo-audio`; `canPlay` is true, so the feed and M35 and M34 draw play, pause, scrub, back and on, and the ended preview.
  - H4: `src/features/feed/reader/index.tsx` reads the PDF in a `react-native-webview` under the title. iOS's web view shows a PDF itself. Android's does not, so `reader/pdfPage.ts` draws the pages with pdf.js 3.11.174 (pinned, from cdnjs), loaded with the file's own address as base so no CORS answer is needed. Any failure (a bad link, an HTTP error, pdf.js not reachable) opens the phone's own viewer and returns to the feed, as before.
  - H35: `ShareSheet.tsx` draws WhatsApp, Story, Chat and Save where the phone has a share sheet. The picture is written to the cache (`cardFile.ts`) and handed to the share sheet (WhatsApp, Story) or the photos (Save, write-only permission). The web build draws WhatsApp and Chat only (`cardFile.web.ts`).
  - Rows HOME-02 #2, ME-11 #5 and HOME-09 #2 are marked applied; BACKEND_GAPS G-242 is closed. `jest.setup.js` (package.json `setupFiles`) stands in for the five native modules, because `expo-audio` throws on import in jest and every suite that reaches the feed would fail.
- **Round 2 (verifier's medium, fixed):** the Android PDF page builds at most 400 page boxes (`PDF_MAX_PAGES`; a 300-page book is read whole, a file that claims more shows its first 400) and fails to the phone's own viewer on a page count that is not a whole number of pages (0, negative, NaN, Infinity). The reader waits 45 seconds (`PDF_LOAD_TIMEOUT_MS`) for `pdf:ready` or `pdf:failed` and then opens the phone's viewer, as every other failure does; ready cancels the wait; a failure and the timeout never both open it. iOS is unchanged.
- **Round 3 (verifier's medium and two lows, fixed):** `ShareSheetPhone.test.tsx` `boot()` now also waits for the Save tile (drawn once the phone's share answer is in), so the suite passes in a full parallel run; `ShareSheet.tsx` `whatsapp()` waits for that answer before choosing picture or text; `reader/index.tsx` hands the file over once whatever the order of timeout, `pdf:failed`, `onError` and `onHttpError`. 3 new tests.
- **Open findings:** none medium or worse. One low, in `tasks/SWEEP-APP.md` (Open lows, SHARED-07 #1): iOS has no short-circuit for a non-web address.
- **Checks:** see the builder report, round 3, in tasks/history/SHARED-07.md.
- **Not run:** V10 on a phone (the lead's preview build). Nothing here was run on a device: the Android PDF page was run in desktop Chromium against a 40-page PDF (pages drawn as they near the screen and let go when far; failure messages for a missing file and for pdf.js blocked).
- **Limits a verifier should know (not defects):**
  - WhatsApp and Story both go through the phone's share sheet with the picture. `expo-sharing` cannot aim at one app, and Instagram's Story link needs modules that are not installed, so the person picks the app. The share is counted when the sheet opens and closes without an error.
  - H6's waveform stays level on a phone (no decoder; BACKEND_GAPS G-217 asks for peaks from the Hub).
  - H2, H5 and H6 draw no loading or error state for the media itself, so none was added (R-47).
  - H35's third tile says "Chat", as HOME-09 built it; the canvas says "WAWU chat".
- **Next:** a verifier confirms round 3, then V10 on a phone build and the Android PDF page on a real device.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files: this task IS the lead's shared-change pass, so it may edit the fenced files its rows name, and nothing else that is fenced)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `SHARED-CHANGES.md` rows: HOME-02 #2, ME-11 #5, HOME-09 #2 (each row says what to change and why; the status cells were audited on 8 Oct 2026, mobile `fb01391`)
- `tasks/HOME-02.md`, `tasks/HOME-09.md`, `tasks/ME-11.md`; `src/features/feed/player/` (the web player is the reference behaviour)

## Goal

On a phone a video or audio post draws no play, pause or scrub control (`player/index.tsx` exports `canPlay = false`), a PDF opens in the phone's own viewer instead of in place, a work's video on M35 shows a quiet block, and H35 has no Story, Save or picture for WhatsApp. SHARED-04 installs the modules; this task builds the phone side.

## Scope

- `player/index.tsx` with `expo-video`'s `VideoView` and `expo-audio`'s player, matching the web player's controls and states (H2, H5, H6); `canPlay` true.
- H4 reads the PDF in place with `react-native-webview`, as the web build does.
- M35 and M34 play a work's video through the same player (ME-11 #5).
- H35's Story and Save, and WhatsApp posting the picture, in `ShareSheet.tsx` (HOME-09 #2, BACKEND_GAPS G-242).
- Mark each row applied.

## Capability checks

- [x] Each artboard's phone states (playing, paused, scrubbing, ended, loading, error) render as drawn (jest with the modules mocked; screenshots where the web export can show them).
- [x] The web build is unchanged (no `.web.*` file is edited; `cardFile.web.test.ts` pins that the sheet draws no Story or Save there).
- [x] `npm run check` exit 0 (run as its steps with two jest workers, see tasks/history/SHARED-07.md).
- [ ] V10 on a phone after the lead's preview build (NOT RUN).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SHARED-07.md](history/SHARED-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
