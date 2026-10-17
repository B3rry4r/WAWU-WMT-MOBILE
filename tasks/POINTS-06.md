---
id: POINTS-06
title: Buy points
owner: YOU
area: POINTS
order: 276
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [POINTS-02, TIER-05, POINTS-05, DV2-COMP]
decisions: [R-43, R-65, R-10, R-16]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT4, PT4b, PT4c]
---
# POINTS-06 · Buy points

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder; mobile `wmt/WA` from `origin/wmt/MERGE-8` `cc436a53`; POINTS-02 and TIER-05 are served on MERGE-8, so no backend change, no migration). Status: verifying.
- **Built (`src/features/points/`, route `src/app/points-buy.tsx`):** PT4 (`BuyScreen`): the packs from `GET /plans` (the middle one chosen, as the board), each pack's bonus chip ("Founding +10%": the running tier's first word and the Hub's `packBonusPercent`; none for anyone else), "For AI tools. Points don't expire for 12 months." with the months from the quote's `expiryDays`, Pay with the wallet (balance from the quote) or Bank transfer, and Pay as the total with the Bank charge, the parts beneath ("₦2,500 + ₦23.25 Bank charge"). PT4b: "Paying..." while the bank has not confirmed, read by id every 4 seconds. PT4c: "2,750 points added" and the balance from `GET /me/points`.
- **Once (V8):** Pay asks for a fresh quote; figures that moved are shown and nothing is sent; the PIN sends one request on one key, kept on the phone (`buyIntent.ts`): a wrong PIN, a lost answer, a second tap and a closed app send the same request. A wallet short of the total turns Pay off and says so; the transfer way is still there.
- **By transfer:** the PIN confirms it, the wallet's own account, bank, name and the amount to send are shown, the button reads "Waiting for your transfer", and PT4c shows when the Hub reads the purchase as paid.
- **Entries as drawn:** Buy points on Wallet's action row, the pill beside the balance on Your points (accented on PT5a), Buy on Convert. PT5a's "Buy a pack, or" clause is back. PT1a and PT3 (Studio, not enough points) are POINTS-07's.
- **Tests changed:** three assertions in `pointsFlow.test.tsx` (Buy is drawn now; SHARED-CHANGES POINTS-06 #1). New `buyFlow.test.tsx` (12 cases).
- **Gaps:** G-881 (Back to AI tools), G-882 (no board for the transfer state). **Next:** the verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65, R-10, R-16 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person buys a points pack in Naira from the wallet or by bank transfer, and sees the points added (PT4, PT4b, PT4c).

## Scope

- New files under `src/features/points/`. PT4: packs from `GET /plans` (`packs`, `packBonusPercent` for Founding "+10%", `checkoutBump` is VF6 only), `GET /plans/purchases/quote`, `POST /plans/purchases` kind `points_pack` (POINTS-02), method wallet or transfer (TIER-05). PT4b paying (poll `GET /plans/purchases/{id}`), PT4c points added. PT4a (dollars) is not built at launch (R-16, R-65).
- Entries as drawn: "Buy points" on Wallet (W1), PT1a (no points) and PT3 (not enough points).

## Capability checks

- [ ] A person picks a pack, sees the Hub's price and points, pays with the PIN, and sees the added points once.
- [ ] A Founding Maker sees the bonus the Hub returns; others do not.
- [ ] By transfer the pack completes when the money lands.
- [ ] Each board above (PT4, PT4b, PT4c) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-06.md](history/POINTS-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
