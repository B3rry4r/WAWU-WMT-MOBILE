---
id: SHARED-07
title: The phone plays video and audio, reads PDFs in place, and shares the picture
owner: YOU
area: SHARED
order: 227
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [SHARED-04]
decisions: []
passes: [V1, V2, V5, V6, V7, V10]
artboards: [H2, H4, H5, H6, H35, M35]
---
# SHARED-07 · The phone plays video and audio, reads PDFs in place, and shares the picture

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/SHARED-07.md.

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

- [ ] Each artboard's phone states (playing, paused, scrubbing, ended, loading, error) render as drawn (jest with the modules mocked; screenshots where the web export can show them).
- [ ] The web build is unchanged.
- [ ] `npm run check` exit 0. V10 on a phone after the lead's preview build.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
