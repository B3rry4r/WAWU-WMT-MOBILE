# WEBAPP-03 · round history

Moved out of [tasks/WEBAPP-03.md](../WEBAPP-03.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: see commits d1c6881 (mobile), aae111a (Hub, src/hub-app-config.ts + spec).
Tests: webShare, returnPath, offerStepWeb, abroadFlow (+2), settingsScreens (+1), Hub hub-cors-exposed-headers spec (2 passed). Related run: 118 suites; 6 failed at first because shareOut passed an extra undefined arg, fixed; remaining failures are walletSettingsFlow (4), date-dependent "Changed 3 months ago", fails identically on the lead's clone without my changes.
V7/V9 on stack (real sign-in, desktop Chromium): signed-out /content/<id> kept, after sign-in and the tier offer lands on the piece; /send/abroad/new for a wallet-less user lands on Open your wallet; tier offer shown first start, not on 2 refreshes, shown in a new tab; Share on profile, piece and invite card copies the text and shows "Link copied" (clipboard read back); with navigator.share present it is used and no note; Settings has no Alert sound, Music stays; invite-card draws Share and no Save.
Defaults taken: Notifications row kept (Hub preferences that also apply on the phone); subtitles row and invite Save were already not drawn on web (code and stack).
NOT RUN: receipt Share on stack (same helper, unit-tested); safari/firefox; Retry-After read in a browser on a real 429.
PHONE CHECK: phone browser Share opens the system sheet.

## Verifier report

Lean verifier, 9 Nov 2026. Verdict FIX (finding 1 of WEBAPP-02 touches the share note built here).
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | affected specs pass (302 in the directly affected dirs; webShare, returnPath, offerStepWeb, abroadFlow, settingsScreens pass). Hub: tsc EXIT 0 after `prisma generate` (the voice-intro errors were the missing generated client in a fresh worktree, 0 errors after); `test:contract hub-cors-exposed` 2 passed. Hub eslint on changed line FAILS prettier (finding 3). |
| V6 | passed with notes | piece Share sheet: Copy link and More put the link in the clipboard, "Link copied" shown, no false failure; Me share copies text + link; invite card draws Share, no Save. Receipt share NOT RUN live (no wallet); call site read, same `shareOut`. No `Share.share` left outside `share.ts` (21 files use shareOut). |
| V7 | passed | signed-out /content/<id> -> welcome -> sign in -> tier offer -> close -> lands on the piece. /send/abroad/new for a wallet-less user -> open-wallet step "Complete your account 1 of 4", not blank. Tier offer: shown at first start, not on 2 refreshes, shown again in a new tab. |
| V9 | passed | real sign-in through the mock ID: Hub-only values seen: "Chidi Umeh", creator-basic@test.wawu.dev, 0800 ••• 0002 on Settings, "SEEDED: 10-Minute Owambe Makeup" with 1,893 views. |
Hub diff: 2 files only (src/hub-app-config.ts exposedHeaders ['Retry-After'], its spec). Header proved by supertest; a real 429 read in a browser NOT RUN.
No dead control: walked every row in Settings and Me at 1440; each opens something or toggles (TGIF and Music switches repaint). Avatar, handle chip and counts on Me do nothing visible (same as the phone, not judged dead).
Findings:
3. low: Hub `src/hub-app-config.ts` line 47 fails prettier (eslint error); spec has 2 no-unsafe-argument warnings.
4. low/unclear: where `navigator.share` exists (Chrome on Windows or ChromeOS) a desktop user gets the OS sheet, not copy, against the check's wording.
5. low/unclear: copied links read wawuafrica.com/..., not usewmt.com.

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
