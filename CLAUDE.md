# Who Made This: the mobile app

Who Made This is a Nigerian creator marketplace with a Fintava wallet (built
by WAWU; the app's name and logo carry no WAWU since R-37). Repo and package
ids keep `wawu-wmt`. Expo SDK 57, Expo Router, TypeScript. **The mobile app
is the product**: the backend (`wawu-backend`, `wawu-id`) changes to fit it,
and the web (`wawuafrica`) follows it later.

## Start here

You were given a task: `tasks/<ID>.md`. Open it and read what it lists under
**Read first**. Whoever owns a feature owns its screens AND its backend. Always read `docs/WORKFLOW.md` and your role file
(`docs/roles/BUILDER.md`, `VERIFIER.md` or `AUDITOR.md`). If no task was named,
ask for one; don't pick work yourself.

## Rules that are never broken

1. The builder never verifies their own task. The verifier never fixes.
2. Every task is small, and nobody starts one before its `depends_on` tasks
   are built and verified (`review` or `done`; the owner's sign-off happens at
   merge and never blocks the next task). `npm run tasks` enforces the rules.
3. A check passes by exit code, never by opinion. `npm run check` must exit 0.
4. Screens are compared picture against picture:
   `python3 scripts/design/render_design.py <ID>` beside a screenshot.
5. Checks are written as "a user can ...", never "the screen renders".
6. The live product keeps working: backend changes are additive until the old
   path has no callers.
7. The design decides the UI, never the facts. Fees, prices, rates and legal
   text come from the system, the docs or the owner; never invent one. Any
   other question with a sensible default is decided, recorded in the task
   file and the work carries on (`docs/WORKFLOW.md` section 10 lists the few
   real stops).
8. Every blocker names the fact that unblocks it. Adding something also
   removes what it replaces.
9. Report what ran and what didn't. NOT RUN is a valid result; leaving it out
   is not. The task file on the branch IS the report (its Current state, and
   the rounds in `tasks/history/<ID>.md`): NOT RUN items, owner
   questions and findings go there and nowhere else. Never address the owner
   in chat or in a hand-back; the lead reads every branch and carries owner
   asks to the progress page.

## Owner hard rules (owner, 30 Oct 2026: "never break them. Never.")

These came from real failures: a wallet that went blank on the owner's phone, uploads
that failed only on phones, bill tiles and a card row no design drew, a ruling half
carried out, causes guessed instead of checked. They outrank speed, every brief, and
any "do it fast".

1. **Pictures or nothing ships.** Every screen a task touches gets a screenshot (390 px,
   dark and light) beside its artboard, and a pay screen gets every drawn state. A
   verifier whose pictures are NOT RUN hands back FIX, never MERGE. Nothing is drawn
   that is not built and live (R-47).
2. **Phone paths are tested as a phone.** Photo, file and camera picks, uploads and
   FormData, scrolling and gestures, the Android back button, the keyboard, permissions
   and offline are proven in jest on the native platform (`Platform.OS` android) with
   the real handlers. What only a real phone can prove is listed in the task file as
   PHONE CHECK and goes to the owner before the update, never after.
3. **Every ruling ends with proof.** A ruling is done only when a grep of the code and a
   screenshot show it carried out everywhere ("card off" means no card entry anywhere).
4. **The live system first.** A cause told to the owner was checked on the real system
   (Hub, provider, store, server), never guessed.
5. **Batches, not drip fixes.** Fixes ship in batches: `npm run check` on the batch head,
   then a full user walk, then the over-the-air update.
6. **A full walk before every build.** No TestFlight or Play build starts until a fresh
   walk of the whole app as users, with the phone-gap analysis, passes on that code.
7. **One code line.** The branch the phones run is merged back into main after every
   batch.
8. **Research covers the whole source.** A provider study lists everything the source
   offers, not only what the design draws; the owner's own files come first.
9. **The tiered workflow in full** (`docs/WORKFLOW.md`: tiers, bundles, verifier passes
   per tier, at most two rounds, batches, the full check per batch). When a rule and
   speed conflict, the rule wins and the owner is told the time it costs.
10. **The owner's status page is always current.** After every change that matters to
    the owner (built, checked, merged, shipped, deployed, a ruling, a blocker, an owner
    item), the lead republishes the App Status page in the same turn, before telling him.

## Code

- Colours, spacing, radii and type come from `@/theme` (generated from
  `design/_ds/wawu/tokens`). Never a literal. Fonts by family: `font(600)`.
- API calls go through `@/api/client` with types generated from the backend
  contract (`npm run api`). Never hand-write a response type.
- Shared files are fenced (`docs/WORKFLOW.md` section 4): request changes in
  `SHARED-CHANGES.md`.
- The app is "Who Made This" (R-37). Its logo is drawn only with
  `<BrandMark>`; the canvas's WAWU logo images are never used.
- Show only what is built (R-47): an entry whose screen is not built yet is not drawn; the task that
  builds that screen adds it, as drawn.
- No em-dashes in anything a user reads. No "Flutterwave" in the app. Links
  are written `wawu/...`. WAWU Credits are a count, never naira.
- Never `git stash`, `git reset --hard`, `git checkout -- .`, or force-push.
- Expo changes every SDK: read `docs/EXPO-AGENTS.md` and the SDK 57 docs, not
  memory. Install packages with `npx expo install`.

## Commands

```
npm run check      typecheck, lint, tests, gates, task check (must exit 0)
npm run web        run in the browser
npm run tokens     regenerate the theme from the design tokens
npm run api -- --backend ../wawu-backend   copy the backend main contract and regenerate API types
npm run tasks      check task files (add -- --write to refresh tasks/INDEX.md)
python3 scripts/design/render_design.py <IDs>    render artboards to build/design_shots/
```

## Where things are

| | |
|---|---|
| `docs/PROGRESS.md` | Where everything stands (generated) and the latest work |
| `docs/LOG.md` | One line per thing done, newest first |
| `docs/WORKFLOW.md` | How every task is built and verified |
| `docs/PLAN.md` | Who owns what, how the lists work, what's needed from outside |
| `docs/BUILDS.md` | Builds, testers, store releases (owner submits) |
| `docs/people/` | One file per person: what they own end to end |
| `DECISIONS.md` | Rulings, what is not built, and what is still open |
| `tasks/` | One file per task; `tasks/INDEX.md` lists them |
| `design/` | The canvas (authoritative for UI) and `canvas-inventory.json` |
| `BACKEND_GAPS.md` | What screens need that the backend doesn't serve |
| `SHARED-CHANGES.md` | Requested changes to fenced files |
| `docs/analysis/` | The analysis behind the backlog |
