---
id: VERIFY-03
title: Record your voice and hear yourself
owner: YOU
area: VERIFY
order: 272
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [VERIFY-02, VOICE-01, DV2-COMP, ME-12]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6, V9, V10]
artboards: [VF8, VF9, VF9a, VF9b, VF9c, VF10, VF10a, VF11]
---
# VERIFY-03 · Record your voice and hear yourself

## Current state

As of 21 Oct 2026, verifying (built by a Sonnet builder, T1; mobile `wmt/VERIFY-03` on `origin/wmt/VERIFY-02` `97177664`, so the two merge together). **Round 2 (21 Oct 2026, the lead's rulings):** the app shows `consent.line` exactly as the Hub serves it and sends it back (no consent text in the app), and reads the recording's shortest and longest seconds from the Hub (`sample.minSeconds`, `sample.maxSeconds`); backend `wmt/FIX-95` `699b783` serves both; the contract is regenerated from it (SHARED-CHANGES VERIFY-03 #3); G-VERIFY-03-1 and -2 are closed; `DATA-SAFETY.md` and `DATA-INVENTORY.md` now declare the voice recording (each line marked OWNER SIGN-OFF).
- **Built:** `src/features/verify/` `VoiceConsentScreen` (VF8, and the stages VF9 to VF11 on the one route `/voice-consent`), `VoiceTakeScreen` (VF9, VF9a, VF9b, VF9c), `VoiceMakingScreen` (VF10, VF10a), `VoiceHearScreen` (VF11, the shared `VoicePlayer` with "Bio" and "AI voice"), `voiceRecorder.ts` (`expo-audio`), and additions to `voiceApi.ts`, `voiceModel.ts`, `voiceParts.tsx`; route `src/app/voice-consent.tsx`; VF7's "Record my voice" now drawn (`tier-done.tsx`). `app.json`: the microphone text and `RECORD_AUDIO` on (SHARED-CHANGES VERIFY-03 #1 and #2, applied on the branch).
- **Live (a local stack: Hub from backend `bb21578`, mock WAWU ID, voice and storage stand-ins, the branch's web export, a fake microphone):** consent stored, a take under 15 s refused, a 30 s take stops itself, presign, PUT, confirm, sample and one keyed generate, the poll, VF11 with Bio and AI voice; a real provider failure (`[[fail]]` in the words) gave VF10a with the Hub's own "No points were taken" and the balance unchanged (0 before and after); the Hub's real `402` ("You don't have enough points for this.") shown under the ring with the cost line; a denied microphone (a real browser denial) shown with a way forward. Pictures: eight boards, light and dark, beside their renders (V5), in the builder's scratch folder `verify-03-b/shots/cmp-{dark,light}-<board>.png`.
- **Differs from the boards, recorded:** VF8's fourth line "Delete it any time in Settings" is left out (G-VERIFY-03-4); VF10's "64%" and "About a minute" are left out (G-VERIFY-03-3); VF9's mic-denied state, VF8's no-words and voices-off states, and the consent shows the Hub's line, which reads "Who Made This?" (R-69), where the board has "WHO MADE THIS?"; a cost line on VF9c when the try is not free are not on the boards (cases they do not draw); web shots carry no status bar or home indicator.
- **NOT RUN:** recording and generating on a real phone (V10): no provider key is on the Hub and no development build with the microphone exists (the build needs `app.json` from this branch). The web export records `webm`, so the live walk presented the file to presign as `m4a` through a test shim and added CORS headers to the storage stand-in (a phone needs neither). Capability check 2 (the profile header player, a listener on another phone) is not built: the headers M1, M5 to M7 draw no Voice Intro player yet (DV2-03 is todo; G-VERIFY-03-5); `GET /users/{wawuId}/voice-intro` is served for them.
- **Checks:** (round 2) tsc EXIT 0; verify, me, route-guard, route-graph, keyed-write and auth-guard tests 28 suites, 576 tests EXIT 0 (`voiceFlow.test.tsx` 32); `scripts/gates/run.py` EXIT 0 (10 run, 0 fail, 18 warn, 1179 files; the new warn is this task's PROVISIONAL polling marker); `check_baseline.py` EXIT 0; `check_tasks.py` EXIT 0.
- **Changed a pinned assertion, on purpose:** `tierCheckout.test.tsx` pinned "Record my voice is not drawn until VERIFY-03"; it now expects the button (its own comment said so).
- **Filed:** BACKEND_GAPS G-VERIFY-03-3 to -5 open, G-VERIFY-03-1 and -2 closed; SHARED-CHANGES VERIFY-03 #1 and #2 (applied on the branch, for the lead to confirm; `docs/release/DATA-SAFETY.md` and `DATA-INVENTORY.md` still say nothing records sound).
- **Next:** a fresh verifier; VERIFY-02 merges into main only together with this task. The owner names the shortest take and words the consent; DV2-03 draws the player on M1 and the other headers.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-66, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

After paying, a person agrees to the consent line, records 30 seconds, waits while the intro is made, and hears it in their own voice with the "Bio" label and the "AI voice" tag (R-66), then uses it, edits the text or re-records.

## Scope

- New files under `src/features/verify/`. The microphone needs `expo-audio` and a permission text: SHARED-CHANGES row VERIFY-03 #1 (one new development build; V10 on a real Android phone only).
- VF8: the consent line "I am [name]. I agree that Who Made This? may create an AI version of my voice for my intros." and who can do this (only the account owner, their own voice). Stores consent through VOICE-01.
- VF9, VF9a, VF9b, VF9c: script to read, timer to 30 s, record, stop, redo, "too short" below the minimum. Upload with `POST /uploads/presign` and `/confirm`, then VOICE-01 sample and generate.
- VF10, VF10a: progress while the intro is generated, and the failed state with "points not taken" read from the Hub. VF11: the `VoicePlayer` (DV2-COMP) with "Bio" and "AI voice"; buttons Use this, Edit text (VF4), Re-record (VF9). This task also adds the player to the profile headers (M1, M5 to M7) as drawn, once those exist.

## NOT RUN until

- A provider key is on the Hub (VOICE-01) and a development build with `expo-audio` exists: report the recording and generation checks NOT RUN with those two facts.

## Capability checks

- [ ] A person can read the consent line, record 30 seconds, redo a take, and a take under the minimum is refused with the reason.
- [ ] A person who taps Use this sees the intro on their profile, labelled "Bio" with the "AI voice" tag; a listener on another phone sees the same.
- [ ] A failed generation shows "No points were taken" and the person's points are unchanged.
- [ ] Denying the microphone permission shows a plain way forward, not a crash (V10).
- [ ] Each board above (VF8, VF9, VF9a, VF9b, VF9c, VF10, VF10a, VF11) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

- **Files:** new `VoiceConsentScreen`, `VoiceTakeScreen`, `VoiceMakingScreen`, `VoiceHearScreen`, `voiceRecorder.ts`, `src/app/voice-consent.tsx`, `__tests__/voiceFlow.test.tsx`; edited `voiceApi.ts`, `voiceModel.ts`, `voiceParts.tsx`, `src/app/_layout.tsx` (one line), `src/app/tier-done.tsx`, `app.json`, one assertion in `tierCheckout.test.tsx`, records.
- **Check 1 (read the consent, record, redo, a short take refused):** live on the stack and in `voiceFlow.test.tsx` (the Hub's own line stored; 8 s refused with the reason and nothing sent; Redo; 30 s stops itself). **Check 2 (Use this, profile, a listener):** Use this ends on Me and the intro is the Hub's `audioUrl` marked `aiVoice`; the profile player and the listener's view are not built (G-VERIFY-03-5): NOT RUN. **Check 3 (failed try):** live, a provider failure, "No points were taken" from the Hub's `run.message`, balance 0 before and after, `next.free` still true. **Check 4 (microphone denied):** a real denied browser permission and tests (ask again, then the phone's settings when it cannot ask); V10 on a phone is NOT RUN. **Check 5 (V5):** eight boards, light and dark, compared picture with picture. **Check 6 (values from the Hub or the user):** the name, the words, the wording sent, the cost and the failed words are the Hub's; the consent line and both recording lengths are the Hub's (round 2). **Check 7 (states by real cause):** loading, a failed read, voices off, no words, the Hub's 402, the Hub's consent and sample refusals, a lost connection (the same key is sent again), an upload the host refused, a failed provider, a denied microphone.
- **Shared parts:** `VoicePlayer` and `VoiceLabel` (DV2-COMP) for VF11, `Avatar`, `Button`, `StatusPill`, `Card`, `EmptyState`, `ErrorState`; `ShopFrame` for the barred screens. Local: `TakeRing`, `RecordButton`, `MakingRing` (no shared piece draws them; the ring follows the open-wallet ring).
- **Round 2:** `consent.line` printed and sent as served; `recordingTerms` (voiceModel) refuses a view without the line or the Hub's two lengths; `TakeBounds` come from `sample.minSeconds` and `sample.maxSeconds`; the old literals (`consentLineFor`, `TAKE_SECONDS`) are gone; 3 new tests in `voiceFlow.test.tsx` (the line as served, a view without terms, lengths from the Hub).
- **Not done:** see Current state ("NOT RUN").

## Verifier report

Verified 21 Oct 2026 by a fresh Sonnet verifier (built none of it; T1 check) on `origin/wmt/VERIFY-03` `798a221c`, against `origin/wmt/VERIFY-02` `97177664` (only what VERIFY-03 adds was checked) and backend `origin/wmt/FIX-95` `699b783`. **Verdict: FIX** (one medium, five lows). Status back to `building`.

Stack: backend `wmt/FIX-95` on the Nuvion stand-in (ports 7860-7867, name `verify03v`), the branch's own web export, the repo's voice and storage stand-ins (7920, 7921; a CORS pass-through on 7922 because a browser needs it and a phone does not), a Chromium with a fake microphone. People were made through the mock WAWU ID and signed in through the app's real login screen. Everything is dropped and stopped (lsof on 7860-7867 and 7920-7927 empty).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` EXIT 2 on this machine with exactly one error, `src/features/referral/cardPicture.ts` cannot find `react-native-view-shot` (REF-03's package is missing from this machine's shared `node_modules`; the file is not in this diff); with that one module stubbed from outside the repo, tsc EXIT 0. eslint on the 17 changed `.ts/.tsx` files EXIT 0. Jest (`src/features/verify`, `src/features/me`, route-guard, route-graph, auth-guard, keyed-write-sites): 28 suites, 576 tests, EXIT 0 (matches the builder). `scripts/gates/run.py` EXIT 0 (10 run, 0 fail, 17 warn, 1179 files scanned; the builder said 18 warn, I count 17 and one is this task's VOICE-POLL marker at `VoiceConsentScreen.tsx:38`). `check_baseline.py` EXIT 0 (0 entries). `check_tasks.py` EXIT 0 (390 tasks). |
| V4 Field trace | passed in the flow; listener side NOT RUN | The words written on VF4 reach the VF9 script and VF11 (and a rewrite between two tries reached the second try's VF11). Consent: stored in `VoiceProfile.consentLine`/`consentAt` exactly as served, read back as `consent.given`. Recording: presign (folder `voice/sample`), PUT to the host, confirm, sample, generate, each seen once per try (a double tap on Use this made one run). The listener's view (`GET /users/{wawuId}/voice-intro`, the profile header) is not built here (G-VERIFY-03-5): NOT RUN. |
| V5 Picture | passed, one low | All eight boards, light and dark, beside their renders: `scratchpad/verify-03-v/shots/cmp-{dark,light}-<board>.png` (design left, app right) and `pair-{dark,light}-*.png`. VF8, VF9, VF9a, VF9b, VF9c and VF11 match element for element within the recorded differences (VF8's fourth line left out G-VERIFY-03-4; "Who Made This?" R-69; the person's own name and words; no status bar on web; VF11 adds the "AI voice" tag R-66; VF10's "64%" and "About a minute" left out G-VERIFY-03-3). VF10 matches. VF10a: finding L3. |
| V6 States | passed, one NOT RUN | By real cause: loading (the Hub answer held 2.5 s), a lost connection ("Your voice did not load", Try again), no words ("Write my Voice Intro first" with its button), the Hub's real 402 ("You don't have enough points for this." under the ring with "Making your intro uses 200 points."), a failed provider (`[[fail]]` in the words: VF10a with the Hub's "That didn't work. No points were taken. Try again.", points 0 before and after, `next.free` still true), the microphone refused (a real browser denial: "We can't use your microphone", "Allow microphone"), a take under the shortest (VF9b, nothing sent), a take at the longest stopping itself (0:30, and 0:20 when the Hub's settings were changed to 10 and 20 mid-run: the title, ring, shortest take and self-stop all followed). "Voices are not available" (`available: false`) NOT RUN live (needs a Hub without voice settings; covered by `voiceFlow.test.tsx` only). |
| V9 Live seam | passed | Real login (`POST /auth/login` on the mock WAWU ID, no injected token); VF8 printed "I am Tolu Adeyemi Okafor. I agree that Who Made This? may create an AI version of my voice for my intros." (the name only the Hub holds) and the lengths 15 and 30 came from the Hub's settings. VF4's "Hear it in my voice": a person with a running tier lands on VF8, one with none on `/tiers`. VF11 from a real generate; Use this ends on Me. |
| V10 Device | NOT RUN | No provider key on the Hub and no development build with the microphone: a phone cannot record or make an intro yet. The web run could not show VF11 playing on open (a browser blocks sound before a tap; the player shows its play icon and 0:00 because the stand-in's clip has no length), so the board's playing state is unproven until a phone. |

Capability checks: (1) consent line, a take, redo, a short take refused with the reason: passed live. (2) Use this then the profile and a listener on another phone: Use this ends on Me (live); the profile player and the listener's view are not built, NOT RUN. (3) A failed generation says "No points were taken" and the points are unchanged: passed live. (4) Microphone denied shows a plain way forward: passed on the web; on a phone NOT RUN (V10). (5) Eight boards: passed with L3. (6) Values from the Hub or the user: passed (the consent line, both lengths, cost, failed words and the AI-voice mark are the Hub's; no literal length or consent text in the screens). (7) States by real cause: passed (above).

Other checks: provider never named and no em-dashes in the voice screens or in `voiceModel.ts` (grep); no shared component copied (`VoicePlayer`, `VoiceLabel`, `Avatar`, `Button`, `Card`, `StatusPill`, `EmptyState`, `ErrorState`, `ShopFrame` are used); `tierCheckout.test.tsx` flips the one assertion that waited for VERIFY-03 and swaps the Done press for "Done is not drawn", which is what `OfficialScreen` now does; the contract files equal the backend's `contract/openapi.json` at `699b783` byte for byte (additive: two required numbers on `sample`); `DATA-SAFETY.md` (PF-03, HK-08, the `expo-audio` row) and `DATA-INVENTORY.md` I-401 match the backend (`setSample` removes the earlier file, the purge covers `voice/sample` and `ai/voiceover`, `speakInOwnVoice` deletes the one-run voice and logs a failed delete without its id, listeners get only the audio, no route to delete an intro or withdraw consent, the lengths are the Hub's two PROVISIONAL settings); file list equals `git diff --stat` (nothing missing or extra). Surviving mutants: not run (not asked); the test gap for M1 is below.

## Findings

- **M1 (medium, defect): Redo while recording leaves the microphone recording.** `src/features/verify/VoiceTakeScreen.tsx:85` (`redo`, wired at lines 163 and 174) only resets the screen; `voiceRecorder.ts` has no way to cancel, so the recorder is never stopped. Repro: VF9, tap the record button, tap Redo. The screen reads "Find a quiet room." and 0:00, but the browser's MediaRecorder stays `recording` with a live microphone track (`{rec: ['recording'], tracks: ['ended','live']}` read after Redo); tapping record again then starts a second recorder with the first still running. On a phone the microphone stays open (the system's recording dot) until the screen closes, while the person was told it was ready. Test gap: `voiceFlow.test.tsx` has no case that presses Redo while recording and expects `mockRecorder.stop` to be called. Fix: Redo while `phase === 'recording'` stops and discards the take.
- **L1 (low, defect):** `app.json:149` the microphone text says "the 30 seconds", but the length is the Hub's setting (PROVISIONAL, the lead's ruling). Change the setting and the system prompt is wrong. Words without a number fix it.
- **L2 (low, differs, for the lead):** `app.json` also sets `recordAudioAndroid` true (line 150) and takes `RECORD_AUDIO` off `blockedPermissions` (line 27), beyond "only the microphone text". Android cannot record without both, and the builder extended SHARED-CHANGES VERIFY-03 #1 to say so (and DATA-SAFETY lists it); the lead confirms the extension.
- **L3 (low, defect, V5):** VF10a (`VoiceMakingScreen.tsx`, `styles.result` and `resultTitle`): the result block sits about 65 px higher than the board's and the title is smaller and breaks "We couldn't make your / intro" where the board breaks "We couldn't make / your intro" (`cmp-dark-VF10a.png`, `cmp-light-VF10a.png`). The Hub's own line under it ("That didn't work. No points were taken. Try again.") is the ruling, not a difference.
- **L4 (low, unclear, needs the lead):** `OfficialScreen.tsx:100` draws only "Record my voice" on VF7 (the board draws only that) and no Done, and VF8's Back returns to VF7. A person who has just paid and does not want to record can leave only with the phone's own back. Say whether the board's single button is final.
- **L5 (low, tidy):** `TakeRing` and `MakingRing` (`voiceParts.tsx`) rebuild the track and arc of `ShopRing` (`parts.tsx:74`) instead of giving it props. Neither is a shared component (`src/components`), so not a fork finding; a later tidy.


## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
