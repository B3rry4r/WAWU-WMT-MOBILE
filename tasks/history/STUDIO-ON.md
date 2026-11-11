# STUDIO-ON · round history

Moved out of [tasks/STUDIO-ON.md](../STUDIO-ON.md) word for word, oldest first. The current state is in that file.

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

**Verdict: FIX.** Verified 11 Nov 2026 by a separate session against Hub `wmt/STUDIO-ON` (2595cffc) over `origin/main` (bf3f4a3b). One high finding (stale `contract/openapi.json`, CI red); everything else holds.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 (specs, own DB `studio_on_v`) | passed | `jest --runInBand src/ai-tools src/plan-settings`: 45 suites, 546 tests, exit 0 (includes `ai-media-pipeline`, `ai-voice-tools`, `ai-music-tools`, `ai-tools.contract`, `ai-tools-pipeline`, `ai-long-form` the builder did not re-run) |
| V2 (diff vs report) | passed | 15 files, same as the builder's list; no stand-in copies of anything on main |
| V3 (protected routes / contract) | failed | `npm run contract:build` exit 0 but changes `contract/openapi.json` (1 line); see F1. `.pipeline/protected-registry.json` lists no plan-settings or `ai.*` route |
| V4 (gates) | passed | `scripts/gates/run.py` exit 0 (9 gates, 2241 files, 0 fail, 139 warn, 88 accepted); `check_baseline.py` exit 0 (125 entries) |
| V9 (live seam, stand-in providers) | passed | `GET /ai-tools` on the real controller: 19 tools with no stored setting (`ai-tools.contract` length 19; `ai-tools-pipeline` order: 7 launch + 12) |
| `npx tsc --noEmit` | passed | exit 0, no output (fresh `npm ci` + `prisma generate` in own worktree) |
| eslint on the 15 changed files, no --fix | passed | exit 0 |
| `npm run test:contract` (whole suite) | NOT RUN | about 60 minutes in one process; the first seconds already failed on unrelated Nuvion specs, which I stopped (no env had been set for my database at that moment, see note). Affected suites ran instead |

Note on the aborted run: I started `npm run test:contract` by mistake without my database env, killed it within seconds (only my own jest), and dropped my database at the end. Nothing on the shared test database was inspected.

**Findings**

- **F1 (high, defect): `contract/openapi.json` is stale.** The builder changed the Podcast job doc comment (`src/ai-tools/ai-tools.controller.ts:928`) but did not regenerate the contract. `npm run contract:build` on this branch changes the `POST /ai-tools/podcast/jobs` summary (the committed text still says "listed only while `ai.listed.podcast` and `ai.podcast_studio_api_ok` are both on", which is now wrong). `.github/workflows/branch-checks.yml:263-269` fails a branch whose committed contract is not what `contract:build` produces, so CI is red. The mobile app's types come from this file. Fix: run `npm run contract:build` and commit `contract/openapi.json` (a SHARED-CHANGES row for the fenced `contract/**` if the process asks for one).
- **F2 (low, test-gap / report accuracy):** the builder says a pass is "remembered for a day". `PodcastStudioProof` (`src/ai-tools/tools/podcast.tool.ts:38-62`) keeps a pass with no expiry (`holds()` is true for any `ok` state), and `PODCAST_PASS_MS` (line 33) is exported but never used. Behaviour is right (a pass only means "listed", which is also the no-answer state); the constant is dead and the report text overstates. A one-line cleanup, not a defect.
- **F3 (low, note):** one person's 403 hides Podcast for everyone in that process for an hour. Acceptable: the 403 path already treated every 403 as an account-level plan refusal, and the refusal owner item still logs once per refused job.
- **F4 (low, unclear for the dashboard repo):** `ai.podcast_studio_api_ok` now has default and minimum -1 (`plan-setting-registry.ts:1526-1535`). The Hub accepts and shows it (settings specs pass), but I could not see the admin dashboard; if its count input refuses a negative number, the default would display badly. Worth a look when the dashboard follows.

**What I checked and found sound**

- Stored row versus default: `PlanSettingsService.value()` returns the stored row, else the default (`plan-settings.service.ts:134-137`); `set()` skips a value equal to the one in force and a null deletes the row (lines 278-320). A Dashboard 0 turns one tool off (the changed off-specs now set 0 and pass); a stored 1 still lists; a stored row wins over the default; a save never writes a default-0 key as a stored 0. Old stored `ai.podcast_studio_api_ok` 1 forces on and 0 forces off, as before; absent now means "use the proof" (-1 never needs storing, equal-to-default is skipped).
- Podcast proof: listed by default; a stand-in 403 on a real run unlists it (spec), an hour on the proof class with a stand-in clock re-tries, a success clears it, override 1 forces on while refused, 0 forces off. A 403 still takes the old path: `provider_plan`, `fail(job, holdId, code)` gives every point back, one `OWNER ITEM` log per job (`ai-job.service.ts:~980-1000`). Job creation checks `listed()` before any hold (line 321), so the unlisting window can never charge a person or leave a hold; a job already running when the proof trips refunds itself on its own 403, and a replay of an earlier idempotency key still answers the earlier job.
- Process count: `deploy/install-services.sh` writes one systemd unit per service running `node <entry>` (no cluster, no pm2, no replicas), so one process per service and an in-memory proof is consistent. A restart resets it to "listed", and the first real 403 re-trips it, with a refund. Acceptable.
- Provider keys missing: `enabled(provider)` and `listedWhenOff` are untouched in `ai-tools.service.ts:176-181`, so the tool is skipped and its routes answer `503 ai_tool_unavailable` (job route check at `ai-job.service.ts:321`, quotes at `ai-tools.service.ts:81,108`).
- Spec edits follow R-135: the 0-defaults became 1 (counts 7 to 19, Receptionist listed), the "off" specs now set 0 (a real Dashboard off) instead of clearing a row; no assertion was loosened and no gate, baseline or test file outside the task's scope changed.
- Side effect the builder named is real and in scope: tools with a listing switch now write `ai_job_ready` for a long job (`ai-job.service.ts:~1362`), because the switches are on by default.

**Not run:** the whole `npm run test:contract`, any live provider, any call to the live Hub.

## Builder report, fix round 1

Hub `wmt/STUDIO-ON` head `b690e171`.
- **F1 fixed:** `npm run contract:build` run in the Hub worktree (own `npm ci`, own `prisma generate`), `contract/openapi.json` committed (one line, the Podcast job summary); a second `contract:build` left it byte-identical.
- **F2 fixed:** the unused `PODCAST_PASS_MS` is removed and the comment no longer says a pass is remembered for a day. Correct text: a pass has no expiry and only clears a refusal; a refusal lasts one hour (`PODCAST_REFUSAL_MS`). Letting a pass expire would change nothing, because the default is listed.
- **F4 recorded:** `ai.podcast_studio_api_ok` now defaults to -1. Clearing the stored row returns it to -1, because `set(null)` deletes the row, so the Dashboard never needs to type -1. Behaviour unchanged.
- F3 accepted as noted by the verifier.
