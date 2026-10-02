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
| MONEY-03 #6, MONEY-02 #7 | `Text` variants from the kit (`src/theme/index.ts` `text`, `src/components/Text.tsx`) | SHARED-01, 2 Oct 2026. Added `kvLabel` 14 / 400 / textSecondary, `kvValue` 14.5 / 600, `meta` 13 / 400 / textMuted, `cardTitle` 15 / 600, `sheetTitle` 22 / 700 / -0.03em / 1.15 and, for MONEY-02's PIN sheet, `sheetTitleSm` 21 / 700 / -0.03em / 1.15 and `muted` 13.5 / 400 / textSecondary / 1.45. Each cites its `design/_gen/kit.js` line. Where the kit sets no line height the variant uses Alan Sans's `normal`, 1.3 (`type.leading.snug`). `muted` is not `meta` (13.5 against 13, textSecondary against textMuted) and not `secondary` (line height 1.45 against 1.4). The two sheet titles announce as headings. With this on main, PaySheet (MONEY-03) and the PIN sheet (MONEY-02) switch to these and delete their constants (BUILDER.md, "use what main now has"). | before: tsc 0, lint 0 errors / 2 warnings, 6 suites / 70 tests, gates 9 / 34 files / 0 fail; after: tsc 0, lint 0 / 2 (same Button.tsx warnings), 7 suites / 104 tests, gates 9 / 37 files / 0 fail |
| MONEY-03 #7 | `src/components/Money.tsx` line height and tracking | SHARED-01. (a) The kobo run and the ₦ run get `lineHeight: size * 0.72`; inheriting the figure's absolute line height, each pushed the line box past `size` on the web (44 at 40 from the kobo, as MONEY-03 measured; then 41 from the platform-font ₦). Measured after: 40 px at size 40, light and dark. (b) Tracking is the kit's -0.025em as a named constant `amountTracking` citing kit.js line 13 (R-22). The design token `--tracking-money` (-0.03em) is left as it is in `design/_ds` and is no longer read by `Money`. | as above |
| MONEY-03 #8 | New `src/components/Avatar.tsx` and `src/components/CurrencyFlag.tsx` | SHARED-01. `Avatar` is the kit's `Av`: initials (first letters of up to two words, "W" with no name) in textOnLight on a `hue*` token, font `round(size * 0.36)`, 700, -0.02em, default 44, a photo when `src` is given (URL or bundled image); hidden from screen readers unless given a `label`. `CurrencyFlag` is the kit's `Flag`: the `cur*` token circle with the sign in textOnAccent at `size * 0.46`, 700, default 36; ₦, ₮ and ₿ in the platform font (Alan Sans lacks them, D15). Both in the showcase. Picture check at 390 px against W10 (avatar 64, amount 40, kv row, wallet card with the 36 px ₦ coin) and W3 (USDT and BTC at 40): same pixel size and ink box in light and dark. | as above |
