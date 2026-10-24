---
id: AITOOLS-07
title: VoiceOver's four undrawn parts: your own voice, a sample before choosing, Save to the library, Use in a product
owner: YOU
area: POINTS
order: -117
priority: launch
repo: wawu-backend
type: third-party
status: review
depends_on: [AITOOLS-02]
decisions: [R-43, R-68, R-47, R-29, R-65]
passes: [V1, V2, V3, V4, V5, V6, V8, V9]
artboards: [PT2, PT2b]
tier: T2
---
# AITOOLS-07 · VoiceOver's four undrawn parts (backend and app)

## Current state

As of 24 Oct 2026, verifier round 2 (focused T2 re-check of round 3, Sonnet verifier). Backend `origin/wmt/AITOOLS-07` `54f196f` (round 2 head `8f1fe8d`); mobile `wmt/AITOOLS-07` records only. **Verdict: PASS. Status review.** Report in [history](history/AITOOLS-07.md).

- **M1 export: fixed.** Run for a seeded person, the export holds `ownVoiceConsentAt` and `ownVoiceConsentLine` (`voiceProfile`), `savedAt` (`aiToolJobs`, saved and unsaved rows) and `mediaJobId` (`productDrafts`); the recording's key, the audio key and the provider's note stay out.
- **M2 purge: fixed.** The real `AccountPurgeService` with the real `AiToolsModule` and `AccountPurgeModule` (one `AccountPurgeHooks`, the hook registered at start) and the voice stand-in: the noted clone is deleted at the stand-in while the person's job and profile rows still exist, then the rows go; another person's noted clone is untouched; with the stand-in refusing deletes the purge throws twice, every row of the person is unchanged, the clone and its note stay, the agreement is withdrawn (the Voice Intro consent is kept), and once the stand-in answers the next pass drops the voice and then the rows. Waiting leaves nothing else half done: the hook's only write before the wait is the withdrawal (safe to repeat), and the sweep keeps the row `purging` with `purgeBlockedBy: error`, the wallet frozen, and tries again next hour.
- **L1 and L2: fixed.** `note` answers false for a missing job and for a failed write (the adapter then removes the voice itself: no clone left); `saved=false` lists only unsaved jobs, `true` only saved, absent all.
- **Lower items (sweep list, not a round):** the mobile contract copy has not been re-synced to the backend branch since main was merged there (630 lines of main's later routes; the one `saved` description line is present), so sync after the mobile merge of main; no spec pins that the AI tools hook lands in the same `AccountPurgeHooks` the sweep's purge uses (the builder's harness lists the three providers by hand; the real wiring is correct, checked); `purgeBlockedBy` reads `error` for a purge that is waiting on the provider, not a reason a person on the admin side can read.
- **Open to the sweep list from the builder, unchanged:** G-AITOOLS-07-7, G-AITOOLS-07-8. The lead default stands: Use in a product takes any own finished job, saved or not.

## Gap rows (BACKEND_GAPS)

G-AITOOLS-01-1, G-POINTS-08-1, G-AITOOLS-01-4, G-POINTS-08-2 (and G-VOICE-01-6, the same fact) are closed by this task on the server and in the app. Filed: **G-AITOOLS-07-1** (no board draws a consent for VoiceOver; built from VF8's parts with the Voice Intro's line ending "for my VoiceOver", R-29), **G-AITOOLS-07-2** (no board draws where saved results are listed; the Hub lists them, `GET /ai-tools/jobs?saved=true`), **G-AITOOLS-07-3** (no board draws the draft list behind "Use in a product"; built from PT2b's rows, and publish does not use the audio yet), **G-AITOOLS-07-4** (the "Bio" chip on PT2b's player is the Voice Intro's, not drawn), **G-AITOOLS-07-5** (no board draws taking the agreement back; one secondary button), **G-AITOOLS-07-6** (the "Your voice" play button plays the Voice Intro, not a sample of the recording).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `docs/elevenlabs/API-FACTS.md`; `tasks/AITOOLS-01.md`, `AITOOLS-02.md`, `AITOOLS-04.md`, `POINTS-08.md`; `tasks/POINTS-10.md` (on `origin/wmt/POINTS-10`)
- Backend `src/ai-tools/own-voice/`, `src/ai-tools/ai-job.service.ts`, `src/ai-tools/voice/provider-copy.service.ts`

## Goal

A person hears a voice before choosing it, can read a VoiceOver in their own voice after agreeing to it (and take it back), and can save a finished result or attach it to a product draft.

## Capability checks

- [x] A voice row's sample plays from the Hub (backend spec check 1; app tests; live).
- [x] "Your voice" needs a recording and the person's agreement; the voice is made from their own recording and removed at the provider; the delete drops a voice the provider could not drop (checks 2 to 8).
- [x] A finished result can be saved and taken out; another person's cannot (check 9).
- [x] A result attaches to a draft and detaches; another person's cannot (checks 10 to 12).
- [x] The app screens match PT2 and PT2b in light and dark (pictures beside the boards, with the known differences above).

