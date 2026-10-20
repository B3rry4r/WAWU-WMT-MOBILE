---
id: VERIFY-02
title: Hear your name, and write your Voice Intro
owner: YOU
area: VERIFY
order: 271
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [VERIFY-01, VOICE-01, ME-12, DV2-COMP]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [VF3, VF3a, VF3b, VF4, VF4a, VF4b]
---
# VERIFY-02 · Hear your name, and write your Voice Intro

## Current state

As of 20 Oct 2026, verifying (built by a Sonnet builder, T1; mobile `wmt/VERIFY-02` on `origin/main` `025d8d58`; app only, no backend or contract change beyond `npm run api` from backend `bb21578`, which carries VOICE-01).
- **Built:** `src/features/verify/` `HearNameScreen` (VF3, VF3a, VF3b at `/hear-name`), `VoiceIntroScreen` (VF4, VF4a, VF4b at `/voice-intro`), `voiceApi.ts`, `voiceModel.ts`, `voiceParts.tsx`; routes `src/app/hear-name.tsx`, `src/app/voice-intro.tsx`. Entries as drawn: Me's Voice Intro prompt (creator, none made yet) and Your shop's "Hear your name" row (with a draft, as VF2b).
- **"Hear it in my voice":** reads `GET /me/tier` then pushes `/tiers` (none), `/your-tier` (ended, as Publish does) or `/voice-consent` (running). **VF8 is VERIFY-03's and not built: it must register the route name `/voice-consent`. This capability check (a running tier lands on VF8) is verified when VERIFY-03 lands; VERIFY-02 merges into main together with VERIFY-03, never alone.**
- **Checks:** tsc EXIT 0; eslint on the changed files EXIT 0 (one old warning); feature, Me, route-guard and keyed-write tests 25 suites, 482 tests EXIT 0 (new: `voice.test.tsx` 21, `voiceEntries.test.tsx` 14); `scripts/gates/run.py` EXIT 0 (10 run, 0 fail, 16 warn, 1172 files, none mine; baseline check EXIT 0, 0 entries); `check_tasks.py` EXIT 0.
- **Live (V9, a local stack: the Hub from backend `bb21578`, mock WAWU ID, voice and storage stand-ins, the app's web export):** the name preview, save, the intro text, the Hub's 500 character limit, `GET /me/tier` (none lands on `/tiers`) and the real hourly preview limit message all ran against the Hub. Pictures: six boards, light and dark, beside their renders (V5), in the builder's scratch folder `verify-02-b/shots/`.
- **Differs from the boards, recorded:** "About 20 seconds when read" and the "30-second" in the too-long line are not drawn (nothing serves seconds, G-VERIFY-02-1); the limit is the Hub's (500 here, the boards' 250 is an example); web shots carry no status bar or home indicator.
- **Not run:** audio through a real phone speaker and a real voice provider (stand-in only; the playing picture used a 20 s tone served in place of the stand-in's clip); Play again by hand on a device (a test and the live preview cover it).
- **Filed:** BACKEND_GAPS G-VERIFY-02-1, G-VERIFY-02-2; SHARED-CHANGES VERIFY-02 #1 (a shared text area, open), #2 and R1 (the two entries and the two `_layout.tsx` lines, applied on the branch for the lead to confirm).
- **Next:** the verifier (a fresh Sonnet, never the builder). Then the lead merges VERIFY-02 with VERIFY-03.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-66, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person hears their name said in a studio voice (free), fixes it with a phonetic spelling, writes a few lines about themselves, and taps "Hear it in my voice" (VF5 if they have no tier yet).

## Scope

- New files under `src/features/verify/`. Calls VOICE-01's routes (G-800): name preview, save name, save intro text (character count and the "too long" state from the Hub's limit). Nothing here calls a provider.
- "Hear it in my voice" opens VF5 (ME-12) when `GET /me/tier` says no active tier, and VF8 (VERIFY-03) when there is one. This task adds those two taps as drawn.
- Entry points as drawn: the Voice Intro prompt on Me and the Create sheet (once VERIFY-01 has added them).

## Capability checks

- [ ] A person can play their name, type a phonetic spelling, hear it again and save it.
- [ ] A person can write an intro, see the count, and is stopped with a plain message when it is too long; the button is off while empty.
- [ ] "Hear it in my voice" without a tier lands on VF5; with a tier it lands on VF8.
- [ ] Each board above (VF3, VF3a, VF3b, VF4, VF4a, VF4b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

- **Files:** new `src/features/verify/{HearNameScreen,VoiceIntroScreen,voiceApi,voiceModel,voiceParts}.ts(x)`, `src/app/{hear-name,voice-intro}.tsx`, two test files; edited `MeScreen.tsx`, `ShopScreen.tsx`, `src/app/shop.tsx`, `src/app/(tabs)/me.tsx`, `src/app/_layout.tsx` (two lines), the contract copy and `schema.generated.ts` (`npm run api`, backend `bb21578`), records.
- **Check 1 (play, spell, hear again, save):** passed live on the stack (preview with and without the spelling, `PUT /me/voice/name`, Saved) and in `voice.test.tsx` (the preview body, the spelling prefilled from the saved one or the plain name, Play again, Save, a refused save).
- **Check 2 (write, count, too long, off while empty):** passed live (the Hub's 500, over it red with the plain line, the button off) and in tests (empty, spaces only, exactly at the limit, the Hub refusing the words, no limit served is refused).
- **Check 3 (Hear it in my voice):** none lands on `/tiers` live; ended and running by `voiceEntries.test.tsx` (`/your-tier`, `/voice-consent`); a tier that cannot be read goes nowhere and says so. VF8 not built: verified when VERIFY-03 lands.
- **Check 4 (V5):** six boards, light and dark, compared picture with picture (see Current state for what differs).
- **Check 5 (values):** the name, the spelling, the words, the limit and the tier come from the Hub or the user; fixed copy is the boards' (the VF2b row line "Free · how buyers will hear it" is backed: the preview is free). The first name in VF4a's hint is the person's own.
- **Check 6 (states by real cause):** loading (a hanging read), error with Try again (a 500), voices off (`available: false` and `503 voice_unavailable`), the real hourly limit (the Hub's own 429 shown on the live stack), the general throttle (found live: it first read "Something went wrong", now "Too many tries. Wait a moment and try again."), too long, empty.
- **Shared parts:** `IntroBox` (VF4's box) and the 84 round `PlayDisc` are local because no shared piece draws them; the first is SHARED-CHANGES VERIFY-02 #1. `VoicePlayer` is not used: VF3 is not the Voice Intro pill, so its wave uses the same bar shapes (`waveShape`, `playedBars`) and the feed's `AudioSource` plays.
- **Counts:** gates before: not run on a clean main (the first run on the branch had 1 fail, my own comment, fixed); after 0 fail, 16 warn, 0 baseline. Tests as in Current state.
- **Not done:** see Current state ("Not run").

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
