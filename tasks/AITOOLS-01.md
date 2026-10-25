---
id: AITOOLS-01
title: The AI tools catalogue and VoiceOver (backend)
owner: YOU
area: POINTS
order: 267
priority: launch
repo: wawu-backend
type: third-party
status: review
depends_on: [POINTS-03, TIER-06]
decisions: [R-43, R-61, R-68]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-01 · The AI tools catalogue and VoiceOver (backend)

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 13.
- **Status:** merging (lead). Verdict: PASS (about 130 checks: holds, failures release, a late answer refused uncharged, 5 at once accepts one; 4 lows); branch CI red only on the Fintava-double stall spec (owner question Q-42, ruled in R-70) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/AITOOLS-01.md`). Stacked in batch 13 by MERGE-13 (backend `wmt/MERGE-13`, mobile `wmt/MERGE-13`); not on main.
- **Branches:** backend `wmt/AITOOLS-01` `90ab9aa` on `origin/wmt/MERGE-11` `d0776eb`; mobile `wmt/AITOOLS-01` (this file, SHARED-CHANGES AITOOLS-01 #1 to #4, gaps G-AITOOLS-01-1 to -5, the log line) on `origin/wmt/MERGE-11` `47555987`. No PR.
- **Migration:** `20261025182000_ai_tool_jobs`: the table `AiToolJob` and the enum `AiJobState`. Additive; rollback is in the file.
- **Built:** `src/ai-tools/`. `GET /ai-tools` (VoiceOver: points per minute, `enabled`, limits, voices, and the plan's `caps`), `POST /ai-tools/voiceover/jobs` (text, `voiceId`, `quoteToken`, required `Idempotency-Key`; 202 working), `GET /ai-tools/jobs/{id}` (working, done with `audioUrl`, failed with "No points were taken"). `POST /points/quote` gains `quoteToken`.
- **Points:** hold through POINTS-03 (`PointsSpendService`), provider asked after the answer with no transaction, connection or lock held, store the audio, COMMIT, mark done; any failure RELEASES. A late finish and the stale-hold sweep cannot both win (the points service settles once; the job follows it, and a read repairs a job whose server died).
- **Provider:** one seam, `AI_VOICE_PROVIDER` (`src/ai-tools/voice/`). **NOT RUN against the real provider** (no key on any build machine). Run against `scripts/dev/voice-standin.cjs`. The fact that unblocks it: a provider key set on the Hub (`AI_VOICE_BASE_URL`, `AI_VOICE_API_KEY`, `AI_VOICE_VOICES`).
- **Settings (R-65):** costs, caps and the character limit were already admin settings (POINTS-03). New: `ai.voiceover_chars_per_minute` = 900, PROVISIONAL `AITOOLS-CHARS-PER-MINUTE`. For the owner: VoiceOver 250 points a minute, 5,000 points a day, 5,000 characters and 10 minutes a job, 30 minutes before a stale hold is given back, 900 characters a minute.
- **Not done:** the other tools (one task each); "Your voice" and Save or Use in a product (G-AITOOLS-01-1, -4); the real provider run; the wire shape of the real provider is from its public description and unchecked.
- **Next:** the batch 13 pull request (the lead). The verifier's lows are in SWEEP-MONEY (L1 to L4).
- **History:** tasks/history/AITOOLS-01.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 2a05924a, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AITOOLS-01.md](history/AITOOLS-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
