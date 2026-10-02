# Shared changes

Fenced files (`docs/WORKFLOW.md` section 4) are never edited by a screen or
feature task. A task that needs one changed adds a row here and builds
everything else. The owner applies the queue between rounds of work, then the
task that asked for it finishes.

Four queues, because they have different owners and triggers:

## 1. Requests (a prop, token, route, schema field or client method)

| # | from task | file | exact change, and why | status |
|---|-----------|------|-----------------------|--------|
| 1 | SHELL-02 | `src/app/_layout.tsx` | Replace `const queryClient = new QueryClient();` with `import { queryClient } from '@/api/query';` (drop the `QueryClient` import). The app's query defaults (30 s stale time, retry only network and server errors, no mutation retry) live in `src/api/query.ts`; until the root uses it they are not applied. | open |
| 2 | SHELL-02 | `eas.json` (when SHELL-03 creates it) | Each build profile's `env` sets `EXPO_PUBLIC_ID_URL` (WAWU ID, the sign-in service) beside `EXPO_PUBLIC_API_URL`. Local: `http://<lan-ip>:3002`; the app falls back to a non-resolving address if it is missing. | applied by SHELL-03 (`eas.json` has it in every profile) |
| 3 | SHELL-02 | `docs/BUILDS.md` | Line 90: name `EXPO_PUBLIC_ID_URL` next to `EXPO_PUBLIC_API_URL`. | applied by SHELL-03 |
| 5 | SHELL-03 | `eas.json` | The `.invalid` addresses for `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` in each profile are replaced with the real test and production addresses (owner inputs, docs/BUILDS.md). `EXPO_PUBLIC_ID_URL` is already present in every profile, which covers the request SHELL-02 made. | open |
| 7 | UI-02 follow-up | `src/theme` (token generator input `design/_ds/wawu/tokens/elevation.css`) | Export the design's shadows as theme tokens: `--shadow-sheet` (0 -12px 40px, black 0.5) and the segment lift (kit `Seg`, 0 1px 3px, black 0.08), in both themes. Until then `src/components/shadow.ts` `blackAt(alpha)` derives black from the dark scrim colour and the two components hold the offsets as named constants citing the kit; delete `shadow.ts` when the tokens exist. | open |
| 10 | MONEY-02 | `src/components/BottomSheet.tsx` | A `gap` prop (default `sheetMetrics.between`, 18) so a sheet can pass the kit's own `sheet(..., { gap })`: W11 and M13 pass 14, so the space under the PIN sheet's grabber is 4 px larger than drawn until it exists. Optionally a bottom padding of at least the safe-area inset (the PIN sheet's own frame did that). | open |

## 2. Follow-ups in another task's screen

| # | raised by | target file | change needed, and what forced it | status |
|---|-----------|-------------|-----------------------------------|--------|

## 3. Removals (deleting or hiding something)

Before running one, search for every reference. Move anything the removed code
did that must survive in the same change.

| # | decision | what to remove, and what must move with it | status |
|---|----------|--------------------------------------------|--------|

## 4. Route-graph changes (the order screens appear in)

Half-done is worse than not started: removing the old wiring without adding the
new one strands users. Walk the flow afterwards (V7).

| # | decision | every call site and its new destination | status |
|---|----------|-----------------------------------------|--------|

## Applied

What was actually done, with gate counts before and after.

| # | change | what was done | counts |
|---|--------|---------------|--------|
| 6 | UI-01: theme tokens for the component sizes held as literals | Closed 2 Oct 2026 without an owner decision (R-22): the sizes are the board kit's own (`design/_gen/kit.js` `Btn`, `IB`, `I`) and stay as named constants that cite it. Includes the ones the UI-01 verifier added: label letter-spacing, IconButton size (kit `IB` 42), icon strokes (now `ICON_STROKE` in `src/components/icon`). Button side padding must be the kit's 14 / 18 / 24 (Developer 1 fixing). | no code change |
| 4 | SHELL-03: over-the-air updates | `npx expo install expo-updates` (~57.0.24) and `eas update:configure`: `updates.url` is `https://u.expo.dev/d07de585-f201-4b3e-989a-34f948d6e860`, Android `runtimeVersion` policy `appVersion`; channels were already set per profile in `eas.json`. A build made after this receives JS updates published to its channel without reinstalling. | no code change |
| MONEY-03 #6, MONEY-02 #7 | `Text` variants from the kit (`src/theme/index.ts` `text`, `src/components/Text.tsx`) | SHARED-01, 2 Oct 2026 (fix round 1 adds `bannerBody`). Eight variants, each citing its `design/_gen/kit.js` line: `kvLabel` 14 / 400 / textSecondary (line 44 `kv` key); `kvValue` 14.5 / 600 / textPrimary (line 44 `kv` value, line 58 `banner` title); `meta` 13 / 400 / textMuted (line 69 `fromWallet` line, line 55 `tx` sub); `bannerBody` 13 / 400 / textSecondary / line height 1.45 (line 58 `banner` body); `cardTitle` 15 / 600 / textPrimary (line 69 `fromWallet` title); `sheetTitle` 22 / 700 / -0.03em / 1.15 (line 41 `h1` at 22); for MONEY-02's PIN sheet `sheetTitleSm` 21 / 700 / -0.03em / 1.15 (line 41 `h1` at 21) and `muted` 13.5 / 400 / textSecondary / 1.45 (line 42). Where the kit sets no line height (kvLabel, kvValue, meta, cardTitle) the variant uses Alan Sans's `normal`, 1.3 (`type.leading.snug`). `muted` is not `meta` and not `secondary` (1.45 against 1.4). Both sheet titles announce as headings. **What MONEY-03's `src/components/pay-sheet/PaySheet.tsx` (as of da5a196) can now delete:** `KV_LABEL` and style `kvLabel` (use `<Text variant="kvLabel">`); style `kvValue` (`variant="kvValue"`); `ROW_VALUE`, once its two `Money size={ROW_VALUE}` uses read `text.kvValue.fontSize`; `META` and style `meta` (`variant="meta"`; its `Money size={META}` reads `text.meta.fontSize`); `BANNER_LEADING` and style `bannerLine` (the banner body becomes `variant="bannerBody"`); `CARD_TITLE` and style `walletTitle` (`variant="cardTitle"`); `SHEET_TITLE`, `SHEET_TITLE_LEADING` and style `sheetTitle` (`variant="sheetTitle"`). Spacing styles that only add a margin (`walletLine`, `bannerTitle`, `rowValue`) stay. | before (main d7e434a): tsc 0, lint 0 errors / 0 warnings, 9 suites / 136 tests, gates 9 / 50 files / 0 fail; after (merged with main 2eb1fde): tsc 0, lint 0 / 0, 10 suites / 178 tests, gates 9 / 52 files / 0 fail |
| MONEY-03 #7 | `src/components/Money.tsx` line height and tracking | SHARED-01. (a) The outer Text keeps `lineHeight: size` (the kit's `line-height:1`). On the web only (`Platform.OS === 'web'`) the ₦ and kobo runs get `lineHeight: size * 0.72`: in CSS each run inheriting the figure's absolute line height pushed the line box past `size` (44 at 40 from the kobo, as MONEY-03 measured; 41 from the platform-font ₦). Measured after on the web export: 40 px at size 40, light and dark. On iOS and Android the runs carry no line height of their own, because one paragraph has one line height there (iOS takes the first run's paragraph style, Android the last line-height span), so a run's 72% would set the whole line and clip it. Jest asserts the style trees for web, iOS and Android; the phone itself is V10, pending the first Android build. (b) Tracking is the kit's -0.025em as the named constant `amountTracking` citing kit.js line 13 (R-22); the design token `--tracking-money` (-0.03em) stays in `design/_ds` and `Money` no longer reads it. | as above |
| MONEY-03 #8 | `src/components/Avatar.tsx` (one component with UI-02's) and new `src/components/CurrencyFlag.tsx` | SHARED-01. UI-02 put an `Avatar` on main at the same time; there is one now, with UI-02's API (`AvatarHue`, `initialsOf`, `source`, `decorative`, labelled with the name unless decorative) and the kit's `Av` drawing: initials in textOnLight on the `hue*` token at `round(size * 0.36)`, 700, -0.02em of the rounded size, default 44. It adds `hues` (the palette in token order), `style`, and `source` as a URL or a bundled image. Initials are uppercased, as UI-02's merged test requires ("chidi" is "C"); the kit takes the letters as written. `CurrencyFlag` is the kit's `Flag`: the `cur*` token circle, the sign in textOnAccent at `size * 0.46`, 700, default 36; ₦, ₮ and ₿ in the platform font (Alan Sans lacks them, D15). **MONEY-03 can delete:** `PayAvatarHue` (use `AvatarHue`), `HUE`, `AVATAR_TEXT`, styles `avatar` and `avatarText` (use `<Avatar name hue size={AVATAR} decorative />`; the item's `initials` field becomes the name, since `initialsOf` derives them); `COIN`, `COIN_TEXT`, styles `coin` and `coinMark` (use `<CurrencyFlag currency="NGN" />`, whose default size is the 36). Picture check at 390 px against W10 (avatar 64, amount 40, kv row, wallet card with the 36 px coin) and W3 (USDT and BTC at 40): same pixel size and ink box, light and dark. | as above |
| MONEY-02 #6 | Lucide `ScanFace` and `Delete` from a shared renderer | 5d4208f (`@/components/icon`); MONEY-02 deleted `src/components/pin-sheet/icons.tsx` and uses `Icon`. | |
| MONEY-02 #8 | `Fingerprint` through a documented `EXTRA` list in `scripts/design/gen_icons.js` (owner, 2 Oct 2026: the biometric key is whatever the phone has) | Applied by MONEY-02 on the owner's instruction; `npm run icons` keeps it (163 icons). | |
| MONEY-02 #9 | `expo-local-authentication` (~57.0.3) in `package.json` and its config plugin in `app.json` (`faceIDPermission`) | Applied by MONEY-02 on the owner's instruction, with `npx expo install`. | |
| MONEY-02 2.1 | The PIN sheet on UI-02's `BottomSheet` | Applied by MONEY-02 once UI-02 merged: `PinSheet.tsx` renders `BottomSheet` (slide motion, kit frame, `dismissible={false}` while a PIN is being checked) and its own Modal, scrim, panel and handle are deleted. The kit's gap 14 waits on request 10. | |
