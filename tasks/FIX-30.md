---
id: FIX-30
title: FIX-29 follow-ups: the Inbox blank body, the ticket picker without a buy button, the R-46 wording
owner: YOU
area: FIX
order: 244
priority: launch
repo: wawu-wmt-mobile
type: component
status: building
depends_on: [FIX-29]
decisions: [R-47]
passes: [V1, V5, V6]
artboards: [I1, E2]
---
# FIX-30 · FIX-29 follow-ups: the Inbox blank body, the ticket picker without a buy button, the R-46 wording

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-47; `tasks/FIX-29.md` (the verifier's findings 1, 3 and 5)

## Goal

Close what the FIX-29 verifier found outside FIX-29's diff, so the app shows only what is built and never a blank
screen.

## Scope

- Inbox (I1): when the Hub serves rows but none has a renderer yet, the tab draws its designed empty state, and the
  tab badge counts only rows that are drawn (`InboxScreen.tsx` filters at line 48; the empty state draws only on zero
  rows at line 85).
- Event detail (E2): the ticket quantity picker and its running total are not drawn until EVENTS-06 (buy a ticket)
  is done (R-47: a picker that leads nowhere); the event's price lines stay.
- The `unbuilt_entries` gate's docstring, `scripts/gates/tests/*` and `src/lib/unbuilt.ts` say R-47, not R-46.

## Capability checks

- [ ] Rows with no renderer: the Inbox shows its empty state and the badge shows no count.
- [ ] E2 shows no picker or total while EVENTS-06 is not done; the gate or a test fails if one comes back early.
- [ ] No R-46 wording left in the gate, its tests or `src/lib/unbuilt.ts`.

## Builder report

Branch `wmt/FIX-30`, built on main `26d7454`, merged with main `5de924a` (DECISIONS.md only, clean). Mobile only: no backend change, no package change, no fenced file edited except the three gate files the task names (docstrings and comments, no behaviour). The `unbuilt_entries` gate lists nothing and `python3 -m unittest discover -s scripts/gates/tests` is 44 of 44.

**Built**
- **Inbox (I1).** `InboxScreen.tsx` draws the designed empty state ("No messages yet") when no row is drawable, not only when the Hub served none. The badge no longer shows the Hub's `total`: `unread.ts` sets it to `drawnUnread(...)` (`rows.tsx`), the sum of `chats`, `paidDms` and `communities` for the kinds that have a renderer, so it is 0 today and grows by itself when INBOX-05, -10, -18 or -19 add a renderer. When some kind is drawn but the pages read so far hold none of it, the screen reads on (loading list shown, never the empty state) until one is found or the pages end; with no kind drawn nothing is read ahead, as before. A failed read-on shows the error with one Try again (the footer retry is not drawn under it).
- **Event detail (E2).** `EventDetailScreen.tsx` no longer draws the quantity steppers, the "N tickets" count or the running total bar, and the basket state is gone from it. `TicketRow` draws the name, the "N left" or "Ended 8 Oct" line, the price (or Free) and, for a tier that cannot be bought, its pill. The stepper is split out as `TicketStepper.tsx`, drawn nowhere and pinned alone by `ticketStepper.test.tsx` (the `CreateButton` precedent); the basket helpers in `format.ts` and their tests stay. E9's disabled "Sold out" bar stays (see decisions). `tasks/EVENTS-06.md` has a new capability check so the task that builds Get tickets also draws the steppers and the total again, as drawn.
- **R-47 wording.** The `unbuilt_entries` docstring, `test_unbuilt_entries.py`, `test_dead_controls.py` and `src/lib/unbuilt.ts` say R-47: the helper and gate are kept, unused, and still list any call. `grep -rn "R-46" src scripts` finds nothing.

**Capability checks**
- Rows with no renderer: the Inbox shows its empty state and the badge shows no count. Tests (`InboxScreen.test.tsx`: rows all of a kind with no renderer show `inbox-empty` and the guidance; `unread.test.tsx`: a user whose unread rows are of a kind nobody draws sees no badge, and a drawn kind counts its own unread and not the Hub total; `rows.test.ts`). Live: real Hub (backend main `7b4ffef`, wawu-id `fb8717e`, real sign-in), user with 4 rows served (`GET /inbox` kinds chat, community, paid_dm; `GET /inbox/unread` total 4): the tab shows "No messages yet" and no badge (`pw-inbox.json`: `badgeCount` 0, `inboxEmpty` 1).
- E2 shows no picker or total while EVENTS-06 is not done; a test fails if one comes back early: `eventsScreens.test.tsx` "shows each open tier with its price, and no stepper or running total while EVENTS-06 is not built (R-47)" (no `step-plus`, `step-minus`, `More/Fewer ... tickets`, count, `event-total`, `event-total-amount`, "N tickets" text). Mutants M1 (stepper back in the row) and M2 (total bar back) are killed by it. Live: `pw-events.json`, 4 events by 2 themes, `stepPlus`, `stepMinus` and `total` all 0.
- No R-46 wording left in the gate, its tests or `src/lib/unbuilt.ts`: the grep above. `docs/roles/VERIFIER.md` line 67 and older task files still say R-46; they are not in this task's list and were left (a one-line reword for the lead).

**Tests changed (each asserted the behaviour the task removes)**: `InboxScreen.test.tsx` ("draws nothing for a kind ... and does not call the inbox empty" now asserts the empty state; 5 new tests for mixed pages, reading on, the loading list while reading on, the empty end and the failed read-on); `unread.test.tsx` (each test now draws the `chat` kind through the registry and removes it after, so none depends on what the app draws today; 2 new); `eventsScreens.test.tsx` (the stepper test is now the "no stepper or total" test, "cannot take more than is left" moved to `ticketStepper.test.tsx`, the Free tier and T2 tests assert prices and no total); new `rows.test.ts` and `ticketStepper.test.tsx`.

**Mutants of my own** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix30/mutants.py`, `mutants.log`): 8 applied, 8 killed, each file restored from a copy and compared. M1 stepper back in the row, M2 total bar back, M3 empty state only when the Hub served no row, M4 badge shows the Hub total, M5 no read-on, M6 badge counts communities with none drawn, M7 footer retry under the error, M8 empty state while reading on. M8 first survived; the "loading list while reading on" test was added and kills it.

**Pictures** (V5, V6): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix30/sheets/` (contact sheets, artboard beside the built screen: `inbox-undrawn-<theme>`, `e2-paid-<theme>`, `e9-soldout-<theme>`; states: `inbox-states-<theme>` (none, loading, offline), `e2-other-<theme>` (free tier, one tier, tickets failed)) and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix30/shots/` (each screen, 390 px at 2x, light and dark). Web export (`npx expo export -p web`, private TMPDIR, bundle grepped: only `localhost:6151` and `localhost:6152`) in Chromium from `/opt/pw-browsers`, against a real local Hub and WAWU ID on ports 6151 and 6152 (0 requests left the machine: `pw-*.json` `outside` is empty). Causes: undrawn rows = a chat and a community room made through the real routes (`POST /chats`, `POST /communities`, join, messages) plus the seed's paid thread; empty = a seeded account with nothing; loading = the browser holds the Hub's answer; offline and tickets failed = the browser refuses the request. Events were made through `POST /events` and `PUT /events/:id/tickets` as the seeded creator; the creator tick, the `published` status and the sold-out count were set in the local database (the admin approval and the payment are other tasks'). The artboard I1 draws rows, a filter button and a compose button that other tasks build (INBOX-05, -10, -18, -19); E2's artboard draws Get tickets, the steppers and the total (EVENTS-06): those are the only differences, by R-47.

**Checks**: `npm run check` EXIT 0 as one command, on the branch with main `5de924a` merged (log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix30/check1.log`, last line `EXIT 0`): typecheck 0, lint 0 errors and 7 warnings (the same 7 as before, none in a file this task wrote), jest 120 suites and 2018 tests all passed (the base was 114 suites and 1899 tests at FIX-29; this run adds the new files and tests), gates 10 run, 472 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), baseline 0, `unbuilt_entries` lists nothing, 273 tasks. No load flake in that run; the two seen earlier are under Flakes. Secret scan of the diff (key-shaped strings, `sk_`, `FLWSECK`, bearer tokens, private-key headers): none; no em-dash in anything a user reads.

**Decisions (Default (agent), owner may override)**
- The badge adds the Hub's per-kind counts for the kinds that are drawn instead of hiding the number only when nothing is drawn: it stays right when one kind (chats) is built before the others.
- No new copy: the empty state is I35's existing words, the same for "the Hub served none" and "none can be drawn".
- Reading on past pages of undrawn rows happens only when some kind is drawn (otherwise a page that adds nothing is not worth a request, as the screen already said).
- `TicketStepper` and the basket helpers are kept, unused, rather than deleted, so EVENTS-06 draws back what EVENTS-01 built and tested; the `EVENTS-06` capability check says so.
- E9's disabled "Sold out" button stays: it states a fact (every tier has sold) and is not a picker or a total, which are what the task names. If the owner reads it as an entry for the buy button, it goes with the steppers and EVENTS-06 draws it back.
- E21's price line ("A creator or professional tick, N a year", FIX-29 verifier finding 3, first half) is not touched: the task names only E2.

**FIX-29 verifier findings**: 1 (Inbox blank body) and 5 (R-46 wording) closed here; 3, second half (E2 picker) closed here, first half (E21 price line) left for the owner as above; 2 (`WalletBar` height) and 4 (`BalanceCard` test gap) are not in this task.

**Flakes seen** (load average 12 to 18 on a shared machine): `eventsScreens.test.tsx` "a user sees when a tier ended and when one opens in the event's zone (D8)" failed once in a combined run (it reads the tier lines before the tickets answer) and `eventsFocus.test.tsx` failed once; each passed alone on the next run.

**BACKEND_GAPS and SHARED-CHANGES rows**: none (mobile only; `scripts/gates/**` edits are docstrings in the three files the ticket names).

**NOT RUN**: a phone or the tester build (V10); the verifier's picture-against-artboard decision and the V-passes; the dark and light pictures at widths other than 390 px (no layout changed; the E2 and Inbox bodies use the same components); creating events through the host wizard and the admin approval (both belong to other tasks; the Hub rows were made by the routes above and the local database); `EVENTS-06`, `INBOX-05`, `-10`, `-18`, `-19` when they land (each must draw its parts back, as drawn, and rewrite the tests that pin their absence).

## Verifier report

Verifier session (Sonnet), independent of the builder. Mobile `origin/wmt/FIX-30` `80319b1` in a detached worktree. Origin main is `5de924a` and is an ancestor of the branch (the builder merged it), so the trial merge of main into the branch is a no-op: 0 conflicts. **Verdict: every capability check passes; one defect, medium and latent (finding 1, the Inbox read-on can stall on the loading list when a refresh lands during it; it cannot be reached in the shipped app until a renderer exists). Status `building` for that fix.** Product code was not changed.

How it was checked: a web export of this head (`npx expo export -p web`, own `TMPDIR`, own Metro cache; the bundle holds only `localhost:6151` and `localhost:6152`) in Chromium from `/opt/pw-browsers`, against a **real local Hub built from backend origin/main `7b4ffef`** (port 6151, database `vf30_hub_test`) and **wawu-id `fb8717e`** (port 6152), real sign-in with the seeded accounts, 0 requests left the machine (`outside` empty in every run). The Hub rows came from the real routes (`POST /chats`, messages, `POST /communities`, join, `POST /events`, `PUT /events/:id/tickets`); the creator tick, the `published` status and the sold-out counts were set in the local database (admin approval and payment are other tasks'). The read-on can only run when some kind has a renderer, and none has today, so for those states a second export came from a throwaway worktree whose only change was a plain-text `chat` renderer in `rows.tsx` (never committed; the worktree is removed). Scripts and logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/` (`pw1.py` to `pw10.py`, `pw*.json`, `mutants.py`, `mutants.log`).

| Pass | Result | Evidence |
|---|---|---|
| V1 every control does something | passed for what this task touches | the E9 "Sold out" bar is disabled (`aria-disabled`, `tabindex -1`) and pressing it sends no request and does not move (`pw2b.py`); Try again on the Inbox read-on error reads on and ends in the row (`pw3.json`); E2 has no control left but back, share and Going, which this task did not touch |
| V5 Picture | passed, with the recorded differences | I1, E2, E9 beside the built screens, 390 px, light and dark: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/sheets/inbox-undrawn-<theme>.png`, `e2-<theme>.png`, `e9-<theme>.png`, `read-on-<theme>.png`; single shots in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/shots/`, artboards in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/artboards/`. The only differences from the artboards are the parts other tasks build (I1's rows, filter and compose buttons, the Paid DMs, Communities and Money chips; E2's steppers, total and Get tickets), as R-47 says |
| V6 States | passed for the states below; one defect (finding 1) | each entered by its real cause, see the table |

### Capability checks and items, each entered by its real cause

| Item | Result | How it was entered, what was seen |
|---|---|---|
| I1: rows served, none drawn, give the designed empty state, never a blank body | CONFIRMED | `user@`: the Hub served 5 rows (kinds chat, community, paid_dm; `GET /inbox/unread` `{total 7, chats 4, paidDms 0, communities 3}`): the tab shows "No messages yet" and its guidance, `inbox-empty` 1, `inbox-loading` 0, `inbox-error` 0, light and dark (`pw1.json`). `creator-basic@`: 46 rows served over 3 pages (20 communities and a next cursor on page 1): the same empty state, and no request with a cursor in 6 s (no read-ahead while nothing is drawn). An account the Hub serves nothing: the same empty state (`pw10.py`) |
| The badge counts only drawn kinds | CONFIRMED, and the per-kind sum is right | with the Hub saying 7 unread, the tab badge is absent on Home and on Inbox, light and dark. Backend `src/inbox/inbox.service.ts` `unread()` returns `total = chats + paidDms + communities` over the same feed as `GET /inbox`, so adding the drawn kinds is exactly the Hub's own count of the rows that can be drawn, and with all three drawn it equals `total` (`rows.test.ts` pins it). Live with the stand-in `chat` renderer: Hub total 7, chats 4, badge 4 (`pw6.py`); `creator-basic@` chats 1, badge 1. `refreshInbox` is the only writer of the badge, so no path bypasses `drawnUnread` |
| Read-on, a kind is drawn: it finds the row | CONFIRMED | `creator-basic@` (45 rooms, then 1 chat on page 3, stand-in `chat` drawn): page 1, then each cursor page once, in order; the loading list shows meanwhile; the chat row appears; badge 1; the screen's states were blank, loading, rows (never the empty state) (`pw3.json`, `read-on-found-<theme>.png`) |
| Read-on ends (no endless paging) | CONFIRMED, with finding 1 | the chat removed from that account: the read-on requested pages 1 to 3, then showed "No messages yet", and sent nothing more in the next 8 s (`pw4.json`, 24 more runs in `pw5-24.out`, all ended on the empty state) |
| Read-on shows the loading list | CONFIRMED | page 2 held by the browser for 7 s: the loading list, `inbox-empty` 0 (`read-on-loading-<theme>.png`) |
| A failed read-on shows one Try again | CONFIRMED | cursor requests refused: the retries end in "Couldn't load your inbox" with exactly one Try again button, no empty state, and the request count stays at 6 for the next 4 s (no loop); with the Hub back, Try again reads on and the row appears (`read-on-failed-<theme>.png`, `pw3.json`) |
| E2: no stepper, no "N tickets", no total; each tier keeps its name, left or ended line, price or Free, and pill | CONFIRMED | five real events (3 tiers with one ended; Free; one tier; one tier sold and one open; all sold): `step-plus`, `step-minus`, `event-total`, `event-total-amount`, labels "More/Fewer ... tickets" and "N tickets" are all 0 in every one, light and dark; the tier lines read "Regular, 100 left, ₦7,500", "VIP, 5 left, ₦12,000", "Early bird, Ended 8 Oct, Ended pill", "Free entry, 50 left, Free", "Regular, Sold out"; `scrollWidth` 390 = the viewport; the tickets failing leaves the error with Try again and nothing else (`pw2.json`) |
| E9's Sold out bar: a fact or a do-nothing bar under R-47? | RULING: a fact, it stays | it appears only when the Hub says every tier has sold (the partly sold event draws no bar, live and in the T2 test); it is disabled, not a picture of a button that goes nowhere; it is not an entry to an unbuilt screen (R-47 removes those); every tier already says Sold out and the page says "Every ticket for this event has sold.", so it adds no promise. The strict reading ("no do-nothing buttons") would remove it and cost nothing; if the owner wants that, it is one block in `EventDetailScreen.tsx` and `event-sold-bar` in two tests. Left to the owner as `unclear`, low |
| The three changed tests | RULING: all three follow the task, none weakens a guard that should stay | `InboxScreen.test.tsx`: the one test changed asserted "no empty state for undrawable rows", which is the behaviour the task removes; it now asserts the empty state, no loading, no error, no rows, and five tests were added. `unread.test.tsx`: `beforeEach` draws `chat` through the registry and `afterEach` removes it, so the live-count, coalescing, catch-up and sign-out guards still run unchanged (the answers now carry `chats: total`); two tests were added for undrawn and per-kind. `eventsScreens.test.tsx`: the stepper test became the absence test (killed by 6 of my mutants); "cannot take more than is left" moved to `ticketStepper.test.tsx` with the component, because the wiring left the screen; "a free pick totals Free" went with the total; T2 "keeps the buy bar" now pins "no sold-out bar while one tier is open" (V13 kills it). The ended-and-sold-out test still asserts the pill and the day. Note for EVENTS-06: its new check says to rewrite the absence test, but not that a screen-level test of the per-tier maximum and of a free total must come back with the wiring |
| No R-46 left in src, scripts or the gate tests | CONFIRMED | `grep -rn "R-46" src scripts .github` finds nothing; the files that still say R-46 are `DECISIONS.md` (its own history), `BACKEND_GAPS.md`, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`, task files and `docs/roles/VERIFIER.md` line 67, which the builder named; a reword for the lead (finding 4) |
| The gate behaves the same | CONFIRMED | `python3 -m unittest discover -s scripts/gates/tests`: 44 of 44; the three gate files are equal to origin/main in their syntax trees once docstrings are removed (checked with `ast`), so only text changed |
| Trial merge of main | CONFIRMED | `origin/main` `5de924a` is an ancestor of the branch (fetched at the start and again at the end): already up to date, no conflict. The full check below is on this tree |
| Backend | not touched | the branch changes no backend file; the Hub ran from origin/main `7b4ffef` only to be read |

### Findings

1. **defect (medium, latent: not reachable until a renderer exists).** The Inbox read-on stalls on the loading list forever when a refresh lands while it is under way. `InboxScreen.tsx` reads on in an effect whose dependencies are `[readingPast, isFetchingNextPage, pagesRead, fetchNextPage]`. A refresh (`refreshInbox` invalidates the inbox queries at start-up, on every live event and on every return) cancels the page being read and refetches the pages held; when that settles, `readingPast` is still true, `isFetchingNextPage` is false and `pagesRead` is unchanged, so no dependency changed, the effect does not run again, and nothing reads the next page. The screen keeps the loading list with no request in flight, and pull to refresh does not help (same state). Reproduced by a jest test that runs the real screen and invalidates at nine timings: 2 of 9 stall (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/reproStall.test.tsx`, drop it in `src/features/inbox/__tests__/`; invalidate at 100 ms with 30 ms pages and at 120 ms with 100 ms pages; the requests end `first, c:cur2, c:cur3, first, c:cur2` and `first, c:cur2, first`, then nothing). It also happened once live, unprovoked, in about 60 loads against the real Hub (`pw4.json`, the dark run: 4 requests, then none for 8 s, the loading list at 17 s; picture `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/sheets/read-on-end-light-vs-STUCK-dark.png`, right half; the 24 repeats in `pw5-24.out` and the 7 delayed ones all finished). With the dependency `inbox.isFetching` in place of `isFetchingNextPage` (and `!inbox.isFetching` in the guard) all 9 timings finish on the empty state and the builder's 17 InboxScreen tests still pass (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/suggested-fix.patch`, tried in a throwaway copy, not applied). It breaks the stated behaviour "the read-on ends" (an endless loading list), but it cannot be reached today: with no renderer `canDraw` is false and nothing reads on. It becomes reachable when INBOX-05, -10, -18 or -19 adds the first renderer and a person has a page of undrawn rows ahead of the first drawn one. Fix it in a FIX-30 round (a one-line change and the jest test above) or put it on the first of those four tasks; the lead chooses
2. **note (low).** The read-on error draws the default Wi-Fi-off icon and a fixed sentence for every cause, while the first-load error picks its icon by cause (offline or alert). A 500 on page 2 therefore shows the offline icon. `InboxScreen.tsx`, the `isFetchNextPageError` branch
3. **note (test gap, one surviving mutant; the behaviour is FIX-29's, not this task's).** V15: the sold-out bar drawn for a called-off event whose tiers are all sold is not pinned (`const soldBar = allSold && !called` loses `!called` and every test still passes). A test that would kill it: an event with `cancelledAt` set and every tier sold shows `event-called-off` and no `event-sold-bar`
4. **note (docs).** `docs/roles/VERIFIER.md` line 67 still says "(R-46)" for the `unbuilt_entries` gate; the lead's reword, not this task's
5. **note.** After a read-on finds its row, the start-up refresh refetches every page already read (3 pages, 6 requests in all for a 46-row inbox). It is how an infinite query refetches, it was there before FIX-30, and it stays correct; it is only more visible now that pages are read ahead
6. **unclear (owner, low).** E21's price line ("A creator or professional tick, N a year") is untouched (FIX-29 finding 3, first half); the builder named it. E9's Sold out bar is ruled above

### Mutants of my own (one edit each, the named test files run, the file restored from a copy and compared; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/mutants.log`)

| # | Edit | Result |
|---|---|---|
| V1 | badge shows the Hub total again | killed (2) |
| V2 | badge maps chat to the paidDms count | killed (7) |
| V3 | empty state only when the Hub served no row (the blank body is back) | killed (4) |
| V4 | read-on ignores the end of the pages | killed (2) |
| V5 | read-on keeps going after a failed read | killed (1) |
| V6 | read-on happens even when no kind is drawn | killed (1) |
| V7 | badge counts every kind regardless of renderers | killed (4) |
| V8 | a failed read-on shows the empty state instead of the error | killed (1) |
| V9 | the loading list is a blank view while reading on | killed (1) |
| V10 | a stepper back in every paid open tier | killed (2) |
| V11 | the running total bar back for an event with open tiers | killed (2) |
| V12 | E9 bar dropped when every tier has sold | killed (1) |
| V13 | E9 bar drawn as soon as one tier has sold | killed (1) |
| V14 | E9 bar enabled | killed (1) |
| V15 | E9 bar drawn for a called-off event | SURVIVED (finding 3, test gap, FIX-29's logic) |
| V16 | a tier loses its Free label | killed (1) |
| V17 | an ended or sold-out tier loses its pill | killed (3) |
| V18 | a stepper control back in the sold-out note | killed (1) |

18 mutants, 17 killed, 1 survived (a test gap, not a capability). None of them catches finding 1: no test refreshes the Inbox during the read-on.

### Checks I ran

`npm run check` on the branch with this report, the LOG line and the regenerated `docs/PROGRESS.md` in place (main `5de924a` is already in the branch, so this is the merged tree): **EXIT 0** on the second run (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/check2.log`, last line `EXIT 0`). Typecheck 0; lint 0 errors and 7 warnings (the same 7 the builder named, none in a file this task wrote); jest 120 suites and 2018 tests, all passed; gates 10 run, 472 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), baseline 0, `unbuilt_entries` lists nothing; 273 tasks. The first run (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30/check1.log`) failed one test under load (load average 11 to 16, other agents running): `eventsScreens.test.tsx` "a user sees when a tier ended and when one opens in the event's zone, beside its own clock (D8)", the same one the builder recorded as a flake (it reads the tier lines right after the event answers, before the tickets do); that file alone passed 46 of 46, and the second full run passed everything. `python3 -m unittest discover -s scripts/gates/tests`: 44 of 44. Secret scan of what I staged (the task file, `docs/LOG.md`, `docs/PROGRESS.md`): no key-shaped string, no `sk_`, `FLWSECK`, bearer token or private-key header, no BVN, NIN or phone number written; no em-dash in anything a user reads. After the run only the text of this paragraph changed (checked: `check_tasks.py --write` leaves `INDEX.md` and `PROGRESS.md` as they were).

### NOT RUN

- A phone or the tester build (V10, R-24): the web build proves the handlers and the layout, not the native modules.
- The read-on against the shipped app: it cannot run there until a renderer exists; it ran in a throwaway tree with a stand-in `chat` renderer (never committed), so the pictures of rows in `read-on-found-<theme>.png` are the stand-in's plain text, not a built row.
- Widths other than 390 px (no layout changed: the Inbox and E2 bodies use the same components).
- Creating events through the host wizard and the admin approval, the payment of a ticket: other tasks'.
- A full backend suite (the brief asks for none; the branch changes no backend file).
- INBOX-05, -10, -18, -19 and EVENTS-06 when they land: each must draw its parts back as drawn and rewrite the tests that pin their absence.

## Builder report, round 2

Branch `wmt/FIX-30`, built on `2491202` (the verifier's head), merged with main `aff0e96` (a fast-forward: main already held the branch). Mobile only, two code files: `src/features/inbox/InboxScreen.tsx` (the effect) and `src/features/inbox/__tests__/InboxScreen.test.tsx`; plus one line in `tasks/EVENTS-06.md`. No backend, package or fenced file touched.

**The defect (verifier finding 1).** A refresh landing during the Inbox read-on (a live event, start-up, a return to the tab: `refreshInbox`) cancels the page being read and refetches the pages held. When that refetch ended, `readingPast` was still true, `isFetchingNextPage` false and `pagesRead` unchanged, so the read-on effect did not run again and the screen sat on the loading list with nothing being read.

**Before.** The verifier's repro is now committed (`describe('the inbox read-on when a refresh lands during it')`, 13 tests). On the unfixed code it fails 6 or 7 of 13 per run (three runs: 7, 7, 6): all four scripted tests every time, and 2 or 3 of the verifier's 9 timings, a different set each run (60/30, 100/30, 120/100 in some; timing-dependent, as the verifier saw). Each failure reads `state: loading, requestsInFlight: 0` where `empty` or `rows` is expected.

**What I changed, and why not only the verifier's patch.** The verifier's patch (`inbox.isFetching` in the guard and the dependencies) fixes all 9 real-time timings, but I wrote a deterministic variant that it does not fix: the refresh lands in the instant the page is asked for (the request reaches the network, then the whole refetch settles, before React renders that anything was in flight). The screen then sees `isFetching` false before and after, and the refetch changes no flag and no page count. That test (second page asked, third page asked, each ending on the empty state or on a drawn row) failed with the patch alone, 4 of 4. The fix keeps the patch and adds `inbox.dataUpdatedAt` to the dependencies: a refetch always moves it, so the effect runs when any read ends. It cannot loop: each run needs a read to have ended, and a read-on stops at the last page, at an error (one Try again) or at a drawn row. The comment above the effect says why.

**The test.** Four scripted cases: the refresh is fired from the request itself for the second page, and for the third, each with the pages ending on the empty state (only rows nobody draws) and on a drawn row. Then the verifier's 9 timings (refresh at 0, 10, 30, 60, 100 ms with pages of 30 ms; 20, 50, 120, 200 ms with pages of 100 ms), ending on the empty state. Each waits for `{ state, requestsInFlight: 0 }` to equal `empty` or `rows` and 0, then asks nothing more in 100 ms. The harness gained two optional answer fields, `delay` and `onSend`; no existing test changed.

**After.** 13 of 13 pass, **20 runs in a row** (`loop20.log` in the scratchpad: `RUNS_ALL_PASSED=20 of 20`, every run `13 passed`). With the verifier's patch alone: 9 of 9 timings pass, 4 of 4 scripted fail. On the effect as it was: see Before.

**EVENTS-06.** The per-tier maximum and a free total at the screen belong to EVENTS-06 (the wiring left the screen when the steppers did), so they are one new capability line in `tasks/EVENTS-06.md`, not tests here. Nothing else added.

**Checks**: `npm run check` EXIT 0 as one command, first run, no flake (log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix30r2-check1.log`, last line `EXIT 0`): typecheck 0; lint 0 errors and 7 warnings (the same 7 as round 1, none in a file this round touched); jest 120 suites and 2031 tests, all passed (round 1: 2018; this round adds the 13); gates 10 run, 472 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), baseline 0; 273 tasks. The 5 inbox suites alone: 76 of 76. Secret scan of the diff: none; no em-dash in anything a user reads.

**NOT RUN**: a live run against the Hub (the read-on cannot run in the shipped app until a row kind has a renderer, as the verifier found); a phone (V10).

## Verifier report, round 2

Verifier session (Sonnet), independent of both builders and of the round 1 verifier. Mobile `origin/wmt/FIX-30` `ca3db8d` in a detached worktree. Jest only, no server, nothing left the machine. Origin main has moved to `90bdbfc` (NUV-02 and NUV-03 merged since the branch took `aff0e96`): a trial merge of main into the branch stops in one file, the generated `docs/PROGRESS.md` (`check_tasks.py --write` rebuilds it), with no code conflict. **Verdict: the fix does what it says for a refresh that succeeds, and every scenario the brief names passes except one. When the refetch that the refresh starts is REFUSED in the same instant, the read-on still stalls on the loading list (finding 1, defect, low and latent, a one-dependency fix tried in a throwaway). Status `building`.** Product code was not changed.

### What was checked

| Check | Result | Evidence |
|---|---|---|
| The diff under `src` | CONFIRMED | `git diff aff0e96..origin/wmt/FIX-30 -- src` lists two files: `InboxScreen.tsx` (9 lines, the effect and its comment) and `__tests__/InboxScreen.test.tsx` (+82). Outside `src`: `docs/LOG.md` (+1), `docs/PROGRESS.md` (generated), `tasks/EVENTS-06.md` (+1 capability line, and its text is right), `tasks/FIX-30.md`. In the test file only the `Answer` type (two optional fields, `delay` and `onSend`) and two lines of the fetch stand-in changed; the 17 older tests are untouched |
| The new tests fail on round 1's `InboxScreen.tsx` | CONFIRMED, with a correction to the builder's count | a throwaway worktree with `InboxScreen.tsx` from `aff0e96` and the branch's tests: six runs, 4, 5, 4, 5, 5 and 6 of the 13 fail. The four scripted cases fail every time. The nine timings are load dependent: 0 to 2 of them fail per run (60/30, 120/100, 200/100 in turn), not the 2 or 3 the builder saw, and the round 1 verifier's own repro failed in 1 of 3 runs on the old code. The builder's "6 or 7 of 13" is the top of that range; nothing else is off |
| The new tests pass on the branch, 20 runs in a row | CONFIRMED, with one cold-start note | second series, warm cache: **20 of 20**, each run the 13 new tests and the round 1 verifier's 9-timing repro (`reproStall.test.tsx`, 22 tests a run, all passed). In the first series (`-t` filter, new worktree) run 1 failed one test and runs 2 to 20 passed. Cause: a cold Jest transform cache. The first scripted test then takes 11.3 s and 14.5 s against its own 10 s limit (twice with `--no-cache`); a whole-file cold run fails the file's older first test instead (21.7 s). It is machine load and cold start, not behaviour (finding 3) |
| The round 1 verifier's original repro on the branch | CONFIRMED | `reproStall.test.tsx`: 9 of 9 on the branch in 23 runs (3 alone, 20 in the loop) |

### Trying to stall it another way

Throwaway tests, 201 of them, written for this report and not committed (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30r2/stallExtra.test.tsx`, drop it in `src/features/inbox/__tests__/`). Each ends the same way: nothing in flight, no request sent for 250 ms, and the screen on the empty state, a drawn row or (where a page was refused) the error with one Try again; a loading list with nothing in flight is a stall. Pages are three communities, then either nothing drawn (empty state) or a drawn chat row. On round 1's file 63 of the 201 fail (A3 4, B 19, C 8, D7 2, G 9, F 6, 15 fuzz seeds); on the branch 8 fail, all in the failed-refresh group.

| Scenario | Result on the branch |
|---|---|
| A. A refresh lands on page 1: as page 1 is asked; while it is in flight; at 55, 62, 65, 70, 90 ms around its answer (pages 60 ms) | passed, both endings |
| B. Two refreshes in a row: both at once as page 2 or page 3 is asked; a second lands during the refetch the first started; a cascade of six (every request refreshes again); eight pairs of timings with 40 ms pages | passed, both endings |
| C. A failed refresh during the read-on: the refetch of page 1 refused (400); the refetch of page 2 refused with two pages held; the refetch cut offline (retried twice, about 3 s); the refetch and the read-on page both refused | **stalls** when the refusal is immediate (finding 1); passes when the refetch is cut and retried (C2), and when the read-on page is refused first and a refresh follows (C5: it resumes, no loop) |
| D. The screen leaves and comes back: unmounted as page 2 is asked and mounted again later, while it is in flight, after the cache was marked stale, and as the page-1 refetch is asked; tab loses focus and regains it stale while page 2 is in flight; tab stays away while the read-on ends, then returns stale; pull to refresh at 0, 20, 45, 70, 95 ms | passed, both endings |
| E. Fuzz: 60 seeded runs (2 to 5 pages, 1 to 3 refreshes by invalidation or pull to refresh, random page delays, refused pages in 40% of them) | passed, 60 of 60 |
| F and G. A refresh at 0 to 120 ms (30 ms pages) with the page-1 refetch refused after 0, 2, 5, 10, 15, 20 or 40 ms | stalls only when the refusal takes 0 ms (the stand-in answers in the same tick) (1 to 3 of the 9 refresh times per run, a different set each run); no stall at 2 ms or more in three sweeps of 45 |

### Finding

1. **defect (low, latent: no row kind has a renderer yet, and it needs a refusal faster than one render).** The effect runs again when a read ends, but only through `inbox.isFetching` and `inbox.dataUpdatedAt`. A refetch that FAILS moves neither: `dataUpdatedAt` stays, and if no render showed the read as under way, `isFetching` is `false` before and after. The new comment (and the builder report, "a refetch always moves it") says every ending moves `dataUpdatedAt`; a failed one moves `errorUpdatedAt` instead. Entered by the same instant the builder used: the refresh fires as the second page is asked, the refetch of page 1 is refused (a 400, which the app does not retry), and the screen sits on the loading list with nothing in flight (`stallExtra.test.tsx` C1, C3 and C4, 6 of 6 fail every run; the requests end `first, c:cur2, first`, or `first, c:cur2, c:cur3, first, c:cur2` with two pages held). A refusal that takes a few ms or more does not stall it (the render sees the refetch under way and `isFetching` changes), nor does a cut connection (it retries for about 3 s), so in the shipped app it needs a refresh and a 4xx to land inside one render of each other. Fix, tried in a throwaway copy and not applied: add `inbox.errorUpdatedAt` to the dependency list (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30r2/suggested-fix.patch`). With it the 30 `InboxScreen` tests and all 201 throwaway tests pass, three runs in a row (231 of 231), and it cannot loop: a failed read-on page ends on the error with one Try again. Then correct the comment and add one test where the refresh's refetch is refused (C1 of the throwaway file is 12 lines). None of the 13 shipped tests refuses anything, which is why two mutants below survive
2. **note.** X3 and X7 below behave the same as the branch in everything but finding 1, so they are not test gaps: X7's `pagesRead` always moves together with `dataUpdatedAt` (an equivalent mutant), and X3 only changes whether the read-on may ask while a refetch is in flight
3. **note (test robustness, not a product defect).** The first scripted test in the new group has a 10 s limit and carries the cold-start cost when the group is run alone on a cold cache (finding 3). The whole file under `npm test` is fine because older tests go first. Raising its limit is the builder's choice

### Mutants of my own (one edit each on the effect's guard or dependencies or on `readingPast`, the 30 `InboxScreen` tests run, file restored and `git diff` empty after each; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30r2/mutants.log`, and `mutants_extra.log` beside it for the same edits run against the 201 throwaway tests)

| # | Edit | Result |
|---|---|---|
| X1 | `inbox.dataUpdatedAt` out of the dependencies | killed (4: the four scripted cases) |
| X2 | `inbox.isFetching` out of the dependencies | SURVIVED the shipped tests; killed by my failed-refresh sweeps (50) |
| X3 | guard back to `!isFetchingNextPage`, dependencies kept | SURVIVED; equal to the branch in my 201 tests apart from finding 1's cases (note 2) |
| X4 | guard loses `readingPast` (reads ahead always) | killed (5) |
| X5 | guard loses the in-flight check | killed (1) |
| X6 | guard inverted (reads only while something is fetching) | killed (17) |
| X7 | `pagesRead` out of the dependencies | SURVIVED; equivalent (note 2) |
| X8 | `dataUpdatedAt` swapped for `errorUpdatedAt` | killed (4) |
| X9 | `readingPast` goes on after a failed read | killed (1) |
| X10 | `readingPast` ignores the end of the pages | killed (14) |
| X11 | guard also waits while the query is in an error state | SURVIVED the shipped tests; killed by my failed-refresh sweeps (54) |

11 mutants, 7 killed by the shipped tests, 4 survived: two equivalent (X3, X7) and two (X2, X11) that only a test with a failed refresh kills, the gap behind finding 1.

### Checks I ran

`npm run check` as the same steps in one command with two jest workers (typecheck, lint, `npm test -- --maxWorkers=2`, gates, tasks; load average 15 to 25 from other agents), on the branch with this report, the LOG line and the regenerated `docs/PROGRESS.md` in place: **EXIT 0** on the first run, no flake (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30r2/check1.log`, last line `EXIT 0`), and again once the report, the LOG line and `docs/PROGRESS.md` had their final text (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix30r2/check2.log`, last line `EXIT 0`, the same counts). Typecheck 0; lint 0 errors and 7 warnings (the same 7 as round 1, in `eventsFocus`, `ticketsRefetchFails` and the professionals `screens` tests, none in a file this round touched); jest 120 suites and 2031 tests, all passed (the builder's count); gates 10 run, 472 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), baseline 0; 273 tasks. Secret scan of what I staged (the task file, `docs/LOG.md`, `docs/PROGRESS.md`): no key-shaped string, no token, no phone or identity number; no em-dash in anything a user reads. After the run only the text of this paragraph and the LOG line changed (`check_tasks.py --write` is run again to confirm `INDEX.md` and `PROGRESS.md` stay as they were).

### NOT RUN

- A phone, a live Hub or a browser: the read-on cannot run in the shipped app until a row kind has a renderer (round 1 verifier), and this round was jest only by the brief.
- A refusal faster than one render over a real network: jest answers in the same tick, so the instant case is shown by a scripted test, not by a measurement on a device.
- The full backend or any server: this branch changes none.

## Owner sign-off

Merged by the lead, 10 Oct 2026 (mobile main, merge of `2491202`): every capability check passed. The verifier's one defect (the read-on stalls when a refresh lands during it) is latent: no row kind has a renderer yet, so nothing reads on. It is fixed in round 2 on the same branch (the verifier's one-line patch and its stall test) before any Inbox renderer task merges.
