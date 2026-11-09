# WEBAPP-04 · round history

Moved out of [tasks/WEBAPP-04.md](../WEBAPP-04.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: media/redrawPhoto.ts, 4 web pickers, verify/voiceWeb.ts, voiceApi.ts, voiceRecorder.ts. Tests: voiceWeb.test (9). Related 888 tests passed, tsc, eslint 0.
Photo proof (stack, storage stand-in on 16030, path style): GPS+camera Exif JPEG (APP1 Exif, StandInCam) picked for the profile photo in Chromium; stored object avatars/... read back: no APP1, no Exif, no GPS, upright 600x800, image/jpeg.
Voice proof: real Chromium fake-mic recording is audio/webm;codecs=opus (Chrome here does not record MP4 per the recorder's list); sampleToUpload gave audio/wav, ffprobe pcm_s16le 44.1 kHz mono 3.0 s. Ran the bundled voiceWeb module in the page, not the full screen.
NOT RUN: the Voice Intro screens end to end (feature is off on the stack, needs the voice stand-in); the works, create and chat pickers live (same helper); Firefox and Safari; Hub-side voice_sample use of the WAV.
PHONE CHECK: a WAV and a Safari MP4 voice play in the app on iPhone and Android.

## Verifier report

Lean verifier, 9 Nov 2026. Verdict FIX.
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | voiceWeb.test passes; tsc and eslint EXIT 0. |
| V4/V7 photos | passed | GPS+camera Exif JPEG (600x800) picked in the profile photo picker and in the works picker on the stack; stored objects avatars/... and profile/work/... read back from the storage stand-in: no APP1, no Exif, no GPS, still JPEG 600x800. |
| V6 voice | FAIL | /tmp/v02work/vw. Real Chromium fake-mic, 30 s, the bundled voiceWeb module in the page. This Chromium supports `audio/mp4`, so `recordingMimeType()` picks it (its AAC string is unsupported, the plain `audio/mp4` is) and the take is `audio/mp4;codecs=opus`: sent unconverted as audio/mp4, 484,055 B; ffprobe shows Opus in an MP4. An iPhone is not shown to play Opus in MP4 (PHONE CHECK, likely not). With the default WebM recorder the path works: audio/wav, pcm_s16le 44.1 kHz mono, 30.5 s, ffprobe and Audio element read it. Weight: a 30 s WAV is 2.69 MB against 0.48 MB for Opus (5.6x), about 2.7 MB of mobile data per 30 s take (Hub cap 9 MB, so about 100 s). |
| V9 | passed | see WEBAPP-03. |
Findings:
6. high defect: browsers that record MP4 with Opus (recent Chrome) skip the WAV conversion; the stored file may not play on iPhone, the task's claim. Fix: ask only for `audio/mp4;codecs=mp4a.40.2`, or convert any take whose codec is not AAC. Builder saw WebM on their Chromium, so the shipped path differs by browser.
Voice Intro screens end to end NOT RUN (feature off on the stack); Firefox, Safari NOT RUN.
