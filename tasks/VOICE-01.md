---
id: VOICE-01
title: Hear your name and the Voice Intro (backend)
owner: YOU
area: VERIFY
order: 266
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [POINTS-03, TIER-03]
decisions: [R-43, R-66, R-68, R-6]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# VOICE-01 · Hear your name and the Voice Intro (backend)

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** L. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): POINTS-03.
- **History:** none yet. Reports go to tasks/history/VOICE-01.md.

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
