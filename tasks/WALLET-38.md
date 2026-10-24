---
id: WALLET-38
title: Your pass
owner: YOU
area: WALLET
order: 285
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [TIER-03, TIER-06, WALLET-01]
decisions: [R-43, R-65]
passes: [V1, V4, V5, V6, V9]
artboards: [W44]
---
# WALLET-38 · Your pass

## Current state

As of 17 Oct 2026, built by a Sonnet builder and checked by an independent Sonnet verifier.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-38.md`): verdict merge, nothing medium or worse. Stacked on batch 7 (backend and mobile `wmt/MERGE-7`).
- **Branch:** mobile `wmt/WALLET-38` on `origin/wmt/MERGE-6` `70a7895`. No backend change, no wawu-id change. Migration: none.
- **Built:** W44 `/pass` (`src/app/pass.tsx`, `src/features/wallet/pass/`) and the Passes card on Wallet (W1), drawn only when `GET /me/tier` has an `eventPass`. The Hub's own words only: the pass name, the tier's name, the day (or "Date to be announced") and the Hub's benefit lines. Nothing is drawn for a line the Hub does not send.
- **Not drawn (R-47), in `BACKEND_GAPS.md` as G-814:** the event's name ("Christmas event" above the pass name and under it on the Passes card) and the QR code. The board's "Example values." footnote is a designer note and is not printed.
- **Decisions:** the Passes card is full width because the Points card (DV2-02) is not built; it sits in a row (`wallet-info-row`) so Points joins it at half width each, as drawn. On the Passes card the date line stands where the board has the event name. Pass card ground is `tgifVerseGround` (same #2A0C3E as the board; no pass token exists). A failed read on W1 draws no card and no error (the tab is the bank's, not the pass's); W44 has the loading, empty and error states.
- **Checks:** see tasks/history/WALLET-38.md (tests, the full mobile check, pictures at 390 px light and dark beside W44 and W1).
- **Open findings:** none medium or worse; the verifier's lows are in `tasks/SWEEP-MONEY.md` (WALLET-38 L1 and L3).
- **Next:** the lead merges it with batch 7.
- **History:** tasks/history/WALLET-38.md.

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

## History

Builder report and later rounds, word for word, oldest first: [history/WALLET-38.md](history/WALLET-38.md).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
