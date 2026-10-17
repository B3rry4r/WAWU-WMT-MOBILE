---
id: FIX-62
title: Wiring what batch 14 brought together (Add money from PT3b, Your tier row, M29 every kind, Saved opens a piece, unlock Done test)
owner: YOU
area: FIX
order: -62
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T1
depends_on: []
decisions: [R-47, R-43]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-62 · Wiring what batch 14 brought together

## Current state

As of 17 Oct 2026, builder round 1.
- **Status:** verifying. Built by a Sonnet builder (tier T1). Mobile `wmt/FIX-62` from `origin/wmt/MERGE-14` `d76612f6`. No backend, contract, migration or Fintava change; no new route.
- **1 POINTS-07 (PT3b):** "Not now" is now "Add money" (the board draws only that button). It closes the sheet and opens W15 with the wallet's shortfall (`addMoneyHref`, as the pay sheets do); when the screen is shown again `useJobCheck` asks the Hub for the quote again, so the person gets PT3 (pay), PT3b once more, or the job runs. `onAddMoney` is now required on `useJobCheck` (POINTS-08 passes it from `addMoneyHref`); the dev harness `/preview/studio-job` passes it. Closes G-POINTS-07-2.
- **2 ME-03 (M7):** a "Your tier" row opens `/your-tier`, after Notifications and before Verification, its line the Hub's tier name (`GET /me/tier`, the key the Me page reads); no line for no tier or a nameless one. The Verification row STAYS: M15 to M17 (the wallet's state, Open your wallet) has no other way in. Owner to rule if Verification should go.
- **3 ME-14 (M29, M30):** M29 reads `GET /me/purchases/all` (FIX-59): pieces, tickets, credit packs, school fees, passes, each marked Refunded when the Hub paid it back; the line says what it is, the day and what left the wallet. A row opens what it bought: piece `/content/<id>`, ticket `/events/orders/<orderId>`, school fee My courses, pass `/community/<id>`; a pack and a refunded purchase open nothing. A paid video, PDF or course has the board's Watch, Read, Resume, opening the piece. Download is NOT drawn (no download screen), nor a button on audio, photos or a template (the board has no word for them). M30: a saved piece opens `/content/<id>`; a saved creator still opens nothing (ME-02).
- **4 HOME-07:** `unlockFlow.test.tsx` opens the unlock sheet from a course card and from a template card and checks it ends on Done (not Watch now), closes, and opens nothing.
- **5 ME-02:** "a saved creator opens their profile" waits for ME-02's merge. Not done.
- **Tests changed (ruling-driven, SHARED-CHANGES FIX-62 #1 to #4):** `studioFlow.test.tsx` (the PT3b case), `meMenuRoute.rows.test.tsx` (nine rows, seven for a fan), `purchases.test.tsx` and `model.test.ts` (the new read), `saved.test.tsx` (a piece opens). New: `purchasesRoute.test.tsx` (each kind opens its screen on the real router).
- **Open:** M7's "My purchases N" still counts unlocks only (G-FIX-59-2).
- **NOT RUN:** a phone (V10); mobile CI (fails in seconds while GitHub billing is off).

## Goal

Each entry or read that a screen now has a target for is drawn and works; nothing is drawn that nothing serves (R-47).

## Capability checks

- [x] A person short of money for the missing points taps Add money on PT3b, reaches W15 with the shortfall, and on coming back sees the sheet the Hub's new quote earns.
- [x] The Me menu's Your tier row opens Your tier and says the Hub's tier name; a person with no tier sees the title alone.
- [x] M29 lists tickets, credit packs, school fees and passes beside pieces; each opens what it bought where that screen exists; a paid-back one is marked Refunded and opens nothing.
- [x] A saved piece opens its own page; Watch, Read and Resume open the piece.
- [x] A course and a template unlocked from the feed end on Done.
- [ ] A saved creator opens their profile (waits for ME-02).

## Owner sign-off

Not needed.
