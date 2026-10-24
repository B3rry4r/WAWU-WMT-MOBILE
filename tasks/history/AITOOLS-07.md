# AITOOLS-07 · round history

Moved out of [tasks/AITOOLS-07.md](../AITOOLS-07.md) word for word, oldest first. The current state is in that file.

## Round 1 (builder, step budget reached)

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B10), backend `wmt/AITOOLS-07` `7679d5d` on `origin/main` `c3a2c7a`, mobile `wmt/AITOOLS-07` on `origin/main` `55e92734`. **Status building: the builder hit its step budget with app tests red and no pictures.** A verifier has not looked.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | G-POINTS-08-1: a voice row had no play button | the catalogue gives a voice `sampleUrl` (a Hub path); `GET /ai-tools/voices/{id}/sample` is public and serves the provider's preview from the Hub (the provider's address never leaves the adapter); the row draws PT2's round play button |
| 2 | G-AITOOLS-01-1: no "Your voice" | `GET /ai-tools/own-voice`, `POST .../consent`, `DELETE ...`; a VoiceOver job may name `voiceId: own`; the row leads the list when the person has a Voice Intro recording |
| 3 | G-AITOOLS-01-4: Save not built | `POST` and `DELETE /ai-tools/jobs/{id}/save`, `saved` on the job, `GET /ai-tools/jobs?saved=true`; PT2b's Save row toggles |
| 4 | G-POINTS-08-2: Use in a product not built | optional `mediaJobId` on product drafts (create, update, view); PT2b's row opens the person's drafts and attaches |

- **Your voice (consent and delete).** Made only from the person's own Voice Intro recording, read from their own row (no request names a key). The Voice Intro's agreement covers intros only (VF8), so VoiceOver has its own: the Voice Intro's line ending "for my VoiceOver", stored with the time (`VoiceProfile.ownVoiceConsent*`). The provider keeps no standing copy: the voice is made for one run, noted on the job (`providerRef` `voice:<id>`) the moment it exists, and removed when the job ends, with retries and the per-minute sweep (`ProviderCopyService`, new kind `voice`). `DELETE /ai-tools/own-voice` takes the agreement back first (nothing new can be made) and has the provider drop every copy still noted; it answers `gone` or `pending`. Default (lead), owner may override: one-run voice and not a standing clone, because provider voice slots are limited per plan and the Voice Intro already works this way.
- **Real provider:** one free READ (`GET /v1/voices?page_size=100`, 200, 24 voices) showed each voice has `preview_url`; recorded in `docs/elevenlabs/API-FACTS.md` is NOT yet done (no step left). Voice making, speech and delete are NOT RUN on the real key (out of credits); stand-in only.
- **Migration:** `20261105100000_ai_tools_voiceover_extras` (four nullable columns; rollback refuses while any holds a value). Stamp later than every origin migration (newest seen `20261104093000`).
- **Routes added (8):** `GET /ai-tools/voices/{voiceId}/sample`, `GET`/`POST`/`DELETE` `/ai-tools/own-voice[/consent]`, `POST`/`DELETE /ai-tools/jobs/{id}/save`; additive fields: `sampleUrl`, `saved`, `saved` query, `mediaJobId`. Nothing existing changes behaviour; `GET /ai-tools` is now async inside.
- **Checks (backend, EXIT 0 each):** tsc; eslint (no --fix) on all changed files; new spec `ai-tools-voiceover-extras.contract.spec.ts` 17/17; with the AITOOLS-01 to -03, provider, migration, voice-intro, plans-shape and rollback specs 161/161; `contract:build` (297 added lines, 0 removed); gates 0 fail (134 warn, 88 accepted); `check_baseline`. `test:protected` was started and not read before the step budget ended.
- **App checks:** tsc EXIT 0. `voiceoverModel` 8/8 and `toolFlow` pass except one assertion changed (below). **`voiceExtras.test.tsx` is RED: 8 of 11 fail** (first failure: the mocked player is never called under `render` from the testing library; the others share the cause). Not debugged. **No pictures were made** (PT2 and PT2b renders exist in `build/design_shots`, the app screens were not rendered). Lint, gates and `check_tasks` NOT RUN in the app.
- **Changed assertions (flag for the verifier):** `toolFlow.test.tsx` line 337 pinned "no Save, no Use in a product" on the done view; this task builds them, so it now expects both rows. Two typed fixtures (`tierModel.test.ts`, `verify/__tests__/model.test.ts`) gain `mediaJobId: null` because the contract now types it.
- **Merge note:** `wmt/POINTS-10` edits `ToolScreen.tsx` and `studioModel.ts` too; this branch adds new files and small edits to `VoiceList`, `VoiceRow` and the done view. Contract files will conflict mechanically: regenerate.
- **Not done:** the red tests; the pictures; the API-FACTS line; "Your voice" has no play button (the Hub serves no sample of it); publishing a draft does not read `mediaJobId` yet.
