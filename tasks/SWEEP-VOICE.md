---
id: SWEEP-VOICE
title: Voice sweep: the low findings of the Voice Intro (VOICE-01, VERIFY-02, VERIFY-03, FIX-95)
owner: YOU
area: OPS
order: -104
priority: launch
repo: all
type: backend-refactor
status: verifying
depends_on: []
decisions: [R-6, R-43, R-66, R-68]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-VOICE · Voice sweep: the low findings of the Voice Intro

## Current state

As of 21 Oct 2026, verifying: built by a Sonnet builder (T1; the consent-record row V2 treated as T2). No PR.
- **Branches:** backend `wmt/SWEEP-VOICE` `1daf6be` on `origin/main` `d7dbf9e`; mobile `wmt/SWEEP-VOICE` (this file) on `origin/main` `905e391f`.
- **Rows:** 9 fixed or ruled in the table below (V1 to V7, A1, A2); each names its commit or its ruling. Five more lows are left, one line each (below).
- **Spec flipped:** one existing assertion. VOICE-01's check 4 used the plain account (`PLAIN`) as the person whose intro is served; V1 makes that account answer null, so the check now uses a creator (`BASIC`) as the owner. Nothing was weakened; V1 has its own case.
- **Checks:** backend `tsc --noEmit` EXIT 0; eslint and prettier on the 6 changed `.ts` files EXIT 0; `voice-intro.contract` and `voice-provider-own-voice` specs in band 35 tests EXIT 0 (on a seeded DB), and `voice-intro.contract` alone 30 tests EXIT 0 on a migrated, NOT seeded DB (V7); `npm run test:protected` 2 suites, 253 tests EXIT 0 against the base lock; `contract:build` EXIT 0 and `contract/openapi.json` unchanged; gates EXIT 0 (0 fail); `check_baseline.py` EXIT 0. App `tsc --noEmit` EXIT 0; eslint on the 3 changed source files EXIT 0; jest (`src/features/verify`, `src/features/me`, lists, focus, route-guard, route-graph, auth-guard, keyed-write-sites) 30 suites, 637 tests EXIT 0, then the new `entryRow.test.tsx` 2 tests EXIT 0; `scripts/gates/run.py` EXIT 0 (10 run, 0 fail, 18 warn: one is the new PROVISIONAL mark), `check_baseline.py` EXIT 0, `check_tasks.py --write` EXIT 0 (392 tasks).
- **Without the fix (proof):** the five backend cases (V1, V2, V3, V4, V5) fail on the unfixed services and rollback; V7's old spec fails (1 of 26) on a migrated, unseeded DB and the new one passes; `entryRow.test.tsx` fails 2 of 2 on the old `ListRow` and `EntryRow`.
- **Not run:** the real voice provider (a provider key set on the Hub), the full backend suite (CI runs it), anything Fintava.
- **Next:** a fresh Sonnet verifier checks each row; the lead merges backend and mobile branches together.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row (`tasks/VOICE-01.md`, `tasks/VERIFY-02.md`, `tasks/FIX-95.md`)

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

The Voice Intro: the Hub's `src/voice-intro/` and its migration, and the app's `src/features/verify/` voice screens. Only the rows in the table; nothing else is touched.

## Capability checks

- [x] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [x] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report | Closed by |
|---|---|---|---|---|
| VOICE-01 | V1 | `GET /users/{wawuId}/voice-intro` answered for an account with no public profile (a plain account with a tier and an intro): it must answer as for no intro (`{ voiceIntro: null }`), never saying one exists. | VOICE-01 verifier, finding 2 (`voice-profile.service.ts:155`) | Fixed, backend `1daf6be`: no creator state answers null after the profile and block checks (an unknown or blocked person is still 404). Case "answers as for no intro for a person with no public profile": the same account with a made intro answers null, byte for byte as a creator with none, and the intro is served once the account has creator state. Fails without the fix. |
| VOICE-01 | V2 | `rollback.sql` dropped the stored consent rows with no guard. | VOICE-01 verifier, finding 5b | Fixed, backend `1daf6be`: a `DO` block raises and changes nothing while any `VoiceProfile` holds consent, words, a recording or audio, or any `VoiceIntroRun` exists (a saved name spelling alone does not stop it). Case "rollback.sql refuses while a consent or an intro is stored" runs the whole file in a rolled-back transaction: five refusals, two passes. Fails without the fix. |
| VOICE-01 | V3 | A name preview that failed at the provider still counted toward the hourly limit. | VOICE-01 verifier, finding 3 (`voice-profile.service.ts:117`) | Fixed, backend `1daf6be`: the try is still recorded under the person's lock before the call (so the limit holds under parallel presses), and given back if the provider fails or the audio cannot be stored. Case "does not count a preview the provider failed on": five failures, zero rows, then the two the hour allows and the 429. Fails without the fix. |
| VOICE-01 | V4 | A failed run still showed `costPoints` 200 beside "No points were taken". | VOICE-01 verifier, finding 1 (`voice-intro-run.service.ts:490`) | Fixed, backend `1daf6be`: `run.costPoints` is 0 for a failed run (the column keeps what was held). Asserted in the existing "gives back every held point" case (one assertion added: view 0, row 200). Fails without the fix. |
| FIX-95 | V5 | An empty name dropped "I am X." from the consent line, so a line without a name was served and stored. | FIX-95 verifier, L1 (`voice-profile.service.ts:45-48`) | Fixed, backend `1daf6be`: with no name the view's `consent.line` is "Add your name to your profile first." (the same ask the app's VF3 makes), and `POST /me/voice-intro/consent` refuses with `409 voice_name_required` and stores nothing, for that sentence and for the line without a name. Case "serves no consent line for a person the Hub holds no name for". Fails without the fix. The contract file is unchanged (no new field). |
| FIX-95 | V6 | Settings named `voice_intro.*` beside VOICE-01's `voice.*`. | FIX-95 verifier, L2 | **Ruled no.** Both sets are live in the registry and in the plan-settings defaults, and the owner may already have set either; renaming a live setting is a migration, not an addition (backend CLAUDE.md, additive only). An alias is not two lines: the registry has no alias for a key (`plan-setting-registry.ts`), so the Hub would need a second lookup path. The two prefixes stay; a later cut-over task can unify them. |
| VOICE-01 | V7 | The check-4 spec needed seeded `UserProfile` rows (404 where it expected 200 on a migrated, unseeded database, which is what `stack.sh` builds). | VOICE-01 verifier, finding 4 (`voice-intro.contract.spec.ts:727`) | Fixed, backend `1daf6be`: the harness makes the profile and creator-state rows it needs when they are missing and removes only those it made, so a seeded database is left as found. The spec passes 30 of 30 on a migrated, unseeded database; the old spec failed there (1 of 26). |
| VERIFY-02 | A1 | `NAME_MAX` 60 and `PHONETIC_MAX` 80 (`voiceApi.ts` 27-28) were literals. | VERIFY-02 verifier, "two literal field limits" | Filed, mobile `227ca40a`: the Hub serves neither (`GET /me/voice` has no limit), so BACKEND_GAPS G-SWEEP-VOICE-1 is filed and both stay literals, now marked `PROVISIONAL(VOICE-NAME-LIMITS)` (the gate reads the mark). The Hub refuses longer text anyway. |
| VERIFY-02 | A2 | `EntryRow` (`voiceParts.tsx` 76-116) overlapped `ListRow`. | VERIFY-02 verifier, "`EntryRow` is not in the builder's Shared parts note" | Fixed, mobile `227ca40a`: `EntryRow` is a `Card` holding one `ListRow` (the Me prompt and VF2's row keep their testIDs); `ListRow` gains one optional prop, `padV`, so the card stays the board's 76 high (SHARED-CHANGES SWEEP-VOICE #1). The type is now the kit's (15.5, 13, chevron 18) where it was the board's (15, 12.5, 17). `entryRow.test.tsx` fails without the change. |

## Left as lows (not this sweep)

- **ShopRing reuse** (VERIFY-03 L5): `TakeRing` and `MakingRing` rebuild `ShopRing`'s track and arc; a later tidy.
- **IntroBox** (VERIFY-02, SHARED-CHANGES VERIFY-02 #1): VF4's box stays local until the shared field takes the props.
- **VF10a residual spacing** (VERIFY-03 round 3): a few pixels from the board.
- **LR1 and L3 from SWEEP-JOIN**: stay in that sweep's table.
- **VF8 with no name** (new, from V5): the app prints `consent.line` as served, so for a person the Hub holds no name for it would print the Hub's ask inside quotes and "I agree" would be refused with `voice_name_required`. Registration needs a first name, so it should not happen; the app screen is not one of this sweep's rows.

## Builder report

- **Backend:** `src/voice-intro/{voice-profile.service,voice-intro-run.service,voice-intro-error,voice-intro-view.type}.ts`, `prisma/migrations/20261030140000_voice_intro/rollback.sql`, `test/voice-intro/voice-intro-harness.ts`, `src/voice-intro/tests/voice-intro.contract.spec.ts` (5 new cases and one assertion), `docs/contract/PLANS.md`. No schema, migration, route or protected route changed; `contract/openapi.json` is unchanged.
- **App:** `src/features/verify/{voiceApi,voiceParts}.ts(x)`, `src/components/ListRow.tsx` (one optional prop), `src/features/verify/__tests__/entryRow.test.tsx`, BACKEND_GAPS, SHARED-CHANGES, records.
- **Test setup:** databases `sweepvoice_hub_test` (seeded), `sweepvoice_bare_test` (migrated only), `sweepvoice_prot_test` (seeded, for `test:protected`); the voice stand-in and the mock WAWU ID on 7860 and 7861; all dropped and stopped at the end. The two voice specs name Fintava only in a comment (grep checked) and import no double.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
