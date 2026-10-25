---
id: SWEEP-R2
title: App sweep: three low rows from R2-MONEY and R2-AUTHME2 (beneficiary switch, tier checkout ring, selfie portrait guide)
owner: YOU
area: SWEEP
order: -160
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# SWEEP-R2 · App sweep: R2 lows

## Current state

As of 25 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/SWEEP-R2` from `origin/main` `045cacf2`. App only; no backend change (row 4). Status verifying. Pictures at 390 px, light and dark, from a throwaway stand-in page on the web dev server (not committed): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/sweep-r2/` (`receipt-wawu-*`, `receipt-bank-*`, `checkout-wallet-*`, `checkout-transfer-*`, `oval-idle-*`, `oval-refused-*`); boards VF6, VF6a, A16 and W12 rendered beside them.

| # | Low (source) | Before (`origin/main`) | After |
|---|---|---|---|
| 1 | W12 offers "Save as a beneficiary" (on) after a send to a WAWU user, saving them into a list no screen draws (v-R2-MONEY-r1 low b) | the switch was drawn after every completed send and saved a WAWU user the moment the receipt opened; W8's Saved list and W35's count draw bank accounts only | the switch is drawn after a bank send only (the board's W12 is a bank send: "Save Chidinma as a beneficiary"); a send to a WAWU user draws no switch and saves nobody. `saveWawuBeneficiary` and `savedRowFor` had no other caller and are removed from `send/api.ts`. The bank switch (on by default, off removes, the Hub's words on a refused save) is unchanged and now has its own tests |
| 2 | Tier checkout: the wallet row has a square fill and no accent ring where VF6 draws the chosen row with the ring (`planParts.tsx` `MethodRow`; v-R2-AUTHME2 low) | both ways to pay sat in one grouped list; the chosen row was a square accent-tint band with no ring | each way to pay is a card of its own (`radius.card`, 8 apart): the chosen one has the accent tint and a 2 px accent ring, the other the card surface and a 1 px hairline, as the pack rows (PT4) draw them. Picked from the pack row's own recipe; there is no shared selected-row component, so none was forked |
| 2b | Pack checkout (`BuyScreen.tsx`, PT4) | the brief named the pack checkout too | not changed: PT4 draws the two ways to pay in one grouped card with a divider and the radio only (no ring); the pack rows above it already carry the ring. Matches the board as built |
| 3 | The oval is an empty dark frame where A16 draws a portrait guide (`SelfieScreen.tsx` `Oval`; the file the brief called CameraPage.tsx has no such name: `CameraPage` is a component in `SelfieScreen.tsx`) | with no live picture the oval was filled with the card colour | with no live picture the oval holds the board's guide: a lilac wash (`hueLilac`, a white veil lighter at the top left, a dark one at the foot), a head and shoulders, drawn with `react-native-svg` shapes from tokens, clipped to the oval under the ring. No image asset (the board's `p1.jpg` is a mock photo that stays in `design/`). The live camera's own oval is unchanged (the mask test still holds). Note: this camera page is the older opening kept for the rollback (R-39); the hosted selfie hand-off (A6, `HostedSelfieScreen`) draws no oval and is unchanged |
| 4 | Admin transfer lookup lands in the app's contract (`admin-transfers.controller.ts`; the brief) | NOT DONE, premise not found: the controller's tag is `AdminTransfers` (Nest derives it from the class name), which `contract/mobile-exclusions.json`'s `^Admin` pattern already excludes; `GET /admin/money/transfers/lookup` is absent from `contract/openapi.mobile.json` and from the `paths` of `src/api/schema.generated.ts` | the two schemas `AdminTransferLookupView` and `AdminTransferLookupResult` are in `schema.generated.ts` exactly as the other 198 admin schemas are (`sync_contract.py` removes operations, never their schemas: 200 component schemas are unreachable from any app path). No tag change can remove them. Two ways to, for the lead to rule: (a) prune schemas only reached by excluded operations in `sync_contract.py` (a one-off diff in `schema.generated.ts`), or (b) `@ApiExcludeController()` on the controller, which also removes it from the contract the dashboard's D-03 screen (G-R2M-1) would generate from. Separate finding: six admin controllers are tagged `AbroadAdmin`, `FxAdmin`, `WorldAdmin`, `SchoolSettlementAdmin`, `WaitlistAdmin`, `ReferralAdmin`; none matches `^Admin` or `Ops$`, so their 25 admin routes DO reach `schema.generated.ts` paths |

Changed assertions (a sweep row that names a defect is the ruling): `sendFlow.test.tsx` "the beneficiary switch starts ON and the person is saved..." (pinned the WAWU switch) now asserts no switch, no save and the Share receipt text as before; its "when the Hub will not save the person" case is moved to `bankSendFlow.test.tsx` for the bank account. No other assertion was touched; new ones: `tierCheckout.test.tsx` (ring and tint swap), `SelfieScreen.test.tsx` and `selfieCapture.test.tsx` (guide present without a live picture, gone with one).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `tasks/R2-MONEY.md` (on `origin/wmt/R2-MONEY`), `docs/designer/BRIEF.md` (W12), boards W12, VF6, VF6a, PT4, A16

## Goal

Three small lows from the R2 verifiers' reports are fixed in the app, each with a test that fails before.

## Scope

`wawu-wmt-mobile` only: `src/features/send/{ReceiptScreen.tsx,api.ts}`, `src/features/verify/{planParts.tsx,CheckoutScreen.tsx}`, `src/features/open-wallet/SelfieScreen.tsx`, and their tests. No new route, no shared component, no backend change.

## Capability checks

- [x] A user who sends to a bank account is offered "Save <first name> as a beneficiary" on the receipt, on, and can turn it off.
- [x] A user who sends to a WAWU user is offered nothing to save and nobody is saved.
- [x] A user at the tier checkout sees the chosen way to pay with the accent ring and the other with a hairline, and picking the other swaps them.
- [x] A user whose selfie did not match sees the board's portrait guide in the red oval.
- [ ] The admin transfer lookup's schemas are out of the app's generated client (not done: see row 4).
