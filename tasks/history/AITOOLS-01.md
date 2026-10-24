# AITOOLS-01 · round history

Moved out of [tasks/AITOOLS-01.md](../AITOOLS-01.md) word for word, oldest first. The current state is in that file.

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

