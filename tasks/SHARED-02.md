---
id: SHARED-02
title: Shared-change pass for the four tab hubs
owner: YOU
area: SHARED
order: 183
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: [R-41]
passes: [V1, V5, V6]
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

Built by the lead's agent, 7 Oct 2026, on `wmt/SHARED-02` from `origin/main` 47e1f07, then `origin/main` 5fec168 (ME-01 merged) merged in. No hub screen was changed: each hub swaps its stand-in in its own fix round.

**Rows applied** (all marked `applied by SHARED-02` in `SHARED-CHANGES.md`; the hub rows were copied from the hub branches with only the status changed, so where a hub branch's merge meets one of them, only the status column differs).
- **HOME-01 #2 and EXPLORE-01 #3, one design on `MediaCard`.** `titleAccessory` (after the title, 4 apart, stacked and row; the title shrinks before the accessory does). `footer` (stacked only: under the caption inside the picture, 8 below the words). `action={ label, onPress, on, loading, disabled, testID }` (stacked only: the shared `Button`, `size="sm"`, full width, 32 high, `primary`, or `glass` when `on`; after a footer when both are given). With a footer or an action, the card is no longer one screen-reader element: the words are (`<testID>-words`, the same label), so the button stays reachable; with `onPress` too, the words carry the press as `activate`. `width` now also takes `'100%'` (Categories' grid). With none of them the tree is the one main draws.
- **EXPLORE-01 #1, `FilterChips`.** `ChipItem.icon`: 11 at the start, 14 at the end (less the 1 px outline on `option`, as that variant counts it), a 15 icon at stroke 2 in the label's colour, 6 before the label (`chipIconMetrics`). `revealSelected` (row only): the chip on at the first draw is scrolled into view once if it starts out of view, CategoryChips' behaviour, measured against the row's own width. Each chip is now `<testID>-<value>`.
- **ME-01 #1, `Button`.** A new size `profile`: 38 high, 16 in, label 14 at 600. The size table now carries a label weight; `sm`, `md` and `lg` keep 700.
- **HOME-09 #1 joined with HOME-01 #1, tokens.** `design/_ds/wawu/tokens/colors.css`: `--tgif-{verse,reality,remember,prayer,takeaway}-{ground,glow}` (the takeaway ground is `var(--tgif-verse-ground)`), `--tgif-label` (#E2B4F5), `--tgif-warm-glow` (rgba(255,160,60,.35)), set once in the dark block so both themes hold the same value. `src/features/tgif/look.ts` now reads them (one ground and one glow per card; the washes and the two-token reality glow are deleted) and `CardBackdrop.tsx` draws the one glow. New `stopOf(token)` in `@/theme` splits `rgba(r, g, b, a)` into an opaque colour and its strength, because react-native-svg replaces a stop colour's own alpha with `stopOpacity`.
- **WALLET-01 #1 (and HOME-01 #1's shadow), tokens.** `scripts/design/gen_tokens.py` now turns every `--shadow-*` into a React Native `boxShadow` list per theme: `darkShadows`, `lightShadows` (`ShadowToken`), and `useWawu().shadows`. `--shadow-money` is light `0 24 40 -22` at rgba(22,21,27,.6), dark an inset 1 px of white at 8%. `--glow-money` (rgba(148,17,201,.55), both themes) is a colour token in `elevation.css` (the generator's colour prefixes gain `tgif-` and `glow-`). All through `npm run tokens`; nothing hand-written in `src/theme/tokens.generated.ts`, whose NOT GENERATED header loses the seven shadow lines.
- **EXPLORE-01 #2 and ME-11 #3, `src/app/_layout.tsx`.** `categories`, `add-work`, `works/[wawuId]/index` and `works/[wawuId]/[workId]` are listed under the signed-in `Stack.Protected` guard.
- **WALLET-01 #2.** `flowReturn.test.tsx`: main's `(tabs)/wallet` is still the placeholder (WALLET-01 is not merged), so the real route cannot be walked here. The first case is now what it always tested, "from a tab: back on that tab", its stand-in renamed `TabWayIn`, and the header names WALLET-01's `walletTabFlow.test.tsx` as the Wallet tab's own walk with W5.
- **ME-01 F1.** `EditProfileScreen.tsx` calls `onSaved` as soon as the save lands; it draws no toast and makes no announcement of its own (`TOAST_MS` and the timer are gone). `SavedToast.tsx` stays for the Me tab. The edit-profile tests wait for `onSaved` where they waited for the toast.

**Files.** `src/components/MediaCard.tsx`, `FilterChips.tsx`, `Button.tsx`; `src/theme/index.ts`, `src/theme/tokens.generated.ts` (generated); `scripts/design/gen_tokens.py`; `design/_ds/wawu/tokens/colors.css`, `elevation.css`; `src/app/_layout.tsx`; `src/features/tgif/look.ts`, `CardBackdrop.tsx`; `src/features/profile-edit/EditProfileScreen.tsx`; tests: new `src/__tests__/hubSharedProps.test.tsx` (36), `src/__tests__/auth-guard.test.tsx` (+8), `src/features/profile-edit/__tests__/editProfile.test.tsx`, `pictures.test.tsx`, `src/features/open-wallet/__tests__/flowReturn.test.tsx`; `SHARED-CHANGES.md`, `docs/LOG.md`, generated `tasks/INDEX.md` and `docs/PROGRESS.md`.

**Capability checks** (left `[ ]` for the verifier).
- *Each row applied and marked:* 11 rows say `applied by SHARED-02` (the nine in the scope table plus HOME-09 #1 and ME-11 #3 on main).
- *Every existing user renders identically:* users found by grep. `MediaCard`: the pay sheet, the showcase. `FilterChips`: Inbox, All works (M34), the showcase. `Button`: every auth screen, the pay and PIN sheets, policies, settings (password, blocked, privacy), M8 and M9, works (M34, M35, M36), TGIF, payout account, Open your wallet, Inbox, `StateViews` (every error and empty state). Two web exports each of main (47e1f07) and the branch's final source (`npx expo export --clear`, private TMPDIR, prod and `--dev` for the dev-only showcase and previews), served on :5415 with a stand-in Hub on :5416 that answers every route from the contract's own schemas, the same answers for both builds, and a stand-in ID on :5417; signed-in screens use a session seeded in localStorage; every non-localhost request aborted (none was made). Playwright Chromium, 390 x 844 at 2x, light and dark, CSS animations off, and each scrolling screen shot a viewport at a time to its end. **51 routes and states, 128 pairs: 126 identical to the pixel; 2 differ, both `/tgif` (light and dark), by design**: the verse card's ground moves from the debit ink #2A1240 to the canvas's #2A0C3E (a sampled ground pixel 42,18,64 before, 42,12,62 after; largest channel difference 6) and its glow from the accent at 70% to the token at 70%. **After the merge of 5fec168 (ME-01's Me tab, a new `Button` user)**: main 5fec168 and the merged branch exported again and shot at `/me` and `/edit-profile`: 6 pairs, 6 identical (`shots/me-before/`, `shots/me-after/`). Shots: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bs02/shots/before/` and `after/`, the numbers in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bs02/diff.json`, the changed masks in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bs02/shots/diff/`.
- *Tokens through `npm run tokens`:* the generated file was written only by `npm run tokens`, and `python3 scripts/design/gen_tokens.py --check` reports it up to date (run by hand: `npm run check` does not run it); tests read the generated values (both themes) against the canvas's.
- *Each new prop drawn when given and absent when not:* `hubSharedProps.test.tsx`: titleAccessory (stacked, row, absent), footer (8 gap, the words grouped, card not one element; absent: one element with its label; row: not drawn), action (32 high, full width, accent, glass when on, press reaches the caller, after a footer; absent: no button; `'100%'` width), chip icon (padding, colour, option outline; absent: 15 either side and no icon), revealSelected (scrolls once to an out-of-view chip, not to one in view; absent: no layout handlers, no scroll), Button `profile` (38, 16, 14 at 600; `sm` still 700), the twelve TGIF tokens in both themes, each reader card's ground and split glow, `stopOf`, `--shadow-money` both themes, `--glow-money`, `--shadow-card: none` as no shadow. Routes (`auth-guard.test.tsx`): a signed-out visit to each of the four routes lands on welcome, a signed-in one draws it; with the four `Stack.Screen` lines removed the four signed-out cases fail (4 failed, then restored).

**Checks.** Before (main 47e1f07, while an export ran beside it): typecheck and lint clean; jest 63 suites, 1143 tests, 2 failed, both 20 s timeouts under load (`OpenWalletScreen` A26 loading, `settingsScreens` Z3); gates (main snapshot) 297 files, 0 findings; tasks 211. After (branch on 47e1f07, nothing else running): `npm run check` exit 0; typecheck and lint clean; jest 64 suites, 1187 tests, 0 failed (+1 suite and +44 tests, all this task's; the two timeouts above passed); gates 298 files, 0 findings; tasks 211. After merging 5fec168: `npm run check` exit 0; jest 67 suites, 1227 tests, 0 failed (ME-01's three suites came with main); gates 310 files, 0 findings; tasks 211.

**Decisions (Default (agent), owner may override).**
- `action` is the shared `Button` (sm, 32 high), not a new pill: its label is 13.5 at 700 and its glass is white at 14% with the glass ring, where `cCard`'s Follow is 13 at 700 and white at 20% with no ring. EXPLORE-01's stand-in drew the same `Button`; HOME-01's stand-in drew the canvas's exact pill and can keep it as a `footer` if the verifier holds Today to those values.
- The new Button size is named `profile` (where it is drawn: the name block on M1 and M5), not a `labelWeight` prop, so a size stays one complete look.
- The generator exports every shadow token, not only `--shadow-money`: one rule for the whole family. Row 7's `--shadow-sheet` is therefore now `shadows.sheet`; `src/components/shadow.ts` and its two users are row 7's and were not touched (the kit's `Seg` lift still has no token).
- WALLET-01 #2 keeps the case running (above) instead of dropping it, so main loses no coverage while WALLET-01 is unmerged.
- ME-01 F1 is applied as written. ME-01 merged while this was built, so its route already posts M10's notice: with this branch a save shows "Profile saved" once, on M1 (ME-01's `editProfileRoute.test.tsx` and the M8 tests pass together).
- `docs/CONVENTIONS.md`, named in the brief, does not exist on main; `CLAUDE.md` and `docs/WORKFLOW.md` were followed.

**Findings for the hubs' fix rounds.** ME-01 merged (done) before this pass, so `src/features/me/ProfileHeader.tsx` still draws "Edit profile" as `size="sm"` with `style` (38, 16): the move to `size="profile"` is a one-line change in M1's own file, outside this task. HOME-01's `SuggestionCard` draws the person's initials when there is no photo; `MediaCard` draws its quiet block there and has no slot for initials (not asked for in any row). HOME-01's Follow says "Follow <name>" to a screen reader; `action` says its `label`, as every `Button` does.

**NOT RUN.**
- The new props on a real screen: no screen on main uses them until each hub swaps its stand-in (fact: the hub's fix round on this branch's merge).
- A phone: no development build here, web only. Most at risk: `stopOf`'s split on react-native-svg on iOS and Android (fact: H29 to H34 on a development build).
- VoiceOver and TalkBack on a card with a footer or action (fact: a development build and a hub using the props).
- The other four TGIF cards on screen (only the verse card opens first; their values are unit-tested).
- Screens the screenshots did not reach: the export sheet and the TGIF share sheet (both opened only by a press), and A5 and A6 (`/open-wallet-details`, `/open-wallet-selfie` send a fresh visit back to A26). Their buttons use `sm`, `md` or `lg`, whose table entries did not change.
- Signed-in screens were drawn against the stand-in Hub, not the real one: the evidence is "identical before and after", not the screens' data.
- Until EXPLORE-01 merges `src/app/categories.tsx`, Expo Router warns once that no route named `categories` exists and skips that entry (fact: EXPLORE-01's merge).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
