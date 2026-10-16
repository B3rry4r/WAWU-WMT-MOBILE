---
id: AITOOLS-01
title: The AI tools catalogue and VoiceOver (backend)
owner: YOU
area: POINTS
order: 267
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [POINTS-03, TIER-06]
decisions: [R-43, R-61, R-68]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-01 · The AI tools catalogue and VoiceOver (backend)

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** L. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): POINTS-03, TIER-06.
- **History:** none yet. Reports go to tasks/history/AITOOLS-01.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-43, R-61, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Studio (PT1) lists the AI tools the Hub can run, each with its points cost before use, and VoiceOver (PT2) runs from text to audio, keeping the points only if it succeeds. Other tools (Quick voice, Captions, Clean audio, Music, Sound effects, Dubbing, Receptionist) are filed one task each when the lead schedules them; the app draws only the tools the Hub lists (R-47).

## Scope

- `GET /ai-tools` (id, name, unit, cost in points per unit from the R-65 settings, caps from `GET /plans` `caps`, `enabled`). `POST /ai-tools/voiceover/jobs` (text up to the settings' character limit, a voice id, the quote token from `POST /points/quote`), `GET /ai-tools/jobs/{id}` (working, done with audio url, failed with "No points were taken"). Points: hold, then commit on success or release on failure, through POINTS-03; a late finish and the stale-hold sweep cannot both win.
- Builder may rename routes and records why. Provider key: the owner's, not on this machine: the same stand-in rule and NOT RUN fact as VOICE-01. Provider names never reach a user-visible string (R-68: "AI voice tools").
- Caps (daily points, characters and minutes per job) answer `points_cap_reached` naming the cap (PT7).

## Capability checks

- [ ] `GET /ai-tools` lists VoiceOver with its cost for 2 minutes before a person runs anything.
- [ ] A job with enough points holds, runs and commits; a failed job releases everything; two jobs at once never take points below zero.
- [ ] Over a cap the job is refused with the cap named and nothing held.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
