---
id: STUDIO-ON
title: Studio's tools are on by default from the Hub, with no Dashboard step
owner: YOU
area: CREATE
order: 385
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-109, R-135]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# STUDIO-ON · Studio's tools are on by default from the Hub, with no Dashboard step

## Current state

As of 11 Nov 2026.
- **Status:** built, waiting for the T1 verifier. Hub branch `wmt/STUDIO-ON`, head `2595cffc` (on top of main `bf3f4a3b`).
- **Done:** the 12 `ai.listed.<id>` defaults are 1; the Podcast maker's Studio API check is the Hub's own; `ai.podcast_studio_api_ok` is a three-state Dashboard override.
- **Next:** verifier on wawu-backend `wmt/STUDIO-ON`. Not run here: the full `npm run test:contract` (see the report).

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-109 (point 7) and R-135
- wawu-backend: `src/plan-settings/plan-settings.defaults.json`, `src/plan-settings/plan-setting-registry.ts` (the three `ai.listed.${id}` loops and `ai.podcast_studio_api_ok`), `src/ai-tools/ai-tools.controller.ts` (`GET /ai-tools`, how a tool is listed), `src/ai-tools/tools/podcast.tool.ts`, `src/ai-tools/voice/http-voice-provider.ts` (`mediaToolsConfigured`), how a stored setting row and the default are combined (`plan-settings.service.ts` or its equivalent)
- The provider's docs in the mobile repo `docs/` (Studio API, for the podcast proof)

## Goal

A signed-in person opening Studio sees every built tool, with nobody touching the Dashboard.

## Scope

- **Defaults.** `ai.listed.<id>` defaults to 1 for: image, photo-edit, video, talking-photo, voice-changer, dialogue, my-voice, video-music, stems, audiobook, podcast, receptionist. Change the setting labels and the comments that say "the lead turns it on" (registry, defaults file notes) so they say the switch only turns a tool off (R-135).
- **A stored 0.** Find out how a stored row and the default combine. If a stored row wins and the Dashboard writes every key when anything is saved, a 0 nobody chose would keep a tool off: report what you find in this file. Never write to a production database from this task.
- **The Podcast proof, done by the Hub.** Replace the person-set switch with a check the Hub makes itself: find, in the provider's docs, a call that proves our account may use the Studio API without creating or charging anything (a read). The Hub makes it on first need, caches the answer (a pass for a day, a refusal for an hour), and lists Podcast while it passes. A 403 on a real run already refunds the points and logs an owner item; it also marks the proof failed. `ai.podcast_studio_api_ok` stays as a Dashboard override only (1 forces on, 0 forces off; unset means "use the proof"): make that a third state without breaking today's two values. If the docs give no such read call, keep Podcast's listing on the existing 403 path (listed by default; the first 403 unlists it until the next proof window) and record why.
- **Provider not configured.** A tool whose provider keys are not set (`mediaToolsConfigured` false) behaves exactly as it does today. Check and record what that is.
- **Tests.** Update the specs that assert the 0 defaults so they assert 1 (the ruling changed, not the check), and add specs for the podcast proof (stand-ins only, never the live provider). Run every suite that greps for `ai.listed` and `podcast_studio_api_ok`, and `npm run test:contract`.

## Capability checks

- [ ] With no stored setting, `GET /ai-tools` lists all 12 tools (spec on the real controller with stand-in providers).
- [ ] A Dashboard 0 still turns a single tool off.
- [ ] Podcast is listed when the stand-in proof passes and not listed when it is refused, with no person setting anything.
- [ ] Nothing else in `GET /ai-tools` changes (the launch tools, prices, `enabled`).

## Builder report

**Hub change (wawu-backend `wmt/STUDIO-ON`, commit `2595cffc`).**
- `plan-settings.defaults.json` and the registry: `ai.listed.{image, photo-edit, video, talking-photo, voice-changer, dialogue, my-voice, video-music, stems, audiobook, podcast, receptionist}` default 1. Labels, registry comments, the two provisional notes, the controller comment and `docs/contract/PLANS.md` now say the switch only turns a tool off (R-135).
- **Stored row versus default.** `PlanSettingsService.value()` returns the stored row first, else the default. `set()` writes a row only when the value differs from the one in force (`same(before, after)` skips), and a null deletes the row. So the Dashboard does NOT write every key when anything is saved: a 0 was only ever stored by a person who set a key to 1 and then back to 0 (or 0 on a key whose default was 1, which none was). A stored 1 from a lead who turned a tool on is harmless. Found in code only; nobody read a production database. Whether the Dashboard UI sends keys the person did not touch cannot be seen from the Hub, but the Hub drops an unchanged value, so a default-0 key never became a stored 0 that way. Owner could still check production for stored `ai.listed.*` rows with value 0 (it would be a deliberate off).
- **Podcast proof.** The provider docs in this repo (`docs/elevenlabs/API-FACTS.md`, AITOOLS-13) hold no read call that proves the Studio allowlist. The provider's public docs list `GET /v1/studio/projects`, but the page says nothing about the allowlist or a 403, so a 200 would not prove it and no read was made (nothing called live). So the fallback of the task is built: `PodcastStudioProof` (`src/ai-tools/tools/podcast.tool.ts`): listed by default; a 403 on a real run marks it refused (unlisted for one hour, then tried again); a run the provider accepts marks it passed (clears a refusal, remembered for a day). In memory per process. `ai.podcast_studio_api_ok` is now a Dashboard override: -1 (default) uses the proof, 1 forces on, 0 forces off. Stored 1 and 0 mean what they did. `requiredSettings` on `AiTool` is replaced by `proof(settings)`; `isListed` calls it.
- **Provider not configured.** Unchanged: a tool with `enabled(provider)` false and `listedWhenOff` false is skipped by `GET /ai-tools` and its routes answer `503 ai_tool_unavailable`; the Receptionist view says `available: false`. Only the listing switch default changed.
- **Side effect to know.** The "long job ready" notice (`ai-job.service.ts`, `ai_job_ready`) is written only for a tool with a listing switch that is on, so with the switches on by default those tools now write it for a job longer than `ai.job_ready_notice_seconds`. That is the intent of R-135 and the old lead ruling of 30 Oct was about listing.

**Specs.** Expected defaults changed from 0 to 1 because R-135 changed the behaviour (not the check): `ai-tools.contract` (7 to 19 tools), `ai-tools-pipeline` (list of 19, Receptionist listed), and the "switch off" specs in `ai-media-pipeline`, `ai-voice-tools`, `ai-music-tools` now turn a tool off with a 0 instead of clearing the row. `ai-long-form` no longer sets the Studio switch; new tests: every Studio tool listed with no stored setting, Podcast listed while the stand-in proof passes and dropped after a stand-in 403 with no person setting anything, override 1 and 0, the hour window on the proof class with a stand-in clock, a Dashboard 0 still turns one tool off (existing off-specs).

**Commands (Hub worktree).**
- `npx tsc --noEmit`: exit 2. Every error is in files this task did not touch (shared Prisma client in `generated/` is older than main's schema: `ownerRemovedAt`, `purchases`, `frames`; `sharp` not installed). Zero errors under `src/ai-tools` or `src/plan-settings`.
- Affected specs (`ai-tools`, `plan-settings`, 20 suites, with a scratch jest config mapping `sharp` to a stub, own database `studio_on`, mock WAWU ID on 4731): ai-tools suites pass except `ai-tools-voiceover-r3` purge tests (3), which fail on the same stale client (`ContentPiece.creatorWawuId` etc. in `failed`), and `plan-settings-round2` and `plan-settings-readers` (cash-out, tier, 401 from the mock; points money, not Studio). After the last edits `ai-tools-pipeline` and `ai-long-form` were re-run and pass (48 tests). The other edited suites ran green in the 20-suite run except as listed.
- `npm run lint`: exit 1 (3439 problems, caused by the same stale client; it also rewrote about 150 unrelated files, which I restored by name; only my 15 files are committed). No lint error in a file I changed.
- `python3 scripts/gates/run.py`: exit 0, 0 fail, 139 warn, 88 accepted.
- NOT RUN: the whole `npm run test:contract` (stale shared client and no `sharp` make it fail on main's files; run in a fresh stack by the verifier), `check_baseline.py`, any live provider call.

## Verifier report
