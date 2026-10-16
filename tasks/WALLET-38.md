---
id: WALLET-38
title: Your pass
owner: YOU
area: WALLET
order: 285
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [TIER-03, TIER-06, WALLET-01]
decisions: [R-43, R-65]
passes: [V1, V4, V5, V6, V9]
artboards: [W44]
---
# WALLET-38 · Your pass

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** S. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): TIER-06.
- **History:** none yet. Reports go to tasks/history/WALLET-38.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person with a tier sees their event pass: its type, the event (date to be announced) and what it gets them (W44).

## Scope

- New file under `src/features/wallet/`. `GET /me/tier` `eventPass` (`id`, `name`) plus the benefit lines and event date TIER-06 adds (G-804). The date reads "Date to be announced" until the Hub serves one; the "Example values." footnote on the board is a designer note and is not printed.
- This task adds the entry as drawn: the Passes card on Wallet (W1; DV2-02 draws the card).

## Capability checks

- [ ] A person with a pass taps Passes on Wallet and sees W44 with the Hub's pass name, tier and benefits.
- [ ] A person without a tier sees no Passes card.
- [ ] Each board above (W44) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
