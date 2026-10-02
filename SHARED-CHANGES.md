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
| 6 | MONEY-03 | `scripts/design/gen_icons.js` (then `npm run icons`) | The name scan `/['"]([A-Z][A-Za-z0-9]+)['"]/g` needs two or more letters, so the canvas's one-letter Lucide name `X` (`I('X', ...)`, 10 calls in `design/_gen/*.js`, e.g. W14's result mark and sheet close buttons) never reaches `icons.generated.ts`. Change `+` to `*` so `X` is generated. The pay sheet does not wait on this: its failed state (not drawn on the canvas) uses `CircleX`. | open |

## 2. Follow-ups in another task's screen

| # | raised by | target file | change needed, and what forced it | status |
|---|-----------|-------------|-----------------------------------|--------|
| 1 | MONEY-03 | `src/components/pay-sheet/PaySheet.tsx` | When UI-02's sheet lands, present the pay sheet in it (scrim, slide, drag to dismiss) and drop the panel's own handle and top corners; when UI-01's buttons, text and money display land, replace the local `PillButton`, the row text styles and `Balance` with them. Built locally only because UI-01 and UI-02 were in progress at the same time (owned by the developer). | open |

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
