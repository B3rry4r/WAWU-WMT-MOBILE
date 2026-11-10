# WEBAPP-02 · round history

Moved out of [tasks/WEBAPP-02.md](../WEBAPP-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: src/lib/{WebFrame,FrameModal,useFrameWidth}.tsx/ts, src/app/_layout.tsx (wrapper only), 7 Modal users, 10 width readers, SHARED-CHANGES.md.
Checks: specs src/__tests__/webFrame.test.tsx (9: width rule, web 1440 column, Platform android and 390/430 no wrapper, resize follows via Dimensions events, FrameModal). 88 related suites, 1903 tests passed. tsc EXIT 0, eslint EXIT 0.
Pictures (stack, Chromium, /tmp/wmt-shots/webapp02/): home, explore, inbox, wallet, me, settings, abroad-new, comments modal at 1440 and 390 light and dark (32), plus artboards H1 X1 I1 H21 H22 (10). Looked at: Home and comments at 1440 dark are a centred 390 column; 390 pictures match the phone layout. Wallet, Me, Inbox 1440 taken, not individually inspected.
Default taken: column 390 (not 430) from windows over 600, matching BottomSheet's own cap. A BottomSheet scrim covers the whole window (fenced component), its sheet sits in the column.
Not proven: 390 before-and-after pixel equality (no before build); Safari and Firefox NOT RUN.

## Verifier report

Lean verifier, 9 Nov 2026, mobile ef7bb9c. Verdict FIX.
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed (mobile) | tsc EXIT 0, eslint on 60 changed files EXIT 0, 144 related suites: 143 pass, 4 tests fail in walletSettingsFlow, same 4 fail on main (fixture text "Changed 3 months ago", date-dependent; clock not changed to prove it). Gates and full check are the merge agent's. |
| V5 | FAIL | 52 builder shots + my 28 (home, explore, inbox, wallet, me, settings, abroad-new, 1440 and 390, light and dark) + 28 baseline from WEBAPP-PLAN base 18f86cd, looked at all; /tmp/wmt-shots/v-webapp02/. 1440: every tab is a centred 390 column. 390 equals the base except the Alert sound row (removed on web, intended) and the tier offer (base shows it every load). |
| V6 | partly | Share toast outside column (finding 1). Wallet tab with a wallet NOT RUN (no wallet on the stack; wallet-less users get the open-wallet step in every Wallet and abroad-new picture, as the builder's did). Resize without reload covered by jest only. Safari, Firefox NOT RUN. |
Findings:
1. medium defect: the "Link copied" note (`src/lib/shareNote.tsx`) sits in its own Modal, so at 1440 it is a bar across the whole window, over the sheet, outside the column (v6-piece-More.png, builder's share-note-*.png). The task says toasts stay in the column.
2. low: BottomSheet scrim greys the whole window at 1440 (known default); sheet itself sits in the column.
3. low: the column draws hairline side borders (no artboard draws them); harmless.

## Fix round 1 (builder)

Findings closed: WEBAPP-02 medium 1 (share note now in the column) and low 3 (column hairlines removed); WEBAPP-03 low 3 (Hub CORS spec: prettier and eslint clean, no warnings); WEBAPP-04 high 6 (a stored voice is only AAC in MP4 or 22,050 Hz mono WAV; recorder asks for `audio/mp4;codecs=mp4a.40.2` only when MediaRecorder says yes to that exact string; WebM, Opus in MP4 and bare MP4 are converted).
Voice consumer: the voice provider reads a stored sample once per run; the app never plays it (it plays the Hub's own Voice Intro). API-FACTS.md names no rate it needs, so 22,050 Hz mono 16-bit; a 30 s take is 1.32 MB (Hub reads up to 10 MB).
Proof (Chromium fake mic, 30 s, bundled voiceWeb in the page): WebM take and Opus-in-MP4 take both came out as audio/wav, ffprobe pcm_s16le 22050 Hz mono, 29.9 to 30.0 s, 1.32 MB. AAC-in-MP4 pass-through: NOT RUN live (this Chromium says no to that string); unit-tested. Stored-file read-back through the Voice Intro screens NOT RUN (feature off on the stack).
Pictures: /tmp/wmt-shots/webapp02/fix1/ share-note and home at 1440 and 390, light and dark (8); the note is 350 px wide inside the column at 1440 (x 545 to 895), no hairlines; beside H1 (rendered).
Checks: voiceWeb 10, webFrame, webShare, verify folder 260 tests passed; mobile tsc 0, eslint 0; Hub eslint 0 and CORS spec 2 passed.

## Verifier report, round 2 (9 Nov 2026, mobile c6c1168, Hub ed5dfb3). Verdict: FIX (one low left, the Hub prettier error); all medium and high findings closed.
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed except Hub eslint | mobile tsc EXIT 0, eslint on the 4 changed files EXIT 0; jest voiceWeb, webFrame, webShare and verify dir: 22 suites, 260 tests pass; Hub tsc EXIT 0, `test:contract hub-cors-exposed` EXIT 0, Hub eslint EXIT 1 (finding 3) |
| V5 | passed | r2-note-{1440,390}-{light,dark}.png looked at 4 of 4 (/tmp/wmt-shots/v-webapp02/) |
| V6 voice | passed | see below |
Findings re-checked:
- 6 (high) closed. Recorder only asks for `audio/mp4;codecs=mp4a.40.2` (this Chromium refuses it, so it records WebM). A WebM take (fake mic, 30 s) and an Opus-in-MP4 take (`audio/mp4;codecs=opus`, my round 1 case) both come out as WAV, ffprobe pcm_s16le 22,050 Hz mono, 30.4 s, 1.34 MB (round 1: 2.69 MB). Only AAC-named MP4, AAC, MP3 and WAV pass through; a bare `audio/mp4` is converted. Readers: Hub code reads a stored sample only in `VoiceFiles.readSample` (voice-intro run and `own-voice.service`), both for the voice provider; `purge-files.ts` only deletes. Nothing plays it back. API-FACTS.md names no rate the provider needs, so 22,050 Hz mono is the builder's default, not a provider fact: NOT RUN against the real provider (stand-ins only). Speech content sits under 11 kHz so it is very likely enough. The AAC pass-through test is a unit test on a 1-byte blob given the AAC type by hand: honest about what it tests (the label rule), but it does not prove a real AAC take. No browser here records AAC in MP4 and Safari is NOT RUN, so real AAC pass-through is unproven (PHONE CHECK).
- 1 (medium) closed. "Link copied" sits inside the column, above the sheet, at 1440 and 390, light and dark (4 of 4 shots).
- 4 (low) closed. Column borders removed in code and none show in the shots.
- 3 (low) OPEN. Spec file now clean, but `src/hub-app-config.ts` line 47 still fails prettier (eslint error, 1 error 0 warnings): the enableCors call needs the three options on separate lines. Hub eslint on the two changed files EXIT 1.
- 2, 5 and the other lows are unchanged (scrim over whole window; navigator.share on Windows and ChromeOS; wawuafrica.com link).
NOT RUN: real AAC take, Safari, Firefox, iPhone and Android playback, the provider's reading of 22,050 Hz, a wallet-user Wallet tab.
