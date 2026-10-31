---
id: PREVIEW-AUTO
title: Audio and video need no preview clip: the Hub makes it, step 3 is the cover step (R-118)
owner: YOU
area: ME
order: -10977
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [COVERS-APP]
decisions: [R-118, R-8, R-114, R-27, R-47, R-29]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# PREVIEW-AUTO · the Hub makes the preview; step 3 is the cover step

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1). Mobile `wmt/PREVIEW-AUTO` (merged `origin/wmt/COVERS-APP` `10cdbf6b`, fast-forward: the branch had nothing of its own); Hub `wmt/PREVIEW-AUTO` on `origin/main` `66f1e05` (`b55230e`, `da71bc7`). No package, no native change; fingerprints must stay android `e871fe1a`, ios `e8e7de85` (NOT RUN here: no `expo fingerprint` run, see Not done). Owner, 31 Oct: "why the heck would audio ask for 30 60 seconds preview clip?", then "Audio content upload preview should be a cover art or any image not an audio again" (R-118).

| # | Before | After |
|---|---|---|
| 1 | Create step 3 made a creator upload a separate 30 to 60 s clip for audio and video, free pieces too; the Hub never checked its length | audio and video: step 3 is "Add a cover" (CoverChoice: Picture or None; no frame, because no clip is read), one muted line "Your preview is the first 30 seconds, made for you.", no drop box, Continue always on. The price step sends no `previewAsset`; a paid piece sends `previewFromFile: true`, a free one sends neither |
| 2 | `POST /content` and the draft publish needed `previewAsset`; a paid piece's preview had to differ from its full file | `previewAsset` optional. Free with none: the preview is the full file (nothing new stored, one file counted). Paid audio or video with `previewFromFile` and none: the Hub cuts the first 30 s (a file under 45 s: its first third; under 3 s refused) after the full file is stored, as a counted `content/preview` file of the creator (`auto-<hash of the full key>.mp3|wav|mp4`), the same name on a retry so it is never counted twice; a publish that fails gives the cut back. A clip sent is used as it always was. Any other paid piece without a preview: 400 "Paid content needs a preview. Add a clip, or ask us to make it from your file." |
| 3 | no Hub tool cut media: AITOOLS-04 chose "no ffmpeg on the Hub" and Studio (S2-HUB-1/2) only calls the AI provider | Plain JavaScript cutters (`src/content-piece/preview-cut/`): MP3 on frame edges, WAV, MP4 and QuickTime (the index rebuilt for the kept samples, written index first). No ffmpeg, no package. Ranged reads: only the index and the wanted samples are read. A refusal is the Hub's words ("This file is too short to make a preview from. Use your own clip." and two like it) |
| 4 | an uploaded clip that was refused showed 100% and a grey Continue with no words | audio and video no longer upload at step 3. The remaining kinds keep `refusalFor` (the Hub's rule sentence) |

**Not done (R-118 point 3, for the lead):** pictures, PDF, template and course still ask for their own preview file at step 3, as before, with the cover choice under it. Making their previews from the full file needs an image library and PDF page extraction; the Hub has neither and "never add a second tool". What they asked before is what they ask now. **Also not done:** the 390 px dark and light pictures against a local stack (see Pictures), `expo fingerprint`, the Hub's `hub-rate-limits` spec (it imports the Fintava double, CI runs it; no route was added).

**Existing assertions changed (R-118 names the defect they pinned):** `framesScreen.test.tsx` and `cover.test.tsx` opened the video clip step with `format video` and now open it as a `course` (whose preview is still an mp4 lesson, so the frame, discard and cover paths they prove still run), with the draft's full file mirrored onto a lesson (`asLesson`); `framesScreen.test.tsx` "an audio clip keeps the icon..." and `create.test.tsx` "asks for the clip length the Hub sets on an audio piece" now assert the new audio step (no drop box, the made-for-you line, Continue on). Two tests added in `cover.test.tsx` for the create body (paid sends `previewFromFile`, free sends neither).

**Defaults (lead), owner may override:** (a) step 3 stays five steps for everyone (R-118 makes it the cover step for every piece, so a Free piece does not skip it); (b) "30 seconds" is the app's constant `MADE_PREVIEW_SECONDS`, the Hub's `PREVIEW_SECONDS`; (c) the Hub's `GET /uploads/formats` still lists the old 30 to 60 s clip rule for audio (unchanged: the web's rules stay); (d) editing a free audio piece to paid later still needs a separate preview (PATCH unchanged).

## Capability checks

- [x] A user adding audio sees "Add a cover" and the made-for-you line and no clip box; Continue works (`create.test.tsx`, `framesScreen.test.tsx`, Android).
- [x] A paid audio piece sends `previewFromFile` and no `previewAsset`; a free one sends neither (`cover.test.tsx`, Android).
- [x] Hub: free with no preview, paid audio and video cut, first third of a short file, own clip unchanged, too short refused in words, paid with nothing and a pdf asking for a cut refused, the cut counted once and given back on a failed publish and replaced in place on retry, no room gives the storage 413, a free draft publishes (`preview-auto.contract.spec.ts`, 10 tests; `preview-cut.spec.ts`, 13).
- [x] Real files made with ffmpeg were cut by the Hub code and read with ffprobe: a 75 s H.264 and AAC MP4 gives 30.000 s of video (750 frames) and 30.000 s of audio, an MP4 with its index at the end and a QuickTime file give the same, a 20 s file gives 6.69 s, an MP3 gives 30.015 s, a WAV 30.000 s; `ffmpeg -v error -f null` decodes each with no error.
- [ ] On a phone: NOT RUN, see PHONE CHECK. Pictures: NOT RUN.

## PHONE CHECK (owner's phone list, before the update)

- Upload an audio file and a video from the phone: step 3 shows "Add a cover" with no clip box; pick a picture, send; the piece in review has a preview of the first 30 seconds that plays (the cut of a real phone MP4 or MOV: the Hub refuses a fragmented file in words).
- A free audio piece: no preview, whole piece opens.
- The Hub deploy needs nothing installed (no ffmpeg); the first paid video upload from a real phone should be watched once.

## Read first

`DECISIONS.md` R-118, R-8, R-114; `tasks/COVERS-APP.md`; Hub `src/content-piece/preview-cut/`, `preview-cut.service.ts`.
