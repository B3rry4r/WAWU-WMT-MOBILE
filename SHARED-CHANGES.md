# Shared changes

Fenced files (`docs/WORKFLOW.md` section 4) are never edited by a screen or
feature task. A task that needs one changed adds a row here and builds
everything else. The owner applies the queue between rounds of work, then the
task that asked for it finishes.

Four queues, because they have different owners and triggers:

## 1. Requests (a prop, token, route, schema field or client method)

| # | from task | file | exact change, and why | status |
|---|-----------|------|-----------------------|--------|
| 1 | MONEY-02 | `src/components/TabIcon.tsx` (or the shared icon UI-01 adds) | Add lucide `scan-face` and `delete` outlines so the PIN keypad uses the shared SVG renderer. Why: no shared icon set existed, so `src/components/pin-sheet/icons.tsx` draws both glyphs from Views; that file is deleted once the shared icons exist. | open |

## 2. Follow-ups in another task's screen

| # | raised by | target file | change needed, and what forced it | status |
|---|-----------|-------------|-----------------------------------|--------|
| 1 | MONEY-02 | `src/components/pin-sheet/PinSheet.tsx`, `Keypad.tsx`, `format.ts` | The PIN sheet adopts UI-02's sheet (scrim, panel, handle, slide in) and UI-01's buttons, link and money formatting when those land, deleting its own frame, `Pressable` keys and `formatNaira`. Forced by: UI-01 and UI-02 were in progress while MONEY-02 was built, so the sheet is built from React Native primitives and `@/theme` inside its own folder. | open |

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
