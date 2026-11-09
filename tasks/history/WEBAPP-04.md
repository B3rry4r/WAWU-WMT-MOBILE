# WEBAPP-04 · round history

Moved out of [tasks/WEBAPP-04.md](../WEBAPP-04.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: media/redrawPhoto.ts, 4 web pickers, verify/voiceWeb.ts, voiceApi.ts, voiceRecorder.ts. Tests: voiceWeb.test (9). Related 888 tests passed, tsc, eslint 0.
Photo proof (stack, storage stand-in on 16030, path style): GPS+camera Exif JPEG (APP1 Exif, StandInCam) picked for the profile photo in Chromium; stored object avatars/... read back: no APP1, no Exif, no GPS, upright 600x800, image/jpeg.
Voice proof: real Chromium fake-mic recording is audio/webm;codecs=opus (Chrome here does not record MP4 per the recorder's list); sampleToUpload gave audio/wav, ffprobe pcm_s16le 44.1 kHz mono 3.0 s. Ran the bundled voiceWeb module in the page, not the full screen.
NOT RUN: the Voice Intro screens end to end (feature is off on the stack, needs the voice stand-in); the works, create and chat pickers live (same helper); Firefox and Safari; Hub-side voice_sample use of the WAV.
PHONE CHECK: a WAV and a Safari MP4 voice play in the app on iPhone and Android.

## Verifier report

