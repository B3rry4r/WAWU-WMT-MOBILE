---
id: SHARED-02
title: Shared-change pass for the four tab hubs
owner: YOU
area: SHARED
order: 183
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: []
decisions: [R-41]
passes: [V1, V5]
artboards: []
---
# SHARED-02 · Shared-change pass for the four tab hubs

## Read first

- `docs/WORKFLOW.md` section 4 (fenced files) and `SHARED-CHANGES.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- The hub tasks' builder reports: `tasks/HOME-01.md`, `tasks/ME-01.md`, `tasks/EXPLORE-01.md`, `tasks/WALLET-01.md` on their `wmt/*` branches

## Goal

The four tab hubs (R-41) were built against fenced shared files they could not edit. Apply their queued requests now, in one serial pass on main, so each hub can then use the shared component instead of a local stand-in (a local copy of a shared component is a defect, docs/roles/VERIFIER.md check 2).

## Scope

Apply exactly these rows (text as filed on the hub branches), each as additive optional props or new tokens, so nothing that uses the component today changes:

| EXPLORE-01 #1 | EXPLORE-01 | `src/components/FilterChips.tsx` | An optional `icon?: IconName` on each item: when given, the chip pads 11 at the start and 14 at the end and draws the icon (15, stroke 2, the label's colour) 6 before the label (design/_gen/explore.js `chipRow`). Categories (X2, X3, X13) draws its chips with icons; until this lands `src/features/explore/CategoryChips.tsx` is the same control with the icon, and it is deleted when this lands (Categories then uses `FilterChips`, keeping its "scroll the opening chip into view once" behaviour as a prop or in the screen). | open |
| EXPLORE-01 #2 | EXPLORE-01 | `src/app/_layout.tsx` | List `categories` under the signed-in `Stack.Protected` guard, as ME-11 #3 asks for its routes. Until then `src/app/categories.tsx` sends a signed-out visit to `/welcome` itself. | open |
| EXPLORE-01 #3 | EXPLORE-01 | `src/components/MediaCard.tsx` | An optional `action` slot under the stacked caption (8 below the subtitle line), so a creator card is a `MediaCard` with a Follow button. `src/features/explore/CreatorCard.tsx` draws the portrait, scrim and caption itself with `mediaMetrics` and `gradientEnds` from `MediaCard` because the card has no such slot today. | open |
| HOME-01 #1 | HOME-01 | `design/_ds/wawu/tokens/colors.css` (then `npm run tokens`) and `src/features/home/look.ts` | Join HOME-09 #1's TGIF tokens with the two Today's TGIF card adds (`design/_gen/home.js` `tgifRow`): the small capitals' pale lilac (#E2B4F5) and the warm lower glow (rgba(255,160,60,.35)), the same in both themes. Until then `cardInk.tgifLabel` is `accentFg` (dark) and `cardInk.tgifWarm` is `warning` (dark) at the canvas's strength; the ground and the play mark are HOME-09's `surfaceCardInk` stand-in. Also the light theme's `--shadow-money` (0 24px 40px -22px, the card ink at 60%) joins row 7's shadow tokens: `look.ts` holds the offsets and `blackAt(0.6)` until then. | open |
| HOME-01 #2 | HOME-01 | `src/components/MediaCard.tsx` | Two optional props on the stacked card: `titleAccessory?: ReactNode` drawn after the title (the tick, 13, 4 apart) and `footer?: ReactNode`, drawn under the caption inside the picture with the canvas's 8 gap (`design/_gen/home.js` `cCard`: name and tick, the line under it, then the Follow button). With it, Today's creator card (`SuggestionCard` in `src/features/home/CreatorRail.tsx`, which draws the same picture, scrim and caption itself) becomes `MediaCard layout="stacked" width={146} height={196}` with a `titleAccessory` for the tick and the Follow button as its footer, and its own picture, scrim and caption are deleted. A caller passing neither is unchanged. | open |
| ME-01 #1 | ME-01 | `src/components/Button.tsx` | M1's "Edit profile" (design/_gen/me.js line 20, `nameBlock`) is a 38 high outline pill, 16 in from each side, its label 14 at 600. `Button` has no such size: `sm` is 34 high, 14 in, 13.5 at 700. The Me tab uses `variant="outline" size="sm"` with its height and side padding set through `style` (38, 16), so only the label is off (13.5 at 700 against 14 at 600). Change: a size (or a `labelWeight` prop) that draws 38 / 16 / 14 at 600; then `src/features/me/ProfileHeader.tsx` drops the `style` override. M5 (ME-02) draws the same header. | open |
| WALLET-01 #1 | WALLET-01 | `src/theme` (token generator input `design/_ds/wawu/tokens/elevation.css`) | Export `--shadow-money` as a theme token in both themes (light `0 24px 40px -22px` at 60% of `#16151B`; dark an inset 1 px line of white at 8%), and the balance card's glow (kit.js line 22, `Acct`: the accent at 55% in a 220 circle). The theme's header lists `--shadow-money` as not generated, so `src/features/wallet/home/BalanceCard.tsx` holds the parts as named constants citing the kit and builds the colours from tokens (`darkColors.surfaceCard`, `textOnAccent`, `accent`). Once the tokens exist the card reads them and the constants go. Same family as row 7. | open |
| WALLET-01 #2 | WALLET-01 | `src/features/open-wallet/__tests__/flowReturn.test.tsx` (KYC-04's) | Its first case walks Open your wallet from a stand-in Wallet tab (`WalletTabWayIn`, "W5 once WALLET-01 draws it"). The real tab now exists: WALLET-01's `src/features/wallet/__tests__/walletTabFlow.test.tsx` walks the same path from the real `(tabs)/wallet` route and checks W5 on return. KYC-04's owner may swap the stand-in for the real route or drop the case; nothing breaks either way. | open |
| HOME-09 #1 | HOME-09 | `design/_ds/wawu/tokens/colors.css` (then `npm run tokens`) and `src/features/tgif/look.ts` | The five TGIF cards are painted with colours the tokens do not have: the grounds #2A0C3E (verse and takeaway), #101A3A (reality), #3A0C2A (remember), #1A0E30 (prayer), and the corner glows rgba(148,17,201,.7), rgba(92,100,255,.55), rgba(214,59,140,.55), rgba(148,17,201,.6), rgba(255,160,60,.5). Add them as tokens (for example `--tgif-verse-ground` and `--tgif-verse-glow`), the same in both themes because the card is dark in both; then `look.ts` reads them and its blends are deleted. Until then each card is the nearest token, or a token laid over the dark page at the strength that lands on the canvas's colour (comment in `look.ts`), so a ground differs from the canvas by at most 11 on one channel (remember) and the reality glow is two tokens together. | open |
| ME-11 #3 | ME-11 | `src/app/_layout.tsx` | List `add-work`, `works/[wawuId]/index` and `works/[wawuId]/[workId]` under the signed-in `Stack.Protected` guard, as ME-06 #3 asks for `edit-profile`. Until then each route sends a signed-out visit to `/welcome` itself (checked: a signed-out visit to `/works/<id>` shows the welcome screen). | open |
| ME-01 F1 | ME-01 | ME-06's `src/features/profile-edit/EditProfileScreen.tsx` | After Save, M8 shows its own toast and the Me tab also shows "Profile saved" (M10): show it once (M10's). |

HOME-01 #2 and EXPLORE-01 #3 both change `MediaCard`: design one set of optional props (`titleAccessory`, `footer`, `action`) that serves both cards. HOME-09 #1 and HOME-01 #1 join into one token change. Every other screen that uses a changed component must look exactly as before (prove it with before and after screenshots of each user).

## Capability checks

- [ ] Each row above is applied and marked `applied by SHARED-02` in `SHARED-CHANGES.md`.
- [ ] Every existing user of `MediaCard`, `FilterChips` and `Button` renders identically before and after (screenshots, light and dark).
- [ ] New tokens are generated through `npm run tokens`, never hand-written in `src/theme`.
- [ ] `npm run check` exits 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
