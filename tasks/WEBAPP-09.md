---
id: WEBAPP-09
title: The second web walk's fixes (Phase 1, last batch)
owner: YOU
area: WEB
order: 373
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [WEBAPP-08]
decisions: [R-127, R-128, R-47, R-86, R-94]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-09 · The second web walk's fixes (Phase 1, last batch)

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from the second web walk on 60958fc (walkers A, B and C all PASS, no SERIOUS; reports appended to `tasks/history/WEBAPP-07.md`).
- **Next:** a builder on `wmt/WEBAPP-09` from `wmt/BATCH-WEBAPP1`; then a T1 verifier who walks every touched path on the web export; then the batch check and the PR to main.
- **Carried elsewhere, not here:** the card fee missing from the wallet history (Hub, `CARD-FEE-HISTORY`); "You can edit it while it waits" with no edit (CREATOR-TAKEDOWN); the verification page's "Up to 25 uploads" against the tiers' 4, 8 and 15 (an owner question: which limit applies to whom).

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

## Builder report

## Verifier report

## Owner sign-off
