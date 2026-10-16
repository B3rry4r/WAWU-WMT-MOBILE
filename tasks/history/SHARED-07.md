# SHARED-07 · round history

Moved out of [tasks/SHARED-07.md](../SHARED-07.md) word for word, oldest first. The current state is in that file.

## Builder report

**Files.** `src/features/feed/player/index.tsx`, `reader/index.tsx`, `reader/pdfPage.ts` (new), `player/types.ts` (comment); `src/features/tgif/ShareSheet.tsx`, `cardFile.ts` and `cardFile.web.ts` (new), `model.ts` (`shareLine` takes `asPicture`); `src/features/works/WorkCover.tsx` (comment only); `jest.setup.js` (new) and its `setupFiles` entry in `package.json`; `SHARED-CHANGES.md` (three rows applied), `BACKEND_GAPS.md` (G-242 removed). Tests added: `PhonePlayer.test.tsx` (16), `PdfReaderPhone.test.tsx` (10), `pdfPage.test.ts` (5), `ShareSheetPhone.test.tsx` (11), `cardFile.test.ts` (6), `cardFile.web.test.ts` (2). No existing test was edited.
**Checks.** Each artboard's states by jest with the modules mocked: playing, paused, scrubbing (a seek moves the file once, before it plays), ended (video `playToEnd`, audio `didJustFinish`, replay from the top), frosted (blur filter and scale). Ten mutants (seek after play, no restart from the top, seek twice, `canPlay` false, a failed page ignored, later loads allowed, two taps at once, Save counted as a share, no text fallback for WhatsApp, no overwrite of the card file) were each killed by one of the new tests. Pictures: H35 at 390 px, light and dark, beside the artboard, from a web export through the stack (`shared_07`, own Metro cache, only ports 7270 and 7277 baked in): `scratchpad/shared-07-b/shots/H35-light-pair.png` and `H35-dark-pair.png` (design left, built right; the export had a local-only stub that makes the web build say the phone can share, so the four tiles show; the branch has no stub). The four tiles sit as the canvas lays them out; the third says "Chat". The web export cannot show a phone's player or the Android PDF page.
**Gate counts.** Full check (typecheck, lint, jest with two workers, gates, tasks), `EXIT 0`: jest 161 suites and 2882 tests passed (6 suites and 50 tests are new), gates 590 files scanned, 0 fail, 0 baseline entries, tasks 283. A first run failed only the `hardcoded_signals` gate on three names in `reader/index.tsx` (`ready`, `loaded`, `domStorageEnabled={false}`); the names were changed and the prop dropped, no gate or baseline was touched.
**Gaps and rows.** Rows HOME-02 #2, ME-11 #5, HOME-09 #2 applied. G-242 closed. G-217 (waveform peaks) still stands. No new gap or shared-change row.
**Not done.** V10 on a phone. A device run of the Android PDF page (it needs pdf.js from cdnjs on the phone's network).

## Verifier report

_Not started._

