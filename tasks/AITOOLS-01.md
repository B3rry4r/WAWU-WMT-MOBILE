---
id: AITOOLS-01
title: The AI tools catalogue and VoiceOver (backend)
owner: YOU
area: POINTS
order: 267
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [POINTS-03, TIER-06]
decisions: [R-43, R-61, R-68]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-01 · The AI tools catalogue and VoiceOver (backend)

## Current state

As of 17 Oct 2026, built (Sonnet builder, T2). Status: verifying. Not yet checked by a verifier.
- **Branches:** backend `wmt/AITOOLS-01` `90ab9aa` on `origin/wmt/MERGE-11` `d0776eb`; mobile `wmt/AITOOLS-01` (this file, SHARED-CHANGES AITOOLS-01 #1 to #4, gaps G-AITOOLS-01-1 to -5, the log line) on `origin/wmt/MERGE-11` `47555987`. No PR.
- **Migration:** `20261025182000_ai_tool_jobs`: the table `AiToolJob` and the enum `AiJobState`. Additive; rollback is in the file.
- **Built:** `src/ai-tools/`. `GET /ai-tools` (VoiceOver: points per minute, `enabled`, limits, voices, and the plan's `caps`), `POST /ai-tools/voiceover/jobs` (text, `voiceId`, `quoteToken`, required `Idempotency-Key`; 202 working), `GET /ai-tools/jobs/{id}` (working, done with `audioUrl`, failed with "No points were taken"). `POST /points/quote` gains `quoteToken`.
- **Points:** hold through POINTS-03 (`PointsSpendService`), provider asked after the answer with no transaction, connection or lock held, store the audio, COMMIT, mark done; any failure RELEASES. A late finish and the stale-hold sweep cannot both win (the points service settles once; the job follows it, and a read repairs a job whose server died).
- **Provider:** one seam, `AI_VOICE_PROVIDER` (`src/ai-tools/voice/`). **NOT RUN against the real provider** (no key on any build machine). Run against `scripts/dev/voice-standin.cjs`. The fact that unblocks it: a provider key set on the Hub (`AI_VOICE_BASE_URL`, `AI_VOICE_API_KEY`, `AI_VOICE_VOICES`).
- **Settings (R-65):** costs, caps and the character limit were already admin settings (POINTS-03). New: `ai.voiceover_chars_per_minute` = 900, PROVISIONAL `AITOOLS-CHARS-PER-MINUTE`. For the owner: VoiceOver 250 points a minute, 5,000 points a day, 5,000 characters and 10 minutes a job, 30 minutes before a stale hold is given back, 900 characters a minute.
- **Not done:** the other tools (one task each); "Your voice" and Save or Use in a product (G-AITOOLS-01-1, -4); the real provider run; the wire shape of the real provider is from its public description and unchecked.
- **Next:** a verifier (V1 to V4, V6 to V9); the lead merges with the next batch and syncs `contract/` and `src/api/schema.generated.ts` (SHARED-CHANGES AITOOLS-01 #3).
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

Backend `wmt/AITOOLS-01` `90ab9aa`. Routes kept as the task named them (no rename).
- **Files:** new `src/ai-tools/` (module, controller, `AiJobService`, `AiToolsService`, DTO, errors, views, `voice/` seam and HTTP adapter, `audio/` store), `src/points/spend/points-job-quote-token.ts`, `scripts/dev/voice-standin.cjs`, `scripts/dev/storage-standin.cjs`, `test/ai-tools/` (harness), migration `20261025182000_ai_tool_jobs`. Changed (additive): `prisma/schema.prisma`, `src/app.module.ts`, `src/points/spend/` (quote carries `quoteToken`), `src/storage/storage.service.ts` (`putGenerated`, `removeGenerated`), the plan-settings registry and defaults (one setting), `account-data-map.ts`, `data-export-sections.ts`, `contract/openapi.json` (+326 lines, nothing removed), `docs/contract/PLANS.md` section 12, `README.md`.
- **Check 1** (cost for 2 minutes listed before anything runs): spec and stack. `GET /ai-tools` 250 a minute, 500 for 2; equals the quote; a changed cost shows at once.
- **Check 2** (enough points holds, runs, commits): spec and stack. 202 working, hold seen at start, done with a playable `audio/mpeg` link, balance 600 to 350, hold committed.
- **Check 3** (the stand-in fails a job): spec for 500, 422, a web page and a store failure; stack for 500. Hold released, balance whole, "No points were taken".
- **Check 4** (two jobs at once never below zero): spec (2 jobs for 1, 5 jobs for 3) and stack. One 202, one 402, balance 100 then 100.
- **Check 5** (each cap named, nothing held): spec for characters, minutes and daily; stack for characters and daily (minutes cannot be reached at 900 characters a minute with the 5,000 character limit). Zero holds, zero jobs, balance unchanged.
- **Check 6** (lost answer then retry): spec and stack. Second request 200 `Idempotent-Replayed`, one job, one hold, one provider call; the same key at the same moment likewise; other words under the key 409.
- **Also tested:** a quote that is wrong, old, another person's or another tool's (409, nothing held); sweep versus late finish both ways; a job whose server died; provider off (listed `enabled: false`, 503); no text stored; another person's job 404.
- **Checks (all in a clean worktree):** tsc EXIT 0; eslint 0 on changed files, prettier clean; `src/ai-tools` 33 pass (24 over HTTP, 9 adapter), `src/storage/tests/generated-file.contract.spec.ts` 4 pass; also pass: account-data-map, data-export-map, plan-settings (3), points rules, admin plan-settings and home-17 (7 suites 58 and 2 suites 34 cases). Gates before 0 fail, 127 warn, 88 accepted; after the same; `check_baseline.py` EXIT 0. `contract:build` EXIT 0. Stack `ai01_test` (7800-7803, stand-ins on 7805 and 7806): walk of 17 checks PASS, `stack.sh down` and all ports closed. No Fintava spec was run or edited; the Money module is not booted by my specs.
- **Not run:** the existing `points-spend.contract.spec.ts` (boots the Fintava double); CI runs it (quote `toMatchObject` only, so `quoteToken` should not break it). The full suite and the protected suite are CI's.
- **Shared changes:** SHARED-CHANGES AITOOLS-01 #1 to #4. **Gaps:** G-AITOOLS-01-1 to G-AITOOLS-01-5.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
