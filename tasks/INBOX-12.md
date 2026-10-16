---
id: INBOX-12
title: Paid message settings, warning, switched off
owner: YOU
area: INBOX
order: 65
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [INBOX-09, UI-02, INBOX-04, PROS-03]
decisions: [R-13, R-2, R-9]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I21, I22, I23]
---
# INBOX-12 · Paid message settings, warning, switched off

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-12.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/GATES-01` (this branch contains it); API types regenerated from backend `wmt/INBOX-12` (38d97dd).
- **Backend (done):** `GET` and `PUT /paid-dm/settings` (creator only): switch, price in kobo, reply hours, the share and what the creator keeps, the next preset to raise to, the options (price bounds, presets, reply times, from config), and the INBOX-09 standing with the missed and total counts. A save is refused with 403 `paid_messages_paused` while paid messages are off. The live `PATCH /creator/dm-settings` is untouched. Round 2: `PUT` refuses `null` for every field with a 400 (absent still keeps the saved value), and `GET /paid-dm/settings/earn?priceKobo=` (creator only, read only) returns what a creator keeps at a typed price. Round 1 GitHub run 38900290377: all three suites, protected routes, contract and baseline green; gates show main's 16 FAIL lines plus one new PROVISIONAL warn (G-722).
- **App (done):** `src/features/paid-messages/` (screen, parts, model, api), route `src/app/paid-message-settings.tsx`. I21, I22 and I23 are one screen in three moments picked by the Hub's standing. Loading, error, a plain account (the creator gate) and the empty creator (switch off, empty price) are built and entered by their real causes. Round 2: "You earn per message" is the Hub's figure (the saved price from the settings read, a typed one from the earn route after the typing rests, a dash until the Hub has answered); the screen no longer multiplies or divides money (R-21).
- **Entries (R-41, done):** I1 settings button in the Inbox header (creators only), M2 paid messages row (chevron and press), P8 "Inbox settings" link in the note.
- **Checks:** backend tsc 0, new spec 21 passed, money-contract spec passed (a `*Kobo` field must be integer: fixed in round one). Mobile: new tests 37 passed (model 13, screen 17, entries 7); the touched features' tests pass. Pictures at 390 px, light and dark, design beside build, from a web export through the stack: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/inbox12/shots/pair-I2{1,2,3}-{dark,light}.png`, with a real save round trip (`I21-saved-dark.png`, the Hub row read back) and the Inbox and Services entries pressed in the browser.
- **Differs, for a reason:** no status bar or home indicator (web build). The canvas draws the price field focused (ring and caret) on I21 and I22; the build focuses it on tap. The warning's body wraps one word earlier in the canvas (its font renders about 2% wider); the label-to-field gap is about 2 px more here (label line height).
- **Changed on purpose:** `src/features/me/__tests__/listingsEntryReal.test.tsx` T2 said the paid messages row has no chevron and is not a button, which was the state before this task; it now says the opposite and T3 presses it (SHARED-CHANGES INBOX-12 #2).
- **Open, for the owner (via the lead):** G-722 the presets and reply times (the design's and the web's, in config) until ruled; G-723 the web's live `PATCH /creator/dm-settings` still lets a paused creator switch on (sends stay refused).
- **History:** none yet. Reports go to tasks/history/INBOX-12.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 3 (the earn route takes JS-Number spellings, a failed earn read is retried once, a note on the R-21 helpers kept); the round 1 reply-time row is in the sweep file already. They are in tasks/SWEEP-INBOX.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py I21 I22 I23` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I21, I22, I23 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I21 · Settings**: Paid messages settings: toggle ("On · ₦1,500 a message", BRIEF I21), price per message with presets, reply window, "You earn per message ₦1,275 · Your share 85%", "Unanswered, last 30 days 4%", Save.
- **I22 · Warning**: Settings in the "warned" state: "You missed 4 of your last 18. Past 30% and paid messages switch off for 7 days." with Raise to ₦2,500. Board says the state triggers over 20% unanswered.
- **I23 · Switched off for 7 days**: Settings locked: "Paid messages are off for 7 days. Back on 3 October." toggle locked until the date; publishing, communities and tips keep working (BRIEF I23).

## Brief changes (build these, not the canvas)

- **I21**: "On · ₦1,500 a message". Fans pay the price plus Fintava's charge, so the line names the price, not what fans pay. (Why: R-10 and the purchases default.)
- **I22**: "₦1,500 a message", as I21. (Why: as I21.)
- **I23**: "Back on 3 October. Publishing, communities and tips all keep working." (Why: R-2 and R-9.)

## Capability checks

- [ ] **I21**: a user can toggle on/off; pick price preset or type; pick reply window; Save.
- [ ] **I22**: a user can Raise to ₦2,500; Save.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I22, I23.
- [ ] From I1 (INBOX-04) a creator can tap paid-message settings, and from P8 (PROS-03) a professional can tap Inbox settings, and reach I21 (this task adds both, as drawn).

## What the backend serves today (from the analysis)

- **I21**: partial. Missing: Settings write is served. The unanswered rate is never computed: CreatorNoResponseTrackerService only upserts a zero row on read, and no cron or sweep writes noResponseRatePct.
- **I22**: partial. Missing: Nothing ever sets warned (no writer of CreatorNoResponseTracker). "Missed 4 of last 18" counts are not returned (only a percent). No warning notification kind.
- **I23**: partial. Missing: Nothing writes disabled_7d; PATCH /creator/dm-settings does not refuse turning DMs back on during a lock; sendInit does not enforce dmDisabledUntil.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I21: lowest ₦50
- I21: presets ₦100, ₦500, ₦1,000, ₦2,500
- I21: 24 hours / 2 days / 3 days / 1 week
- I21: You earn per message ₦1,275
- I21: Your share 85%
- I21: Unanswered, last 30 days 4%
- I22: over 20% unanswered
- I22: You missed 4 of your last 18
- I22: Past 30% ... switch off for 7 days
- I22: Unanswered 22%
- I22: Raise to ₦2,500
- I23: off for 7 days
- I23: Back on 3 October
- I23: Unanswered 34%

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-12.md](history/INBOX-12.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
