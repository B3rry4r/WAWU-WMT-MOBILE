---
id: INBOX-13
title: Out of credits, buy credits, credits added
owner: YOU
area: INBOX
order: 107
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, INBOX-05, INBOX-16, UI-02]
decisions: [R-5, R-6, R-10, R-37, R-62, R-53, R-69]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I27, I28, I29]
---
# INBOX-13 · Out of credits, buy credits, credits added

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Verified by an independent verifier (F1 medium closed in round 2 (re-checked on the stack)); stacked in batch 10 by MERGE-10 inside FIX-55 (S2 `6957df6b`). Built by a Sonnet builder in the S2 bundle (with INBOX-19 and INBOX-20): mobile `wmt/S2` from `origin/wmt/MERGE-8` `cc436a53`, `origin/wmt/INBOX-15` merged in. No backend change, no migration.
- **Built:** I27 (a member with no credits in a room where a message costs one: "You're out of credits", Buy credits), I28 (the Hub's packs, the Bank charge and the Total from its quote, Pay from wallet, "Buy 120 credits · total", the shared PIN sheet), I29 (what was paid and the new count); I24's strip has its Buy button. The shared pay sheet draws still confirming and refusals; a short wallet stays on the packs sheet (round 2). A person with no wallet is led to Open your wallet.
- **Decisions the builder took:** the sheet's title is "Buy WAWU Credits" (R-37 keeps the instrument's name; the 16 Oct canvas prints "Who Made This? Credits"); I27 and I28 do not say "Text and emoji are free" or print costs by kind until INBOX-22 serves them (G-881, R-47, WORKFLOW rule 7); I29's button reads "Back to chat" in a room and "Done" from I24.
- **Attacks in tests:** a double tap on Buy (one quote, one PIN sheet, one purchase), a wrong PIN, a short wallet before and after the PIN, a lost answer then the same request again (same key and quote, also after the sheet was closed and opened), a price that moved, a purchase the Hub has not finished (read, never bought again), a refused purchase, no wallet.
- **Attacks on the stack, once each:** wrong PIN 403 and nothing moved; the same key twice at once 201 and 409, +120 credits once, one debit; the same key again after the answer 201, no second debit; another person's quote refused 409 `quote_changed`.
- **Stack (backend `wmt/INBOX-15` `c803256` on the Nuvion stand-in, name `s2_test`, ports 7760 to 7767, taken down after):** the web export of `wmt/S2` ran against the real Hub with two funded wallets; pictures in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-b/pics/` (`beside-<board>-<light|dark>.png`, board left, built right); the attacks below were run once each, results in `.../s2-b/logs/live-attacks.txt`.
- **Open:** G-881; SHARED-CHANGES INBOX-13 #1 (applied here), #2 and INBOX-19 #1 (open). This task flipped two assertions that pinned its own absence (`RoomScreen.test.tsx` "offers no way to it", `CommunitiesView.test.tsx` no Buy).
- **Round 2 (17 Oct, builder, F1 medium):** a short wallet no longer hides the packs. The sheet stays on I28 with every pack drawn; "Not enough in your Naira wallet" (This costs X. You have Y.) and "Add X" speak for the chosen pack only, and picking another pack brings Buy back. The sheet opens on the largest pack the wallet covers when the popular one is out of reach (the bank charge from the popular quote, once per opening; none covered: popular stays, with the note). `useBuyCredits` decides it while rendering; `reset` clears the choice. Tests: wallet ₦600 shows the three packs, opens on the 50 pack and buys it once; Not enough on the 300 pack only; no pack covered. Picture: `.../s2-r2-b/pics/I28-short-{light,dark}.png` (opens on 50) and `I28-short-note-{light,dark}.png` (300 chosen, 390 px). The empty tile before the title on the pay sheet's states is the shared `PaySheet` header: SHARED-CHANGES INBOX-13 #3 (open).
- **Next:** the batch 10 pull request. Passes the task needs: V1, V4, V5, V6, V7, V8, V9. NOT RUN: V10 (no phone); a payment against a real provider (never run).

Status set to review by the records sync, 25 Oct 2026: merged as app a4048733, verifier PASS in the lead's merge log, 17 Oct.

## Design v2 update (16 Oct 2026)

- I27 now only blocks a photo, a video or a voice note: text and emoji are free, so a person out of credits can still talk. The copy reads "Reading and text stay free" style lines the board draws; read the exact words from the 16 Oct board.
- I28 credits copy: text free, a photo 1 credit, a video or voice note 3, read from `GET /communities/message-cost` (INBOX-22 adds the per-kind costs). Until INBOX-22 serves them, print no per-kind figure (R-47). Packs, "Credits don't expire and can't be cashed out", and the breakdown line stay. The breakdown's provider part is labelled "Bank charge" (R-53).
- INBOX-23 reworks the composer and I38; this task does not touch them. Brand copy: "Who Made This?" (R-69).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I27 I28 I29` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I28, I29 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I27 · Out of credits**: Room with 0 credits: "You're out of credits. Reading stays free. Buy credits to send messages here." with Buy credits.
- **I28 · Buy credits**: Buy WAWU Credits sheet: packs 50/₦500, 120/₦1,000 (Popular), 300/₦2,000 (Best value), "Credits don't expire and can't be cashed out", the breakdown (₦1,000 + Fintava's ₦23.25), Pay from wallet, "Buy 120 credits · ₦1,023.25" then PIN (BRIEF I28).
- **I29 · Credits added**: "120 credits added. Paid ₦1,023.25 from your Naira wallet (BRIEF I29). You have 120 credits." Back to chat.

## Brief changes (build these, not the canvas)

- **I28**: add the breakdown: Fintava's charge ₦23.25, Total ₦1,023.25; button "Buy 120 credits · ₦1,023.25". Credits stay a count. (Why: R-10 and the purchases default.)
- **I29**: "Paid ₦1,023.25 from your Naira wallet." (Why: rule 5.)

## Capability checks

- [ ] **I27**: a user can Buy credits.
- [ ] **I28**: a user can pick a pack; see ₦1,000 + ₦23.25 = ₦1,023.25; tap "Buy 120 credits · ₦1,023.25"; enter their PIN.
- [ ] **I29**: a user sees "Paid ₦1,023.25" and their credits as a count, and can go Back to chat (I25).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I27.
- [ ] From I24 (INBOX-05), a user can tap Buy and reach I28 (this task adds it, as drawn).
- [ ] A user with no wallet who taps Buy lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **I27**: served.
- **I28**: partial. Missing: Packs match the server table. Payment is a Flutterwave charge, not a wallet debit with PIN; CreditPurchase.flutterwaveTxRef is the lookup key.
- **I29**: partial. Missing: Crediting is served; "paid from your Naira wallet" is not (Flutterwave). Note: the board shows 48 + 120 = 120, which reads as the balance replaced rather than added; the server adds.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I27: 0 credits
- I27: Reading stays free
- I28: 50 credits ₦500
- I28: 120 credits ₦1,000
- I28: 300 credits ₦2,000
- I28: Credits don't expire and can't be cashed out
- I28: Naira wallet · ₦485,250.75
- I29: 120 credits added
- I29: Paid ₦1,000
- I29: You have 120 credits

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-13.md](history/INBOX-13.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
