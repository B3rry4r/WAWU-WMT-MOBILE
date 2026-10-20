---
id: VOICE-01
title: Hear your name and the Voice Intro (backend)
owner: YOU
area: VERIFY
order: 266
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [POINTS-03, TIER-03]
decisions: [R-43, R-66, R-68, R-6]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# VOICE-01 · Hear your name and the Voice Intro (backend)

## Current state

As of 20 Oct 2026, verifying: built by a Sonnet builder, awaiting an independent verifier (T2).
- **Branches:** backend `wmt/VOICE-01` `310358c` on `origin/main` `2786c0b`; mobile `wmt/VOICE-01` (this file, SHARED-CHANGES VOICE-01 #2 to #5, gaps G-VOICE-01-1 to -6, G-800 reworded). No PR.
- **Migration:** `20261030140000_voice_intro` (tables `VoiceProfile`, `VoiceIntroRun`, `VoiceNamePreview`; rollback.sql proven on a test database).
- **Not done:** `voiceIntro` on the public profile route (the protected lock refuses a widened response; served by `GET /users/{wawuId}/voice-intro`, G-VOICE-01-1); the recording's length is not checked (G-VOICE-01-2); "Your voice" in VoiceOver (G-VOICE-01-6); the real provider run (G-VOICE-01-3).
- **Next:** a verifier (V1 to V9); the lead decides G-VOICE-01-1 and merges.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-43, R-66, R-68, R-6 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The Hub can say a person's name in a studio voice (VF3), and can make, store and serve a Voice Intro in the person's own AI voice from a 30 second recording they consent to (VF4, VF8 to VF11). The audio is marked as an AI voice so the app shows the tag (R-66). The provider is never named to users (R-68).

## Scope

- No Hub route serves this today (G-800). Proposed routes, builder may adjust and record why: `POST /me/voice/name-preview` (phonetic spelling optional, free), `PUT /me/voice/name`, `PUT /me/voice-intro/text` (character limit from settings), `POST /me/voice-intro/consent`, `POST /me/voice-intro/sample` (the 30 second recording through the presign and confirm path), `POST /me/voice-intro/generate` (holds points through POINTS-03, first one included in a tier via `firstVoiceIntroIncluded`, 200 points after; commit on success, release on failure so "points not taken"), `GET /me/voice-intro` (state, audio url, text, `aiVoice: true`).
- Only the account owner can record and only their own voice: the consent line is stored with the time and the sample. Public profile views get `voiceIntro: { url, aiVoice: true }` (additive nullable).
- A provider key is the owner's and is not on this machine. Build against a recorded stand-in at the provider boundary only, with the real calls behind one adapter, and report every provider-dependent check as NOT RUN with the fact that unblocks it: "a provider key set on the Hub".
- No provider call may hold a database transaction, a connection or a lock (common rules, 16 Oct): decide and mark under a short lock, call the provider holding nothing, record the result under a short lock.

## Capability checks

- [ ] A person with a tier and no intro generates one: no points are taken for the included first one, 200 for the next.
- [ ] A failed generation releases every held point and says so in plain words.
- [ ] The consent line, time and sample are stored; a request for another person's voice is refused.
- [ ] The public profile serves the intro with `aiVoice: true`; a person without one serves null.

## Builder report

- **Built:** `src/voice-intro/`, nine routes (SHARED-CHANGES VOICE-01 #2). The provider seam (`AI_VOICE_PROVIDER`) gains `previewName` and `speakInOwnVoice`; one adapter, one stand-in. Audio is `aiVoice: true` (R-66); no provider name in any string (R-68).
- **Check 1:** the tier's included first Voice Intro takes no points (its flag is spent in the same short transaction as the run), the next holds the plan's `voice_intro` points (200, a setting, `points.action.voice_intro`), kept on success. Passed on the stand-in.
- **Check 2:** a failed try (provider down, refusal, unreadable or unstorable file, late finish after the stale sweep) releases every held point or puts the included one back and says "No points were taken". Passed on the stand-in.
- **Check 3:** the consent line is served, must come back unchanged, and is stored with the time and the sample; another person's recording, an unlanded one and a foreign link are refused; no route takes an id. Passed.
- **Check 4:** passed on `GET /users/{wawuId}/voice-intro` (null without one). NOT the profile route (G-VOICE-01-1).
- **Provider:** NOT RUN on the real provider; unblocked by a provider key set on the Hub. No provider call holds a transaction, connection or lock.
- **Counts:** voice specs 29 (3 files); neighbours 170 in 14 suites (Fintava-double specs not run); `test:protected` 253 of 253; gates 0 fail; baseline check EXIT 0; tsc, eslint, prettier clean.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
