---
id: INBOX-18
title: Answer paid questions (creator)
owner: YOU
area: INBOX
order: 171
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [INBOX-04, INBOX-08, INBOX-12, INBOX-17, WALLET-16, UI-02, ME-14, INBOX-19]
decisions: [R-11, R-13]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I9, I10, I11]
---
# INBOX-18 · Answer paid questions (creator)

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 15.
- **Status:** merging (lead). Verdict: PASS with one medium (F1: duplicate reply bubbles from concurrent posts and a retry; no money defect), fixed in round 2 (backend 3381b7c: an optional Idempotency-Key on the reply route and the table DmReplyKey, migration 20261025190000_dm_reply_key; mobile 52d082e6) and re-verified PASS with 4 and 8 concurrent posts on one key; F2 closed with it; 5 lows left (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-18.md`). Stacked in batch 15 by MERGE-15 (backend `wmt/MERGE-15`, mobile `wmt/MERGE-15`); not on main. Built: Built by a Sonnet builder (T2). Mobile `wmt/INBOX-18` on `origin/wmt/MERGE-12` `c840ed6d` with `origin/wmt/ME-14` `b44da0be` merged (conflicts kept both sides: BACKEND_GAPS, SHARED-CHANGES, `me.tsx`, `MeScreen`, `MeMenuSheet`; PROGRESS regenerated). Backend `wmt/INBOX-18` `5dc9fa3` (round 2: `3381b7c`) on `origin/wmt/MERGE-12` `98efeef`. Round 2 (F1) adds one migration, see the Round 2 line. Not merged.
- **Backend (additive):** `PaidDmQuestion.creatorEarning` (creator reads only: the hold's payee share, its percent, `pending | on_its_way | waiting_for_wallet | in_wallet`; null for the asker, a refunded or an older Flutterwave question) and `GET /paid-dm/waiting` (count and kobo over every waiting question). The wallet side registers its answer through `DmCreatorEarningHooks`, so the direct-message module imports nothing new. Spec on the Nuvion stand-in, 4 tests; INBOX-08, INBOX-17 and settings specs still pass (64).
- **App:** `src/features/paid-answers/` and `src/app/paid-questions/[wawuId].tsx`. I9 is the creator's Paid DMs chip view (the Hub's totals, rows soonest first, pill red under 2 hours); I10 and I11 are one thread screen (the card under each question is the Hub's words: the share and its percent while open, then where the share is). Message on an answered thread opens the free chat (I12). Entries (SHARED-CHANGES INBOX-18 #1 to #4): the Paid DMs chip (creators only), the paid row in All, "Reply" on M31.
- **Truth over the brief's words (R-55):** I11 says "in your wallet" only when the Hub says the share landed; before, "on its way to your wallet / Earnings reach your wallet once a day" (W39's words); with no wallet, "waiting for you / It lands when you open your wallet". The refund line reads "gets their" (G-INBOX-18-4).
- **Stack inbox18_test (backend `5dc9fa3` on the Nuvion stand-in, ports 7850 to 7857, taken down):** a fan paid, the creator answered with a DOUBLE TAP on Reply: one DmReply row, one earning; the share landed in the creator's move 15 s later and the Hub balance equalled the stand-in (5,000,000 to 5,127,500). A reply sent after the window: the Hub refused it in its own words, the field kept the text, no reply row, the thread said the time ran out, and the fan was repaid every naira (4,850,000 to 5,000,000, Hub = stand-in). Empty inbox and a failed read with Try again were entered on the real web export. Pictures at 390 px, light and dark, board beside build, every state: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/inbox-18-b/pics/` (`beside-<board>-<theme>.png` for I9, I10, I11, I1; the others stand alone).
- **Checks:** mobile tsc 0, eslint 0 on changed files, 16 new tests + 11 model + 3 Reply (30 new), inbox, chat inbox, notifications and paid-messages suites 196 passed, gates 0 fail (15 warn, none new). Backend tsc 0, gates 0 fail, 4 new + 64 existing specs. NOT RUN: full suites (CI), Fintava (never), a verifier.
- **Differs, for a reason:** no status bar or home indicator (web build); "+" and "..." in the header and composer not drawn (G-INBOX-18-2, -3); the compose button on I9's header is not built; seeded people all read "Ada Seeded", so the pictures' names differ from the board's; the board draws the typed reply in the composer (the picture `I10-typed` shows it).
- **Open:** G-INBOX-18-1 to -5 and -7 (badge counts both sides, pronoun, push target, older questions have no share); G-INBOX-18-6 (no Idempotency-Key on replies) is closed by round 2. Contract carries `GET /search/people` from ME-14's side (backend `wmt/EXPLORE-02`, not in `98efeef`).
- **Round 2 (F1 medium, 17 Oct 2026, Sonnet builder, T2):** `POST /paid-dm/questions/{id}/replies` takes an OPTIONAL `Idempotency-Key` (8 to 128 of `A-Za-z0-9_-`; bad value 400). Per creator and key one bubble: the unique index of the new table `DmReplyKey` decides a race (same shape as `CommunityMessageKey`); a repeat, or a second request at the same moment, answers 201 with the question as it stands and `Idempotent-Replayed: true`, stores and releases nothing; the same key for other words or another question is 409 `idempotency_key_reused` (the convention's code and status, not 422). No header: as before. App: one key per reply attempt (`attempt` ref in `PaidThreadScreen`), kept across a retry of the same words, new for other words, cleared once the Hub took it; the read-back after a lost answer now matches a NEW reply id with the same words (the Hub's id), and `SAME_TAP_MS` is gone (F2). Specs: backend 12 new (two taps and a retry, four taps across two servers, an answered question, other words or question 409, bad header 400, a refused request keeps the key free, no key as before, cascade) plus 3 new app tests; protected suite 253 of 253; paid-dm and direct-message specs, gates, tsc, eslint, `contract:build` green. Backend `3381b7c`, migration `20261025190000_dm_reply_key` (stamp is the builder's; the lead renames at merge). SHARED-CHANGES INBOX-18 #5.
- **Next:** the batch 15 pull request (the lead). The verifier's lows are in SWEEP-INBOX (INBOX-18 F3, F4, F7, F8, F9).

Status set to review by the records sync, 25 Oct 2026: merged as app 586b8492, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I9 I10 I11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I10, I11 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I9 · Paid DMs · to answer**: Creator view of the Paid DMs chip: "Waiting on your reply ₦4,500 from 3 questions", rows sorted by time left with price and countdown, red under 2 hours, Settings link.
- **I10 · Reply**: Creator thread with the fan question, "Reply in 1h 12m to earn ₦1,275. That's 85% of ₦1,500. Miss it and Bisi gets her ₦1,500 back." (BRIEF I10) and a reply composer.
- **I11 · Answered**: Answered thread: "₦1,275 is in your wallet. Replied in 49 minutes." (for a creator without a wallet yet: "... it lands when you open your wallet"; R-11, BRIEF I11)

## Brief changes (build these, not the canvas)

- **I10**: "That's 85% of ₦1,500. Miss it and Bisi gets her ₦1,500 back." No "full amount". (Why: rule 6.)
- **I11**: "₦1,275 is in your wallet. Replied in 49 minutes." (for a creator without a wallet yet: "... it lands when you open your wallet"). The arrow becomes "Earnings show in W39". (Why: R-11. Earnings land in the wallet by themselves.)

## Capability checks

- [ ] **I9**: a creator sees questions sorted by time left with the total waiting; can tap a question (I10) and open Settings (I21).
- [ ] **I10**: a user can type reply; Reply.
- [ ] **I11**: a creator sees "₦1,275 is in your wallet" (or that it lands when they open one) and can tap Message to continue in the free chat (I12).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From I1's paid DM row (creator) and Paid DMs chip (INBOX-04), and from Reply on M31 (ME-14), a creator can reach I9 or I10 (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **I9**: partial. Missing: No status filter, no deadline ordering, no pending-total aggregate; client would have to page through everything. Add ?status=awaiting_response&sort=deadline and a total.
- **I10**: served.
- **I11**: partial. Missing: Backend moves the share into the wallet automatically; the canvas says the creator moves it from Earnings (W39). R-11 settles it: earnings land in the wallet, and I11's copy follows the brief. "Message" after answering opens the free chat (I12, R-13).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I9: ₦4,500 from 3 questions
- I9: ₦1,500 each
- I9: 1h 12m / 9h 04m / 21h 40m left
- I9: red under 2 hours
- I10: earn ₦1,275
- I10: 85% of ₦1,500
- I10: 1h 12m left
- I11: ₦1,275 added to your earnings
- I11: Replied in 49 minutes

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-18.md](history/INBOX-18.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
