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
| 6 | MONEY-02 | `src/components/TabIcon.tsx` (or a shared icon) | Lucide `scan-face` and `delete` in a shared renderer, so the PIN keypad stops drawing its own glyphs. | applied by 5d4208f (`@/components/icon`); MONEY-02 deleted `src/components/pin-sheet/icons.tsx` and uses `Icon` |
| 7 | MONEY-02 | `src/components/Text.tsx` | Two variants for the kit's sheet copy so the PIN sheet uses the shared `Text`: `sheetTitle` = kit.js `h1(s, { size: 21 })` (21, 700, -0.03em, line height 1.15) and `muted` = kit.js `muted()` (13.5, 400, `textSecondary`, line height 1.45; `secondary` has 1.4). Why: W11, H15 and M13 draw both, no variant matches (h1 is 24), and a style on a component is not allowed; until then `src/components/pin-sheet/PinEntry.tsx` draws them with React Native `Text` and the kit constants in `pin-sheet/kit.ts`. | open |
| 8 | MONEY-02 | `scripts/design/gen_icons.js`, `src/components/icon/icons.generated.ts` | A documented `EXTRA` list for icons the app needs that the canvas never names, holding `Fingerprint` (owner, 2 Oct 2026: the biometric key is whatever the phone has); `npm run icons` regenerated the set (163 icons). | applied by MONEY-02 on the owner's instruction |
| 9 | MONEY-02 | `package.json`, `package-lock.json`, `app.json` | `npx expo install expo-local-authentication` (~57.0.3), and its config plugin in `app.json` with `faceIDPermission` "Allow $(PRODUCT_NAME) to use Face ID to approve payments." (without it iOS falls back to the passcode). Needed to read which biometric the phone has (owner, 2 Oct 2026). | applied by MONEY-02 on the owner's instruction |

## 2. Follow-ups in another task's screen

| # | raised by | target file | change needed, and what forced it | status |
|---|-----------|-------------|-----------------------------------|--------|
| 1 | MONEY-02 | `src/components/pin-sheet/PinSheet.tsx` | The PIN sheet's frame moves onto UI-02's bottom sheet, deleting its own Modal, scrim, panel and handle. For that, UI-02's sheet must provide: (a) a slide-up enter and slide-down exit (`motion` tokens) over a fading `surfaceScrim`, drawn above everything; (b) the kit's `sheet()` frame: `surfaceElevated`, `radius.sheet` top corners, 1px `borderHairline` top edge, padding 10 / 20 / 34 with the bottom at least the safe-area inset, the 40 by 5 `borderStrong` handle (radius 3, 4 below), and a `gap` prop (W11 and M13 pass 14, the kit default is 18); (c) `visible` and `onClose` (scrim tap, Android back), plus a way to refuse closing while a payment is in flight (for example `dismissable={false}`); (d) children unmounted when hidden, so the PIN entry's busy reset on unmount still runs. UI-01's half is done: the sheet formats the total with `formatMoney` (Money.tsx), and kit.js draws its keys and "Forgot PIN?" as keypad cells and a text line, not `Btn` or `IconBtn`, so no shared button applies. | open (waits on UI-02) |

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
