---
id: VOICE-01
title: Hear your name and the Voice Intro (backend)
owner: YOU
area: VERIFY
order: 266
priority: launch
repo: wawu-backend
type: third-party
status: review
depends_on: [POINTS-03, TIER-03]
decisions: [R-43, R-66, R-68, R-6]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# VOICE-01 · Hear your name and the Voice Intro (backend)

## Current state

As of 20 Oct 2026, review: verified by an independent Sonnet verifier (T2), verdict PASS (nothing medium or worse; five lows).
- **Branches:** backend `wmt/VOICE-01` `310358c` on `origin/main` `2786c0b` (unchanged by the verifier); mobile `wmt/VOICE-01` (this file, SHARED-CHANGES VOICE-01 #2 to #5, gaps G-VOICE-01-1 to -6, G-800 reworded). No PR.
- **CI on `310358c`:** Gates and Protected routes (V3) green; Branch checks run 39486966919 was still running when the verifier handed back (the lead watches it).
- **Migration:** `20261030140000_voice_intro` (tables `VoiceProfile`, `VoiceIntroRun`, `VoiceNamePreview`; additive, rollback.sql proven again by the verifier).
- **Not done (recorded, not findings):** `voiceIntro` on the public profile route (lead ruling: served by `GET /users/{wawuId}/voice-intro`, G-VOICE-01-1 open for after launch); the recording's length is not checked (G-VOICE-01-2); "Your voice" in VoiceOver (G-VOICE-01-6); the real provider run (G-VOICE-01-3, NOT RUN: a provider key set on the Hub).
- **Next:** the lead merges. The five lows go to the backend sweep (below). The provisional figures (500 characters, 20 previews an hour, 10 MB) and the consent wording stay the owner's.

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

Verifier: Sonnet agent, 20 Oct 2026 (T2, 40 minute limit). Built none of it. Backend `origin/wmt/VOICE-01` `310358c` against `origin/main` `2786c0b`. Ran a real stack (the Hub built from the branch, the mock WAWU ID, the Nuvion stand-in, the voice stand-in `scripts/dev/voice-standin.cjs`, the storage stand-in), with my own requests through presign, upload, confirm and the nine routes. No real provider, bucket or host was called. Nothing Fintava was run (the voice spec only names the double in a comment). Evidence: logs in the verifier's scratch folder `voice01-v/`.

**Verdict: PASS.** No blocker, high or medium. Five lows.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `python3 scripts/gates/run.py` EXIT 0 (9 gates, 1706 files scanned, 0 fail, 130 warn, 88 accepted); `check_baseline.py` EXIT 0 (124 entries); `tsc --noEmit` EXIT 0; eslint (no fix) and prettier --check on the 22 changed TS files EXIT 0 |
| V2 Contract | passed | voice specs 29 of 29 (2 files) on a migrated and seeded DB, EXIT 0; 13 neighbour suites by name (ai-tools, account-purge, data-export, plan-settings, storage) 195 of 195, EXIT 0; own requests below, incl. a wrong-format input (a name with `<script>` 400, an extra `wawuUserId` field 400) |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh origin/wmt/VOICE-01` against the lock at `origin/main` (2786c0b): 2 suites, 253 of 253, "all 244 required tests passed", EXIT 0. CI Protected routes (V3) also green |
| V4 Field trace | passed | consent line and time: `VoiceProfile.consentAt/consentLine`, shown in `GET /me/voice-intro`; sample key, time and the consent time in force (`sampleConsentAt` equals `consentAt`); audio key written only by a finished run, read by `GET /me/voice-intro` and by the other person's `GET /users/{id}/voice-intro` (checked from both sides); account purge and data export maps include the three tables |
| V6 States | passed | each state through its real cause: no words, no consent, no recording, sample not landed (PUT but not confirmed), busy (second try while working), short balance 402, provider down, provider refuses, recording gone from the bucket, preview limit 429 |
| V7 Flow walk | passed | words, consent, recording (presign, PUT, confirm, attach), generate, poll, public view, as a person with a tier and as one without; a second person tried to use the first one's link, id and query (refused) |
| V8 Money | passed | see checks 1 and 2: one hold per key, 200 held and kept on success, released on failure, no second hold on a replay (also two replays in parallel), no points for the included first; the points ledger shows grant, hold, hold, release only |
| V9 Live seam | passed (stand-ins) | signed in through the mock WAWU ID (real RS256 token), real Hub, real database, real presign and storage path against the storage stand-in; the provider is the stand-in. The real provider is NOT RUN: unblocked by a provider key set on the Hub |

**Capability checks**
1. Tier with no intro: PASSED. A person with a tier and no intro: the first try took no points (no hold, `included: true`, `costPoints: 0`, the tier's flag spent); with 450 points the next held 200 and kept it on success (balance 250; `PointHold` committed). The price is read from the plan settings (`points.action.voice_intro`), not a literal (`voice-intro-run.service.ts:168`, the spec changes the setting and the hold follows). A short balance answered 402 `insufficient_points` and wrote no run.
2. Failure and lateness: PASSED. Provider down (`[[sample-fail]]`): hold released, balance back to 250, run `failed`, message "That didn't work. No points were taken. Try again.". Provider refuses (`[[sample-reject]]`) on the included try: flag put back to true, no points. Recording gone from the bucket: same, `sample_unreadable`. A failed try leaves the earlier Voice Intro in place. Late finish after the stale-hold sweep, a slow included try given up on, an unstorable audio file and an included try that never finished are proven by the spec through the real `releaseStale` and `reconcile`. The one-run voice made at the provider was removed every time (stand-in: 6 made-or-refused calls, 4 voices made, 4 deleted).
3. Consent, time, sample, whose voice: PASSED. The consent line must come back unchanged (changed line 409 `voice_consent_line_changed`); consent and its time are stored with the exact words; sample before consent 409; a sample that never landed or was only sent and not confirmed 400 `voice_sample_unusable`; another person's landed link, a foreign host, a look-alike host, user info in the link, `../`, and a bare key for another person were all refused (400). No route takes a person id except the read-only public one; an extra `wawuUserId` in a body is refused (400) and in a query is ignored (the caller's own profile is used).
4. Public read: PASSED on `GET /users/{wawuId}/voice-intro`: `{ voiceIntro: { url, aiVoice: true } }` for a person with an intro (the link played: 200 `audio/mpeg`), `{ voiceIntro: null }` for one with none or no row, 404 unknown or blocked, 400 bad id, 401 no token. Only the audio is public (no words, consent or recording). The public profile routes are untouched, per the lead's ruling.

**Other checks**
- No provider call inside a transaction, a held connection or a lock: read every path (`previewName`: lock and count in a short transaction, provider after; `run`: sample read, provider call, audio put and every remove run holding nothing). Proven live with a 4 to 5 second `[[slow:...]]` call, for the included and the paid try: during the call every Hub connection was `idle` with no open transaction, no advisory or transaction lock, and the hold read `held`.
- Provider never named (R-68) and no em-dash (R-5): scanned the whole diff, the contract diff and every live response; none. Error words are plain ("No points were taken").
- Migration additive, rollback works: ran all 182 earlier migrations, then the new one (3 tables, nothing existing touched), the constraints and the one-working-run index refuse bad rows, `rollback.sql` drops the tables and puts back the included flag of a person whose try was still working (and not for a done one), and the migration re-applies cleanly.
- Retried Idempotency-Key: the same key again answers 200 `Idempotent-Replayed: true`, takes nothing more (one hold in total, ledger unchanged), also with two replays at once; without a key 400. A failed try replays as failed; a new key makes a new try.
- Files vs report: matches the 30 files in `git diff --stat origin/main...origin/wmt/VOICE-01`; nothing extra, nothing missing.

**Findings** (all low; none blocks the merge)
1. low, unclear: a failed try still reports its price. `src/voice-intro/voice-intro-run.service.ts:490` (`runView` copies `run.costPoints`). Repro: paid try with a recording containing `[[sample-fail]]`, then `GET /me/voice-intro`: `run: { state: "failed", costPoints: 200, message: "...No points were taken..." }`. An app that prints `costPoints` beside a failure would say 200. Suggest `costPoints: 0` for a failed run, or tell the app to read the message only.
2. low, unclear: the public intro route answers for a person who has no public profile. `src/voice-intro/voice-profile.service.ts:155` checks only that a `UserProfile` row exists and the block; `GET /users/{id}/public-profile` also 404s a plain `user` account with no creator state. A plain user with a tier can make an intro and anyone signed in who knows the id can fetch its audio link. Owner or lead to say whether a plain user may have one.
3. low, defect: a name preview counts against the hourly limit even when the provider then fails. `voice-profile.service.ts:117` records the try before the call at `:123`. Repro: stop the provider, press "hear your name" 20 times, then start it: 429 `voice_preview_limit` with nothing heard.
4. low, test-gap: the contract spec needs the seeded `UserProfile` rows. `src/voice-intro/tests/voice-intro.contract.spec.ts:727` gets 404 where it expects 200 on a database that is migrated but not seeded (what `stack.sh` builds). It passes on a seeded database (the CI one, and the protected-suite one I made: 29 of 29). A one-line `userProfile.upsert` in the harness would make it stand alone.
5. low, unclear (not VOICE-01's code): "the included first Voice Intro" is granted again with every new tier period, because `src/plans/tier-grant.service.ts:229` sets `voiceIntroIncluded: goods.firstVoiceIntro` when a new period starts after one ended (an upgrade keeps a spent flag, line 358). So it is first per period, not first ever. TIER-03 behaviour; the owner may want to confirm. Also, `rollback.sql` drops `VoiceProfile` with the stored consent lines and times without a guard (its comment says to run it only after the build is gone); a consent record is worth archiving before a real rollback.

**NOT RUN:** the real provider and the real bucket (a provider key set on the Hub and a live bucket); the Branch checks CI run 39486966919 (still running at hand-back; Gates and Protected routes were green).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
