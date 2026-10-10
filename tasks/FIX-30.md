---
id: FIX-30
title: FIX-29 follow-ups: the Inbox blank body, the ticket picker without a buy button, the R-46 wording
owner: YOU
area: FIX
order: 244
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
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

## Owner sign-off
