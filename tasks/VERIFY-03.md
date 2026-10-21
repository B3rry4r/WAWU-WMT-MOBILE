---
id: VERIFY-03
title: Record your voice and hear yourself
owner: YOU
area: VERIFY
order: 272
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [VERIFY-02, VOICE-01, DV2-COMP, ME-12]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6, V9, V10]
artboards: [VF8, VF9, VF9a, VF9b, VF9c, VF10, VF10a, VF11]
---
# VERIFY-03 · Record your voice and hear yourself

## Current state

As of 21 Oct 2026, verifying (built by a Sonnet builder, T1; mobile `wmt/VERIFY-03` on `origin/wmt/VERIFY-02` `97177664`, so the two merge together; app only, no backend or contract change).
- **Built:** `src/features/verify/` `VoiceConsentScreen` (VF8, and the stages VF9 to VF11 on the one route `/voice-consent`), `VoiceTakeScreen` (VF9, VF9a, VF9b, VF9c), `VoiceMakingScreen` (VF10, VF10a), `VoiceHearScreen` (VF11, the shared `VoicePlayer` with "Bio" and "AI voice"), `voiceRecorder.ts` (`expo-audio`), and additions to `voiceApi.ts`, `voiceModel.ts`, `voiceParts.tsx`; route `src/app/voice-consent.tsx`; VF7's "Record my voice" now drawn (`tier-done.tsx`). `app.json`: the microphone text and `RECORD_AUDIO` on (SHARED-CHANGES VERIFY-03 #1 and #2, applied on the branch).
- **Live (a local stack: Hub from backend `bb21578`, mock WAWU ID, voice and storage stand-ins, the branch's web export, a fake microphone):** consent stored, a take under 15 s refused, a 30 s take stops itself, presign, PUT, confirm, sample and one keyed generate, the poll, VF11 with Bio and AI voice; a real provider failure (`[[fail]]` in the words) gave VF10a with the Hub's own "No points were taken" and the balance unchanged (0 before and after); the Hub's real `402` ("You don't have enough points for this.") shown under the ring with the cost line; a denied microphone (a real browser denial) shown with a way forward. Pictures: eight boards, light and dark, beside their renders (V5), in the builder's scratch folder `verify-03-b/shots/cmp-{dark,light}-<board>.png`.
- **Differs from the boards, recorded:** the consent line is the board's with the person's name, and the Hub files its own wording (G-VERIFY-03-2); VF8's fourth line "Delete it any time in Settings" is left out (G-VERIFY-03-4); VF10's "64%" and "About a minute" are left out (G-VERIFY-03-3); the recording lengths are the app's own and PROVISIONAL, 30 longest and 15 shortest (G-VERIFY-03-1); the name reads "Who Made This?" (R-69), the board's "WHO MADE THIS?"; VF9's mic-denied state, VF8's no-words and voices-off states, and a cost line on VF9c when the try is not free are not on the boards (cases they do not draw); web shots carry no status bar or home indicator.
- **NOT RUN:** recording and generating on a real phone (V10): no provider key is on the Hub and no development build with the microphone exists (the build needs `app.json` from this branch). The web export records `webm`, so the live walk presented the file to presign as `m4a` through a test shim and added CORS headers to the storage stand-in (a phone needs neither). Capability check 2 (the profile header player, a listener on another phone) is not built: the headers M1, M5 to M7 draw no Voice Intro player yet (DV2-03 is todo; G-VERIFY-03-5); `GET /users/{wawuId}/voice-intro` is served for them.
- **Checks:** tsc EXIT 0; eslint on the changed files EXIT 0; verify, me, route-guard, route-graph, keyed-write and auth-guard tests 28 suites, 573 tests (one run 571 of 572 with a loading assertion that raced the Hub's answer, made deterministic; `voiceFlow.test.tsx` then 29 of 29 EXIT 0, the other 27 suites EXIT 0 in the same run; new: `voiceFlow.test.tsx` 29); `scripts/gates/run.py` EXIT 0 (10 run, 0 fail, 18 warn, 1179 files; the two new warns are this task's PROVISIONAL markers); `check_baseline.py` EXIT 0; `check_tasks.py` EXIT 0.
- **Changed a pinned assertion, on purpose:** `tierCheckout.test.tsx` pinned "Record my voice is not drawn until VERIFY-03"; it now expects the button (its own comment said so).
- **Filed:** BACKEND_GAPS G-VERIFY-03-1 to G-VERIFY-03-5; SHARED-CHANGES VERIFY-03 #1 and #2 (applied on the branch, for the lead to confirm; `docs/release/DATA-SAFETY.md` and `DATA-INVENTORY.md` still say nothing records sound).
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
- **Check 1 (read the consent, record, redo, a short take refused):** live on the stack and in `voiceFlow.test.tsx` (the Hub's own line stored; 8 s refused with the reason and nothing sent; Redo; 30 s stops itself). **Check 2 (Use this, profile, a listener):** Use this ends on Me and the intro is the Hub's `audioUrl` marked `aiVoice`; the profile player and the listener's view are not built (G-VERIFY-03-5): NOT RUN. **Check 3 (failed try):** live, a provider failure, "No points were taken" from the Hub's `run.message`, balance 0 before and after, `next.free` still true. **Check 4 (microphone denied):** a real denied browser permission and tests (ask again, then the phone's settings when it cannot ask); V10 on a phone is NOT RUN. **Check 5 (V5):** eight boards, light and dark, compared picture with picture. **Check 6 (values from the Hub or the user):** the name, the words, the wording sent, the cost and the failed words are the Hub's; the recording lengths are not served and are PROVISIONAL (G-VERIFY-03-1). **Check 7 (states by real cause):** loading, a failed read, voices off, no words, the Hub's 402, the Hub's consent and sample refusals, a lost connection (the same key is sent again), an upload the host refused, a failed provider, a denied microphone.
- **Shared parts:** `VoicePlayer` and `VoiceLabel` (DV2-COMP) for VF11, `Avatar`, `Button`, `StatusPill`, `Card`, `EmptyState`, `ErrorState`; `ShopFrame` for the barred screens. Local: `TakeRing`, `RecordButton`, `MakingRing` (no shared piece draws them; the ring follows the open-wallet ring).
- **Not done:** see Current state ("NOT RUN").

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
