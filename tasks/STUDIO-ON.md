---
id: STUDIO-ON
title: Studio's tools are on by default from the Hub, with no Dashboard step
owner: YOU
area: CREATE
order: 385
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-109, R-135]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# STUDIO-ON · Studio's tools are on by default from the Hub, with no Dashboard step

## Current state

As of 11 Nov 2026.
- **Status:** back to building. T1 verifier verdict FIX on Hub `wmt/STUDIO-ON` (2595cffc): one high finding.
- **Open:** F1 (high): `contract/openapi.json` not regenerated, `npm run contract:build` changes the Podcast job summary and the CI contract job fails. Fix: regenerate and commit it. Lows F2 to F4 (dead `PODCAST_PASS_MS`, one 403 hides the tool for all for an hour, `-1` default needs a look in the dashboard) go to the CREATE sweep.
- **Verified sound:** 19 tools by default, Dashboard 0 off, stored 1 and rows win, Podcast proof 403/hour/pass/override, refund and one owner item on 403, no charge or half job in the window, one process per service, missing keys still 503, specs follow R-135. 45 suites, 546 tests, tsc, eslint, gates and baseline all exit 0.
- **Next:** builder fixes F1 only, then a lean re-check (contract:build clean).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/STUDIO-ON.md](history/STUDIO-ON.md).

