# Shared changes

Fenced files (`docs/WORKFLOW.md` section 4) are never edited by a screen or
feature task. A task that needs one changed adds a row here and builds
everything else. The owner applies the queue between rounds of work, then the
task that asked for it finishes.

Four queues, because they have different owners and triggers:

## 1. Requests (a prop, token, route, schema field or client method)

| # | from task | file | exact change, and why | status |
|---|-----------|------|-----------------------|--------|
| 1 | MONEY-03 | `package.json` (via `npx expo install react-native-svg`) plus an icon set | Add an SVG icon set so screens can draw the canvas's Lucide icons. The pay sheet draws its tick ring, plus, wallet, clock and cross from Views (`src/components/pay-sheet/glyphs.tsx`); once icons exist, swap them in and delete `glyphs.tsx`. | open |

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
