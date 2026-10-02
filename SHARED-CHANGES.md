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
| 4 | SHELL-03 | `package.json`, `app.json` | Add `expo-updates` with `npx expo install expo-updates`, then `app.json` gets `runtimeVersion: { "policy": "appVersion" }` and `updates.url` (the owner's EAS project URL). `npx eas-cli update:configure` writes the app.json part. Without it `eas update --channel preview` has nothing to receive it. Also after `eas init`: `owner` and `extra.eas.projectId` in `app.json` (owner runs it, docs/BUILDS.md step 2). | open |
| 5 | SHELL-03 | `eas.json` | The `.invalid` addresses for `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` in each profile are replaced with the real test and production addresses (owner inputs, docs/BUILDS.md). `EXPO_PUBLIC_ID_URL` is already present in every profile, which covers the request SHELL-02 made. | open |
| 6 | MONEY-03 | `src/theme/index.ts` (`text`) and `src/components/Text.tsx` (`defaultTone`) | Add the kit's copy sizes the pay sheet needs as `Text` variants (R-22: sizes come from `design/_gen/kit.js`): `kvLabel` 14 / 400 / textSecondary (kit `kv` key); `kvValue` 14.5 / 600 / textPrimary (kit `kv` value, `banner` title); `meta` 13 / 400 / textMuted (H14 meta line, `fromWallet` line, `banner` body at line height 1.45 in textSecondary); `cardTitle` 15 / 600 / textPrimary (`fromWallet` title); `sheetTitle` 22 / 700 / -0.03em / line height 1.15, a heading (H18 `h1(..., { size: 22 })`). No current variant matches these, so `src/components/pay-sheet/PaySheet.tsx` holds them as named constants (`KV_LABEL`, `META`, `CARD_TITLE`, `SHEET_TITLE`); once the variants exist it uses `Text` for them and the constants go. | open |
| 7 | MONEY-03 | `src/components/Money.tsx` | (a) Give the kobo run `lineHeight: size * minorScale` beside its `fontSize`. Today it inherits the absolute `lineHeight: size`, which makes a 40 px figure 44 px tall on web (measured on W10's ₦25,000.00; with the change it is 40, the kit `Amt`'s `line-height: 1`), so W10's card sits 4 px low. (b) The kit's `Amt` tracks at -0.025em; `Money` uses `type.tracking.money` (-0.03em). Per R-22 the kit's value applies, unless the lead rules the token wins. | open |
| 8 | MONEY-03 | `src/components/` (new `Avatar` and `CurrencyFlag`) | Shared versions of the kit's `Av(name, hue, size)` (hue circle, initials at 36% of the size, 700, textOnLight) and `Flag(cur, size)` (currency colour circle, the sign at 46%, 700, white). The pay sheet draws both itself (W10's 64 px recipient avatar, the 36 px ₦ coin on the wallet card), since nothing shared exists yet; with the shared ones it uses them. | open |

## 2. Follow-ups in another task's screen

| # | raised by | target file | change needed, and what forced it | status |
|---|-----------|-------------|-----------------------------------|--------|
| 1 | MONEY-03 | `src/components/pay-sheet/PaySheet.tsx` | When UI-02's bottom sheet is on main, the purchase variant renders inside it. UI-02 provides: the scrim (`surfaceScrim`), the panel (`surfaceElevated`, 44 px top corners, a 1 px `borderHairline` top edge, padding 10 / 20 / 34), the 40 × 5 `borderStrong` grab handle, slide-up on open and drag or scrim tap to dismiss. The pay sheet then drops its own panel and handle (`styles.sheet`, `styles.handle`). The send variant is a page body and needs nothing from UI-02. Buttons, amounts and copy already use UI-01. | open |

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
