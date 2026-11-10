---
id: WEBAPP-09
title: The second web walk's fixes (Phase 1, last batch)
owner: YOU
area: WEB
order: 373
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: review
depends_on: [WEBAPP-08]
decisions: [R-127, R-128, R-47, R-86, R-94]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-09 · The second web walk's fixes (Phase 1, last batch)

## Current state

As of 10 Nov 2026.
- **Status:** verifying. Built on `wmt/WEBAPP-09` from `wmt/BATCH-WEBAPP1` f6d0e4a. W1 to W7 all done or ruled (below); `npm run check` EXIT 0 (521 suites, gates 0 fail). Each row walked on the web export behind vercel.json's headers on stack fix09 (ports 16020 to 16031); pictures in /tmp/wmt-shots/webapp-09/ (390 and 1440, light and dark, boards in boards/).
- **Next:** a T1 verifier walks every touched path on the web export (/r/<code>, /join, /bills, an unknown address mid-sign-up; /tiers cold and in-app for a dollar person and a highest-tier person; points pack in one tab and in two; an upgrade's checkout row; a paid-question reply with Enter; an open room before Join); then the batch check and the PR to main.
- **Fenced file touched:** `src/app/_layout.tsx` (a start-step provider around the Stack, and a web-only transparent-modal option on `tiers`), row WEBAPP-09 #1 in SHARED-CHANGES.md.
- **Phone-visible changes:** the open-room not-member line now reads "Join to read and write here. Joining is free, and so is reading." (W7, shared screen). Nothing else: W2's Close on the highest tier, the transparent tiers sheet, W3, W4, W5 are web only; W1 reads the sign-up step the phone's guards already hold and a phone cannot reach the unknown-address case with a step open that it did not already handle.
- **Carried elsewhere, not here:** the card fee missing from the wallet history (Hub, `CARD-FEE-HISTORY`); "You can edit it while it waits" with no edit (CREATOR-TAKEDOWN); the verification page's "Up to 25 uploads" against the tiers' 4, 8 and 15 (an owner question).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127, R-128, R-47, R-86, R-94
- `tasks/history/WEBAPP-07.md` ("Walk 2": the three reports with steps and pictures) and `tasks/WEBAPP-08.md`
- `docs/release/WALK-WEB.md` (how to run the export behind the real site's headers)

## Goal

The last dead ends and wrong numbers the second walk found on the web are gone, so Phase 1 goes live with no screen that strands a person.

## Scope

The proof for anything web-only is the web export in a browser, as in WEBAPP-08, not jest.

| # | Finding (walker) | Fix |
|---|---|---|
| W1 | MEDIUM (A; B low). A signed-in person who has not finished onboarding gets a blank white page that never leaves on `/r/<code>`, `/join`, `/bills*` and any unknown path. A finished account lands on Home; a guest on /welcome. | Find the one cause (the onboarding or tier-offer guard on the web) and lead such a person on: to their onboarding step, keeping a referral code as a finished account does. A test for each route kind. |
| W2 | MEDIUM (A; B, C low). `/tiers` opened cold (refresh or a deep link): Close does nothing for a dollar-billed person; at the highest tier `/tiers` is a sheet over a blank page with no close. | A Close that always leads somewhere sensible and a page behind the sheet, in every state, opened cold or from inside the app. |
| W3 | MEDIUM (B). The points pack success sheet says "2,750 points added" while the Hub granted 2,750 plus a 275 bonus (3,025 in "Your points"). | The sheet says what the Hub granted, from its answer (points plus bonus). Phone too if it shares the sheet (list it as a phone-visible change). |
| W4 | MEDIUM (B, carried from walk 1). Two tabs paying for one pack: one charge, but the losing tab says "A payment for this is still being confirmed" and stays on that sheet after it was paid. | The losing tab learns the result (checks again) and shows the paid state; never a second charge. |
| W5 | LOW (C). An upgrade's checkout row shows ₦9,999 while the pay sheet charges ₦7,000. | The row shows what will be charged, from the quote, as the buttons already do. |
| W6 | LOW (C). Enter does not send in the paid-question reply box. | As the room and chat boxes on the web: Enter sends, Shift+Enter makes a new line. |
| W7 | LOW (B). An open community room's messages answer 403 before Join although the page says reading is free. | Read the Hub's rule; the page says what is true (or reads what the Hub allows). |

## Capability checks

- [ ] A person part way through onboarding who opens an invite link, a bills link or a wrong address is led on, never left on a blank page.
- [ ] A dollar-billed person and a person on the highest tier can always close /tiers, opened cold or from the app.
- [ ] A buyer of a points pack sees the points they really got; a buyer who paid in two tabs sees it paid in both.
- [ ] Every screen this batch touches has pictures at 390 light and dark beside its board, and at 1440.

## Verifier report

### T1 verifier report (10 Nov 2026), branch wmt/WEBAPP-09 head e4d53cc, Hub main 7dd5b22, stack ver09 (ports 16040-16059)

**Verdict: MERGE.** No blocker, high or medium. 3 lows. `npm run check` EXIT 0 (521 suites, 7761 passed, 5 skipped; gates 0 fail, 17 warn, 1690 files scanned).

| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | /tmp/wmt-09v/check.log |
| V5 | passed | 48 built captures (390 and 1440, light and dark) + 4 W4 two-tab sets, beside boards VF5a, VF5b, VF6, PT4c, I10, I24; contact sheets in /tmp/wmt-shots/webapp-09v/sheets (all looked at) |
| V6, V7 | passed | rows below |
| V9 | passed | real wawu-id sign-in, mailed codes typed, values only the Hub could give (3,025 points, 409 paymentId) |
| V4 | passed | money results below |

**Rows (web export in Chromium, behind vercel.json's headers with the two hosts swapped, own TMPDIR export, one React, stack hosts baked)**
- W1 PASS. Mid-sign-up people (tier offer, interests, people-to-follow, creator-setup, verify-bonus, claim-offer consumed to the next step) opened /r/STEP, /join, /bills, /bills/airtime, /zzz-nothing, /r/!!bad: every one lands on the person's own step, 0 blank pages (41 route opens, bodies 123 to 433 chars). /r/STEP still claims: PersonReferral rows written for the mid-sign-up people. Finished account (same session): every route goes Home. Guest: every route goes /welcome. Diff read of `_layout.tsx` (SHARED-CHANGES WEBAPP-09 #1): one import, one context provider around the Stack, `TIERS_SHEET` is undefined off the web so the phone keeps its own; /r, bills guard, LeaveDevRoute give the same address as before for a finished account; /tiers cold logic is `Platform.OS==='web'` only. Full jest (521 suites) green incl. midSignupLinks, tiersCold. Android jest preset cannot run here (known).
- W2 PASS. Dollar person (mid-sign-up and finished) and highest-tier person: /tiers cold, reload, new tab: Close always leaves (dollar: to the offer, then Home; highest: Home), a page (Home or the pending step) shows behind the sheet at 390 and 1440, light and dark.
- W3 PASS. Founding Maker, 2,750 pack: "3,025 points added", balance 600 to 3,625 (Hub PointLedger).
- W4 PASS. Same pack, two tabs, both POSTs released together (run 4 times, tab 2 lost the race 3 times and tab 1 once): one charge each time, both tabs "1,100 points added", same balance. Different packs in two tabs: both bought (two real purchases, each tab shows its own: 1,100 and 6,600). A second tab whose 409 names another purchase (injected 409 with the id of an earlier pack-s purchase while buying pack l): "Still confirming", not paid, no charge.
- W5 PASS. Upgrade row, button and pay sheet all N7,000; one upgrade charged 700,000 kobo.
- W6 PASS. Shift+Enter gave "line1\nline2", Enter sent one two-line reply (creator, paid question); diff is `Platform.OS==='web'` gated.
- W7 PASS. Before Join the page says "Join to read and write here. Joining is free, and so is reading."; Hub: GET messages for a non-member is 403 "Join this community to read or post in it." (community-message.service assertMember); joining an open room is free; reading costs nothing.

**Money (Hub ledger = Nuvion stand-in), user a09, N300,000 start**: tier Verify -299,900; upgrade to Founding -700,000; points pack m -250,000 (+3,025); pack s -100,000 (two tabs, one charge) then 3 more single-charge two-tab runs and 4 button purchases for the pictures, -100,000 each; different packs -100,000 and -500,000; credits (double-tapped Buy) -100,000, 1 POST, 120 credits; community pass (double-tapped) -100,000, 1 POST, 1 pass row; paid question -50,000 held. Hub out total 2,899,900, stand-in balance 27,100,100 = 30,000,000 - 2,899,900. Second user b09: tier -299,900, ledger = stand-in.

**Findings (all low, none block)**
1. LOW test-gap: W4's "different purchase named by the 409" case cannot happen on this Hub (it lets different packs run side by side), so I proved it with an injected 409; the builder's unit test covers the same. 
2. LOW unclear: W5's checkout row shows nothing until the quote has come, and nothing at all if the quote fails (the quote's 409 after an upgrade shows as a red console line, already known); not walked with the quote failing.
3. LOW: closing /tiers cold for a person who has not finished the offer shows the tier offer again (their pending step) before Home; intended by the builder, a second Close is needed.

**Pictures**: 48 built captures (led-on /r and /join, dollar sheet cold, highest sheet cold, checkout upgrade row and pay sheet, room before Join, paid-reply composer, points-added sheet, points pick; each at 390 L, 390 D, 1440 L, 1440 D) plus 12 W4 two-tab captures (tab 1 and 2 at 390 L/D, 1440 L/D), 183 files in all in /tmp/wmt-shots/webapp-09v. All 390 and 1440 sheets looked at one by one. Differences from boards are the web wallet's pay sheet (R-128, no Pay-with list, "Done" for "Back to AI tools"), and the room/led-on screens have no board of their own (I24/I10 shown for the room and thread; the interests step has none).

**NOT RUN**: needsEmail and needsIdentity steps (not reachable through the UI); base-branch before/after of the blank page (taken from walk 2); Safari, Firefox; android jest preset; real phone; card-fee history (Hub task).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-09.md](history/WEBAPP-09.md).

## Owner sign-off
