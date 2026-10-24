---
id: INBOX-14
title: Private communities, hosting, join requests
owner: YOU
area: INBOX
order: 284
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [INBOX-01, INBOX-03, INBOX-05, WALLET-17, UI-02, UI-03, AUTH-06, ME-04, ME-07, INBOX-04, INBOX-24]
decisions: [R-62, R-63, R-47, R-69]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [I30, I31, I37, I32, I33, I34]
---
# INBOX-14 · Private communities, hosting, join requests

## Current state

As of 18 Oct 2026, merging (lead): round 3 accepted and stacked in batch 16.
- **Status:** merging (lead). The verifier's round 2 said NOT merge (HIGH-1 and MEDIUM-2 in the backend, INBOX-24; MEDIUM-3 in the app; report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-14.md`); round 3 closed all three (backend `wmt/PASS-r3` `1fdcf7a`, mobile `6d488574`) and the lead accepted it on a diff read. Stacked in batch 16 by MERGE-16 (backend `wmt/MERGE-16`, mobile `wmt/MERGE-16`); not on main.
- **Merge (MERGE-16):** `src/app/_layout.tsx` lists `community/new`, `community/created/[id]`, `community/pass/[id]` and `community/requests/[id]` in the signed-in group (FIX-63's `route-guard.test.tsx` fails on a route file that is neither listed nor public). `CreateScreen.tsx` and `create.tsx` keep the Community tile beside batch 14's Get verified, products-full and Studio entries. The verifier's lows are SWEEP-INBOX rows INBOX-14 L1, N1 and N2.
- **Branch:** mobile `wmt/INBOX-14` = round 1 `e991fec6` + `origin/wmt/MERGE-13` `4c7b2acd` merged (merge `f58a8608`: both sides of every record kept, contract and generated types taken whole from MERGE-13, PROGRESS regenerated) + round 2 code. Backend: none changed; the stack ran `origin/wmt/MERGE-13` `6bc7b20`. MERGE-13's own `npm run check`: EXIT 0 (255 suites, 4265 tests).
- **Built (round 1):** I30, I31, I37 (`src/features/community-pass/`, `/community/pass/[id]`), I32, I33, I34 (`src/features/community-host/`).
- **Built (round 2):** (1) "Add ₦X" on the short pass sheet and landing, opening W15 with the shortfall; the pass and its price are asked for again when the person comes back. (2) The entries as drawn: A11 "Start your first community" (count of five, ticked when the person hosts a room), M18 "Host a community" (last row of Set up), I1's compose pencil (creators only), the host's "Join requests · N waiting" row in a private room (to I34). (3) The removed state: "Removed by the host" with the Hub's sentence and no Pay; a removed member can still hold an ACTIVE pass (the Hub turns `canBuy` and `canRenew` off), so the screen keys on `canBuy`, not `active`; the room sends them to I30; I34 says "Removed from this room" for such a row.
- **Stack walk** (`inbox14r2_test`, ports 7760-7767, Nuvion stand-in, web export of this branch): host made a private room at N2,000 a month (API; the cover upload needs storage the stack lacks, G-INBOX-14-7). Member: double tap on Join asked for one quote; wrong PIN moved nothing; a lost answer (the Hub took the payment, the phone got nothing) then a retry with the same Idempotency-Key: ONE debit, ONE pass; gets in (I37); renewed early twice (each adds 30 days, passUntil 16 Nov, 16 Dec, 15 Jan). Host removed them: I30 shows "Removed by the host", the Hub refused a new quote and a buy-back with the old quote (409 target_not_payable), balance unchanged; the host's room shows "Join requests, 1 waiting", I34 lists them, Approve lets them back in. A N500 wallet saw "Not enough", "Add N1,500", and W15 opened with "Top up at least N1,500". Hub balance = stand-in after every step (host, member, short wallet).
- **Pictures** (390 px, light and dark, design then built): scratchpad `inbox-14-b/side/<board>-design-then-built-<theme>.png` for I30 (new, PIN, wrong PIN, lost answer, short, removed), I31 (joined, running, renew PIN, renewed), I37 (inside, back in, host row), I32 (empty, private needs a cover), I33, I34 (removed member, empty), A11, M18, I1, W15.
- **Checks:** tsc EXIT 0; eslint on changed files EXIT 0; jest community-pass 13, community-host (new: joinRequests 3), communities (RoomScreen 67, +4 new), creator 16, after-signup, paid-messages entries, inbox: all pass; gates 0 fail 15 warn (none mine), check_tasks EXIT 0; jest on the named suites 30 suites, 501 tests, EXIT 0. I changed A11's tests (a fifth row, "of 5") because the row is the task's.
- **Not run:** V10 (a real Android phone); the cover upload (G-INBOX-14-7); loading and error pictures of I30 to I34. Full jest and `npm run check` (the merge agent).
- **Gaps filed:** G-INBOX-14-6 (no board draws the host's way into I34), G-INBOX-14-7 (cover upload not run); G-INBOX-24-6 updated.
- **Round 3 (17 Oct 2026, Sonnet builder, tier T2):** the verifier's MEDIUM-3 closed. On a "Removed from this room" row I34 draws only "Let back in" (the Approve call); Decline is drawn only on a real request in a room that sells no pass, because the Hub keeps a removed row and Decline did nothing (R-47). Until the room is read no button is drawn; if it cannot be read, Approve alone. Tests: joinRequests 5 (3 fail before the change, all pass after); communities, community-host, community-pass jest 8 suites 172 tests EXIT 0; tsc EXIT 0; eslint on changed files EXIT 0; gates 0 fail. Branch: mobile `wmt/INBOX-14` + one commit on `977efc9a`. The backend half (HIGH-1, MEDIUM-1) is INBOX-24 round 3, backend `wmt/PASS-r3`.
- **Next:** the lead's re-check of round 3 (HIGH-1 and MEDIUM-1 sit in the backend), then the batch.
- **History:** reports go to tasks/history/INBOX-14.md.

## Design v2 update (16 Oct 2026)

- Re-cut by DESIGN-V2-CUT from the owner's 16 Oct answer 19 (R-63) and the 16 Oct boards I30 to I32. Where this section differs from the board bullets below, this section wins.
- I30 is "Private · pay to join": the host's price per month, not a request. I31 is "Joined". I32 asks the host for the price (members pay, the host sets it, 85% to the host). The backend is INBOX-24 (`POST /communities/{id}/pass`, `passUntil` and `canRenew` on `GET /communities/{id}/membership`); this task depends on it.
- A reminder 3 days before the pass ends carries a deep link to the renew tap; renewing asks for the PIN like every wallet payment. There is no automatic debit.
- I34 (join requests) is built only for rooms that already hold pending requests (the Hub lists them); a new private room has no approval step. Default (agent), owner may override.
- I37 reads: text and emoji free, a photo 1 credit (R-62). Order moved from 176 to the DESIGN-V2-CUT block because of the new dependency.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I30 I31 I37 I32 I33 I34` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for I30, I31, I37, I32, I33, I34, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

I32's "You keep 85% of every credit spent in your room" is backed by WALLET-17, which pays hosts their share; this task depends on it. I33's wawu/c/ link is a deep link (V10).

V10 runs on a real Android phone only (DECISIONS R-24).

INBOX-14 removes the open-only filter in `useSuggestedCommunities` (`src/features/communities/useCommunities.ts`) when it builds Ask (I30): INBOX-05 lists only open rooms in I24's Suggested because a private row's only action is Ask (R-47), and with Ask built the private row is drawn as the artboard draws it, with Ask (BACKEND_GAPS G-623).

Native modules: `expo-image-picker` (I32 picture), `expo-clipboard` (I33 Copy link). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **I30 · Private · pay to join** (16 Oct board; the old "ask to join" is replaced, R-63): Private room landing with cover image header, host name, "The host approves every member", avatars "Bisi and 12 people you follow are members", member count, host "Answers requests usually within a day", Pay to join (the host's monthly price, e.g. ₦2,000 a month).
- **I31 · Joined** (replaces "Request sent"): "Request sent. Adaeze will see it in her join requests. We'll let you know when she answers." Waiting for the host, Cancel request.
- **I37 · Approved · inside**: Inside the private room after approval; cover stays as the room header, credit balance, host welcome message, Message · 1 credit.
- **I32 · New community**: New community form: picture, name, what it's for, Open vs Private ("You approve every member. Needs a cover image."), "Free to host. You keep 85% of every credit spent in your room." Creator accounts only.
- **I33 · Created**: "Aba tailors circle is live. Open · you're the host" with share link wawu/c/aba-tailors, Copy, Share link, Open room.
- **I34 · Join requests**: Host queue for a private room: requester name, headline and city, how long ago, Decline / Approve.

## Capability checks

- [ ] **I30**: a user can pay for a 30 day pass from the wallet with the PIN and is in; the price is the host's (R-63). No host approval.
- [ ] **I31**: a user who has joined sees "Joined" with the end date, gets a reminder 3 days before it ends, and can renew with one tap (R-63). Nothing is debited automatically.
- [ ] **I37**: a user can read; send (text and emoji free, a photo 1 credit, R-62).
- [ ] **I32**: a user can add picture; enter name/description; pick Open or Private and, for Private, set the monthly price (R-63); Create community.
- [ ] **I33**: a user can Copy link; Share link; Open room.
- [ ] **I34**: a user can Approve; Decline.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I31.
- [ ] From A11 (AUTH-06), M19 (ME-04), M18 (ME-07) and I1 (INBOX-04), a user can reach I32 to start a community, and from I24 (INBOX-05) tap Join (private) and reach I30 (this task adds them, as drawn).
- [ ] A user who opens wawu/c/aba-tailors on their Android phone lands in that room.

## What the backend serves today (from the analysis)

- **I30**: partial. Missing: No host display name on the community payload (only hostWawuId); no "people you follow who are members" query (FollowRelationship x CommunityMembership); no host approval-time metric. Cover is optional server-side though the board says every private room has one.
- **I31**: partial. Missing: No notification to the requester when the host approves or declines ("We'll let you know" is not backed); no community kind in notification-event.ts.
- **I37**: served. Missing: Room itself is served; the approval is not announced to the member (see I31).
- **I32**: partial. Missing: Create is served. "Needs a cover image" for Private is not enforced (imageUrl optional for both kinds). The host's 85% is computed into CreditSpendEarning but WalletFundingService only funds purchases and answered DMs, so credit-spend earnings never reach the wallet (admin finance service says the whole lifetime figure is outstanding).
- **I33**: partial. Missing: No community slug or short-link route; only a uuid id. A wawu/c/<slug> link needs a unique slug column, generation, and a resolve route.
- **I34**: partial. Missing: Queue and actions are served; payload lacks display name, headline ("Brand designer") and location ("Enugu") shown on the board.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I30: 640 members
- I30: Bisi and 12 people you follow
- I30: Usually within a day
- I37: 48 credits
- I37: 640 members
- I32: Free to host
- I32: You keep 85% of every credit spent in your room
- I33: wawu/c/aba-tailors
- I33: Members pay 1 credit a message
- I34: asked 2h ago

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-14.md](history/INBOX-14.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
