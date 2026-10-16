---
id: VERIFY-03
title: Record your voice and hear yourself
owner: YOU
area: VERIFY
order: 272
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [VERIFY-02, VOICE-01, DV2-COMP, ME-12]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6, V9, V10]
artboards: [VF8, VF9, VF9a, VF9b, VF9c, VF10, VF10a, VF11]
---
# VERIFY-03 · Record your voice and hear yourself

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** L. **Wave:** 5 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): VERIFY-02, VOICE-01, DV2-COMP, ME-12.
- **History:** none yet. Reports go to tasks/history/VERIFY-03.md.

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
