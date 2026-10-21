---
id: VERIFY-02
title: Hear your name, and write your Voice Intro
owner: YOU
area: VERIFY
order: 271
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
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
- **Verified 20 Oct 2026 (fresh Sonnet verifier, T1): PASS, no finding medium or worse; status review.** Lows go to the VERIFY sweep (see Verifier report). The running-tier capability check (lands on VF8) is verified when VERIFY-03 lands, as ruled; **VERIFY-02 merges into main only together with VERIFY-03.**
- **Next:** the lead merges VERIFY-02 with VERIFY-03.

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

**Verdict: PASS** (head under check `f1f28501` on base `025d8d58`; nothing medium or worse; 5 lows for the sweep). Verifier: a fresh Sonnet, 20 Oct 2026, built none of it.

| Pass | Result | Evidence |
|------|--------|----------|
| Diff vs report | passed | 23 files, 3531 added, 996 deleted. Every file the builder lists is there; extras are `docs/PROGRESS.md`, `docs/LOG.md`, `contract/SOURCE_COMMIT` (records). The 996 deleted lines are the contract and generated-type sync: `contract/SOURCE_COMMIT` is `bb21578`, and `npm run api -- --backend <backend bb21578>` re-run by the verifier left `git status` clean (nothing hand-edited). |
| tsc | passed | `npx tsc --noEmit` EXIT 0 (after `npm ci` on the branch lockfile) |
| eslint | passed | the 14 changed source files, EXIT 0, no warning |
| Tests | passed | `src/features/verify`, `src/features/me`, route-guard, route-graph and auth-guard: 26 suites, 540 tests, EXIT 0 (includes `voice.test.tsx`, `voiceEntries.test.tsx`) |
| Gates | passed | `scripts/gates/run.py` EXIT 0 (10 run, 1172 files scanned, 0 fail, 16 warn, 0 accepted, none in changed files); `check_baseline.py` EXIT 0 (0 entries); `check_tasks.py` EXIT 0 (390 tasks) |
| V1 (checks 1 to 3) | passed, one part deferred | Live on a local stack (Hub from backend `bb21578`, mock WAWU ID, voice and storage stand-ins, the branch's web export), signed in through the real sign-in screen. Check 1: the name played as VF3 opened, "Not quite right?" opened the spelling, "Play again" fired a new preview, "Save" showed the Saved pill and `GET /me/voice` then answered the kept spelling. Check 2: the box showed `156 / 500` (the Hub's `textMaxChars`, not the board's 250), 620 characters turned the box red with "Too long for a Voice Intro. Cut a sentence." and `620 / 500`, the button was disabled while over the limit and while empty. Check 3: with no tier "Hear it in my voice" landed on `/tiers`. Ended (`/your-tier`) and running (`/voice-consent`) are covered by `voiceEntries.test.tsx` (passed) only: **VF8 is VERIFY-03's, verified when it lands (lead ruling), not a finding.** |
| V4 / V6 States | passed | Real causes: loading and error and voices-off and throttle by tests (passed); the Hub's real hourly preview limit: after about 16 previews in the hour (the screens' own plus the verifier's) the Hub answered `429 voice_preview_limit` and the app showed its own words, "You have heard your name a lot in the last hour. Try again a little later." under the disc (`shots/limit-429-dark.png`); too long and empty and over-the-limit button state by typing (above). |
| V5 Picture | passed, with notes | VF3, VF3a, VF3b, VF4, VF4a, VF4b rendered with `render_design.py` and compared with the verifier's own web screenshots at 390 px, dark and light (`shots/cmp-{dark,light}-*.png`, board on top, built below). Layout, spacing, copy, icons, ring colours, the disabled button and the Saved pill match. Differences all recorded: no status bar or home indicator on web; the limit is the Hub's 500 (board's 250 is an example); "About 20 seconds when read" and "30-second" not drawn (G-VERIFY-02-1). Not captured by me: the VF3 playing picture (the stand-in clip ended before the shot, the disc showed Play, the builder's 20 s tone covers it) and VF4a in light (the dark run had kept words on the same account, so the light box showed them); the empty box is the same component and was seen in dark. Audio through a speaker not heard. |
| V9 Live seam | passed | Values only the Hub could give: the person's name (Chidi Umeh) from the profile, `textMaxChars` 500, the kept spelling, the 429 text. |
| Facts | passed | No literal limit on the intro (the Hub's `textMaxChars`; an answer without one is refused, `voiceApi.ts` `isIntro`); no seconds; no provider named (grep for brand names in the new files: none, R-68); no em-dash in user text; entries are the drawn ones (Me's prompt for a creator with no Voice Intro, Your shop's row only with a draft); nothing reintroduces the retired Shop (R-2: `/shop` here is VF2 Your shop); the two `_layout.tsx` lines are only `Stack.Screen` registrations. |

**Findings**

- low, differs-for-recorded-reason: **`IntroBox` is a local box beside the shared `TextField`** (`src/features/verify/voiceParts.tsx` 118-168). It duplicates the multi-line field's focus ring, danger ring and growth with the board's own metrics (200 high, 20 corner, no label). The shared field cannot draw the board without new optional props, `TextField` is fenced, and the request is filed (SHARED-CHANGES VERIFY-02 #1, open), so it is a stand-in with a removal plan (WORKFLOW section 4), not a silent fork. Repro: open `/voice-intro` and compare with `TextField multiline`. For the lead: apply row #1 (hide label, min height, corner) and let a follow-up swap `IntroBox` out.
- low, defect: **`EntryRow` is not in the builder's "Shared parts" note** (`voiceParts.tsx` 76-116, used at `MeScreen.tsx` 240 and `ShopScreen.tsx` 77). It draws a card with an `IconTile`, title, caption and chevron, which `ListRow` in a `Card` also draws; it carries the board's 15 and 12.5 type where `ListRow` has 15.5 and 13. Same remedy as above (a row variant on `ListRow`); sweep.
- low, differs-for-recorded-reason: **an ended tier goes to `/your-tier`, not VF5** (`voiceModel.ts` 16-21, `voice-intro.tsx` 27-28). The task text says VF5 for "no active tier". The same branch of the Publish entry (`shop-product.tsx` 26-29, VERIFY-04 task line 23, TIER-02 ended default) sends an ended tier to Your tier (VF14b "Your tier has ended ... Renew"), and VF5 sells a new tier. Judged right: one place renews. Flip is one line in `hearInMyVoiceRoute` if the lead rules otherwise.
- low, unclear: **two literal field limits** `NAME_MAX = 60` and `PHONETIC_MAX = 80` (`voiceApi.ts` 27-28) are the contract DTO's `maxLength`, not values the Hub serves (R-47 says no literal limit). The 60 is G-VERIFY-02-2; the 80 on the spelling field is not in BACKEND_GAPS. The Hub refuses longer anyway. Repro: type 81 characters in the spelling field; the field stops at 80.
- low, unclear: **no board draws Me's Voice Intro prompt for a person with none** (the Verify entry map's hotspot sits on the 52 high Bio pill; the builder drew a 76 high card with the legend's words "Voice Intro / Write it, hear it in your voice"). It is the drawn text at the drawn place, but the picture is the builder's. Owner or designer to confirm.

Capability checks: 1 passed; 2 passed; 3 none passed live, ended and running by test, running's landing on VF8 awaits VERIFY-03; 4 passed (notes above); 5 passed; 6 passed. Test gap (not a defect): nothing kills a mutant that swaps `/your-tier` and `/tiers` for the ended case beyond `voiceEntries.test.tsx`'s own assertion; the test that would is a route-table check shared with Publish.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
