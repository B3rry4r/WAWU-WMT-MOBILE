---
id: INBOX-14
title: Private communities, hosting, join requests
owner: YOU
area: INBOX
order: 284
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [INBOX-01, INBOX-03, INBOX-05, WALLET-17, UI-02, UI-03, AUTH-06, ME-04, ME-07, INBOX-04, INBOX-24]
decisions: [R-62, R-63, R-47, R-69]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [I30, I31, I37, I32, I33, I34]
---
# INBOX-14 · Private communities, hosting, join requests

## Current state

As of 17 Oct 2026, part built (Sonnet builder, tier T2); status `building`.
- **Branch:** mobile `wmt/INBOX-14` on `origin/wmt/MERGE-11` `47555987` with `origin/wmt/ME-07` `5f002bde` and `origin/wmt/INBOX-24` `3642ebda` merged (both sides of every record kept). Backend: none changed; read from `wmt/INBOX-24` `28cea21`, round 2 `0116060` changes no contract line.
- **Built:** I30 and I31 (`src/features/community-pass/`, `/community/pass/[id]`): the host's price, the Hub's quote with the bank charge and the total, a fresh quote per tap, the PIN, one Idempotency-Key per attempt, a lost answer then a retry, Renew early, a pass that ended, the host, a member the host removed (the Hub's sentence, no Pay), no wallet, a short wallet (no Add, WALLET-05 is not built). I37 (the private room keeps its picture as the header, `CoverHeader`). I32 (`/community/new`: a private room is never sent without a price, the Hub judges the bounds), I33 (`/community/created/[id]`: link, Copy, Share link, Open room), I34 (`/community/requests/[id]`, only for a room that holds requests). Entries added: I24 Join on a private row, a private room a person is not in, the reminder's push route, Create's Community tile.
- **Checks:** `tsc` EXIT 0; eslint on 28 changed files EXIT 0; jest community-pass 12, community-host 11, communities 148 (incl. RoomScreen 63), create 45, push routes: all pass; gates 0 fail, 9 warn (none mine), baseline passes.
- **NOT RUN:** the test stack `inbox14_test` and the pictures at 390 px (light, dark, every state); V10 (a real Android phone). The full jest suite and `npm run check` (the merge agent).
- **Not built yet (R-47, each is a row to add):** the entries to I32 from A11 "Start your first community" (and its count of five), M18 "Host a community", and I1's compose pencil; the host's way to I34 from a private room that holds requests; the "new community" copy for the Inbox. The contract must be regenerated (`npm run api`) once INBOX-24 merges (SHARED-CHANGES INBOX-14 #1).
- **Next:** a builder with budget: the four entries above, the stack run with the Hub balance read after each case, the pictures; then a verifier.
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
