---
id: FIX-29
title: Unbuilt screens' entries are not drawn (R-47)
owner: YOU
area: FIX
order: 239
priority: launch
repo: wawu-wmt-mobile
type: component
status: done
depends_on: [COMPLETE-01]
decisions: [R-47, R-27, R-41]
passes: [V1, V5, V6]
artboards: [X1, W1, Z1]
---
# FIX-29 · Unbuilt screens' entries are not drawn (R-47)

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-47 (the owner withdrew R-46 on 9 Oct 2026), R-27, R-41
- `tasks/COMPLETE-02.md`, `tasks/COMPLETE-05.md`, `tasks/BRAND-01.md` (what R-46 added)

## Goal

The owner, 9 Oct 2026: "UI isn't even necessary to be there if the tasks are not complete." R-46 had drawn every entry of an unbuilt screen as an inert button. This task takes them out again, so the app shows only what works.

## Scope

- Remove every `unbuilt('<ID>')` entry in `src/` (list them with `python3 scripts/gates/run.py --gate unbuilt_entries --json`): on Explore (search pill, bell, Featured creators' See all, Find a school, Create) and on the Wallet tab (scan, settings, the Dollar and Crypto tabs and Swap, Send, Add money, the bills tiles, the WAWU card row, See all). A card or row that shows real data but whose detail screen is not built stays drawn and is not pressable (a creator card, a transaction row).
- BRAND-01's Me menu sheet (Z1): only rows whose screen exists are drawn (Settings today); the seven do-nothing rows go. If one row is left, the sheet still opens as drawn with that row.
- Sections whose own task is complete stay drawn, with their designed empty state when the Hub serves nothing (keep COMPLETE-02's failed-read banner and its kept sections). Entries that are already wired (for example PROS-01's Find a professional door, merged by Developer 3) stay exactly as they are.
- Tests that asserted an inert entry is drawn now assert it is not drawn; keep the tests that pin wired entries.
- After this task `unbuilt_entries` lists nothing. The helper and the gate stay (R-47).

## Capability checks

- [ ] A user on Explore, the Wallet tab and the Me menu sees no button that does nothing (`python3 scripts/gates/run.py --gate unbuilt_entries` lists none, and a tap sweep of every pressable element lands somewhere).
- [ ] Every wired entry still lands on its screen (Find a professional, List your services, events, categories, Open your wallet, Settings).
- [ ] Nothing runs off the screen from 320 to 430 px.
- [ ] `npm run check` exit 0.

## Builder report

Branch `wmt/FIX-29`, built on main `d1a4a89`. Mobile only, no package change, no shared component forked. Continued the stopped builder's uncommitted work (Explore, Wallet, Me menu, `CreateButton`; its wallet test rewrite was half done and did not typecheck), merged main into it (clean, no conflicts), then found and removed the inert entries EVENTS-04 had added since (`unbuilt_entries` listed 3 on the merged tree) and finished the tests. `python3 scripts/gates/run.py --gate unbuilt_entries` now lists nothing. The `unbuilt` helper and its gate stay, unused (R-47).

**Entries removed, by screen** (each is added back, as drawn, by the task named):

| Screen | Removed | Added back by |
|---|---|---|
| Explore (X1, X14, X15) | search pill | EXPLORE-02 |
| | bell and its unread dot (and the unread read behind it) | ME-14 |
| | Featured creators' See all | EXPLORE-02 |
| | Find a school door | SCHOOLS-03 |
| | Create button (and the account-type read behind it, and the room under the last row) | ME-04 |
| | creator card press on the rail and in the Categories grid: the card stays drawn with its Follow, not pressable | ME-02 |
| Wallet tab (W1, W4, W5, W6) | scan icon | WALLET-20 |
| | settings icon | WALLET-06 |
| | account tabs Naira, Dollar, Crypto | WALLET-21 |
| | Send | WALLET-02 |
| | Add money | WALLET-05 |
| | Swap | WALLET-21 |
| | the five bills tiles | BILLS-01 |
| | WAWU card row | WALLET-22 |
| | See all, and a transaction row's press (rows stay drawn, not pressable) | WALLET-04 |
| | W4's loading shapes for the tabs, actions and tiles | with their entries |
| Me menu (Z1) | Creator dashboard, My content | ME-07 |
| | My purchases, Saved, Notifications | ME-14 |
| | My courses | SCHOOLS-08 |
| | Verification | ME-12 |
| Events (E1, E13 to E15, E16, E21), added by EVENTS-04 after the first builder started | My events tab (E1 and the host wizard) | EVENTS-08 |
| | My events button on E16 (Done stays, now the one full-width button) | EVENTS-08 |
| | Get verified button on E21 (the gate keeps its words and price) | ME-12 |

**Kept, wired, unchanged**: Find a professional, List your services, the category tiles, Upcoming events' See all, an event card, Follow, Open your wallet, the eye and Copy on the balance card, Try again, Settings (the one Me menu row), Host event tab, Host your event Start, Done, Back. Sections whose task is built keep their empty states and Explore's failed-read banner.

**What the stopped builder had done / what I added.** It had done Explore, Wallet and the Me menu in code (and `CreateButton` made prop-driven), plus the Wallet test rewrite (unfinished). I added: the three Events removals above, `explore-bar` test id, the rest of the test rewrites (Explore `screens.test.tsx`, `MeScreen.test.tsx`, professionals `routes.test.tsx`, `walletTabFlow.test.tsx`, the unfinished tail of `WalletScreen.test.tsx`, `hostScreens.test.tsx`), a new `src/__tests__/createButton.test.tsx` (the button has no screen now, so it is pinned alone), removal of the dead `fetchUnreadNotifications` and `unreadKey`, an unused `space` import, and stale R-46 comments. Merge commit `a5715a0` carries git's default message (no trailers); every later commit carries them (no amend, by rule).

**Tests.** Each test that asserted an inert entry is drawn now asserts it is absent, by test id, by role and by words, for every state (data, new account, bank down, loading, no wallet, opening, frozen, failed reads). New: "every button on Explore does something" (lists every button and presses each: opens a built screen or follows; the creator card has no role), "every button on W1 does something" (the eye and Copy are the only two), Me menu "draws none of the seven rows and every row it draws is a button". Order and wiring tests kept (doors in order, List your services lands on P5 or P8, Find a professional opens P1, Settings opens Z2).

**Pictures** (V5), in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/pictures/` (contact sheets in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/sheets/`): web export (`npx expo export -p web`, private TMPDIR) on port 5985 in Chromium from `/opt/pw-browsers`, at 360 and 390 px, light and dark, `<screen>-<width>-<theme>.png`. **The Hub and WAWU ID were a stand-in** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/standin.js`, ports 5986 and 5987, local only; the browser refused every other address and refused 0 requests). The stand-in's names, figures and events are samples, not the app's data. Screens: `explore-data` (a creator account with unread notifications, so Create and the bell's dot would show if they were drawn), `explore-empty`, `explore-failed` (the banner), `wallet-data`, `wallet-new`, `wallet-bank-down`, `wallet-loading`, `me-menu`, `events-e1`, `host-gate`, `host-sent`; `explore-*` and `wallet-data` also have `-scrolled` pictures (the doors card, the last rows).

**Tap sweep** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/sweep.log`, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/pictures/report-sweep.json`): every pressable element on those 11 screens at 390 px (97 presses, each from a fresh load). Each one lands somewhere (a URL change, a request, or a visible change). The only presses that change nothing are the already-selected tab (the tab bar's current tab on 7 screens, the selected Discover tab): a selected tab is not a dead entry. On `me-menu` the sheet covers the tab bar, so a press at a tab's centre lands on the sheet's Settings row (opens `/settings`): the sweep's artefact, not a defect.

**Widths** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/widths.log`, `report-widths.json`): the same 11 screens at 320, 340, 360, 375, 390, 412 and 430 px (77 loads): the page never scrolls sideways (`scrollWidth` equals the viewport) and no element runs off the screen except inside a rail that scrolls on its own (category tiles, creators, events, which run off the edge by design).

**Mutants of my own** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/mutants.py`, `mutants.log`): 10 applied, 10 killed, each file restored from a copy and compared. M1 Find a school put back inert (Explore), M2 Find a professional dropped, M3 creator card made pressable to nowhere, M4 wallet row made pressable to nowhere, M5 a Me menu row put back (Saved), M6 My events tab put back, M7 Get verified put back, M8 wallet scan icon put back, M9 Create put back on Explore, M10 Featured creators' See all put back.

**Checks.** `npm run check` exit 0 as one command: typecheck 0, lint 0 errors (7 warnings, none in a file this task touched), 114 suites / 1899 tests, gates 10 run, 455 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), `unbuilt_entries` lists nothing, 271 tasks. The first full run failed once, only in `src/features/events/__tests__/eventsScreens.test.tsx` ("a user sees when a tier ended and when one opens in the event's zone", D8: the known load flake, machine load average about 7); that file alone passed 47 of 47 once and failed that same test once, and the test alone (`-t`) passed; the second full run was green. Secret scan of the diff (key-shaped strings, `sk_`, `FLWSECK`, bearer tokens, private-key headers): none; no em-dash in anything a user reads.

**Decisions (Default (agent), owner may override)**
- Where one button is left, it stays as drawn but alone: E16 shows Done full width; the Me menu sheet opens with Settings only (R-47 text).
- E21 keeps its words and the price from the system; the only way out is Back in the bar, until ME-12 adds Get verified.
- E22 (Sent back, `/events/sent-back/[id]`) is a built screen with no entry until EVENTS-08 adds My events; it is not an entry, so it stays.
- `ExploreBar` and `WalletBar` keep their 44 high row and title so the body sits where it will once the icons are added.
- `CreateButton` stays in `src/components/` with a required `onPress`, unused until ME-04; the dead unread-count read was removed (ME-14 reads its own count).
- A creator card on Explore and in Categories stays drawn with its Follow and is not pressable (R-47: real data, detail not built).

**NOT RUN.** A real device or the real Hub (the pictures use a stand-in; unblocked by a Hub the verifier can run against). The design comparison of each picture against its artboard and the V-passes (the verifier decides). A tap on a physical phone. The inert-entry gate against EVENTS-08, ME-12, EXPLORE-02 and the other tasks when they land (each must add its entry, as drawn, when it builds its screen).

## Verifier report

Verifier session (Sonnet), independent of the builder. Mobile `origin/wmt/FIX-29` `325808a` (builder `a349ee7` plus the merge of main `603bd29`), checked in a detached worktree. Origin main is still `603bd29` and is an ancestor of the branch, so the trial merge is a no-op. **Verdict: no blocker, status `review`.** Nothing inert is left and no done entry was removed. Product code was not changed.

How it was checked: a web export of this head (`npx expo export -p web`, private TMPDIR) in Chromium from `/opt/pw-browsers`, against a **stand-in Hub and stand-in WAWU ID** (not the real Hub; ports 5989 to 5992 only): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/mock.js` answers every Hub path from `contract/openapi.json` (schema-shaped sample data, so names and figures are samples) with the builder's state switches kept. The browser refused every other address (0 external requests, all runs). Scripts: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/crawl.py` and `crawl2.py` (presses), `shots2.py` (layout), `mutants.py`, `targeted.py`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 every control does something | passed | 43 screen states, 340 presses at 390 px, each from a fresh load: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/crawl-390-light.log`, `pics/crawl-390-light.json`, `pics2/crawl-390-light.json` |
| V5 Picture | passed, with recorded differences | layout at 320, 360, 390, 430 px, light and dark, 11 screens, 88 loads: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/sheet-<screen>.png` and `lay/`; artboards X1, W1, Z1 beside the built screens: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/sheet-artboards-light.png` (the only differences are the removed entries, R-47, and the app's own mark, R-37) |
| V6 States | passed | Explore with data, empty Hub and failed reads; Wallet with data, new account, bank down, loading, no wallet; Me content empty; E21 and E16: `lay/*`, `pics/wallet-none-390.png` |

### Checks

| Check | Result | Evidence |
|---|---|---|
| Every press lands on a built screen or does a real action, on every screen reachable from the four tabs, the Inbox tab and the header (not only the builder's 11) | CONFIRMED. 37 routes and states by URL (Home Today, Explore, Inbox, Wallet, Me, categories, events and E2, host and its gate, My tickets, E22, professionals and a profile, listings, apply, Settings and its five screens, About, Terms, Privacy policy, Edit profile, social links, Add work, works, Legal, TGIF, Open your wallet, payout account) plus six pressed-into states (Home Following and For you, the Me menu sheet, Me Services and About): 340 presses, 271 land (URL, request or visible change), 47 skipped (the tab or chip already selected, or covered by the open sheet), 22 changed nothing: 12 are the already-selected tab, chip or radio, and the other 10 are real actions with no visible web effect, driven one by one with `targeted.py`: Copy account number (clipboard holds the number, label reads "Copied"), Share this event (the share call carries the event text), Going (a POST goes out), Contact support (opens `mailto:`), Add a cover picture, Add a profile picture and Add photos or a video (each opens the file chooser). No press ended on an unmatched route. Static: no `Pressable`, `Button`, `IconButton`, `ListRow`, chips or tabs element in `src/` (outside the dev showcase) lacks a handler, and no handler is empty or `undefined` (`dead_controls` also clean) | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/crawl-390-light.log`, `targeted.py` output in this session |
| Nothing over-removed | CONFIRMED. Every removed entry's destination task is `todo` today: EXPLORE-02, ME-14, SCHOOLS-03, ME-04, ME-02, WALLET-02, -04, -05, -06, -20, -21, -22, BILLS-01, ME-07, SCHOOLS-08, ME-12, EVENTS-08 (checked in `tasks/*.md` front matter). The Me menu's Notifications row opens M31 (the list, ME-14), not Settings, Notifications (Z3, built): `design/_gen/me.js` lines 31 and 115. Still drawn and landing: Find a professional (`/professionals`), List your services (`/professional-apply`), the category tiles (`/categories?category=...`), Upcoming events' See all and the event cards (`/events`, `/events/ev-N`), the featured event, Follow, Open your wallet from the Wallet tab and from Home (`/open-wallet`, and back to the card), Settings from the Me menu (`/settings`), Host event tab and Start, Done on E16 | crawl logs; `pics/wallet-none-390.png` |
| Data rows whose detail is not built are drawn and not pressable | CONFIRMED. Wallet transaction rows, creator cards (Explore rail, Categories grid, Home rail), Inbox rows, Me content tiles and the paid-messages row are not in the pressable list, have no chevron and no press feedback (`TransactionRow`, `MediaCard`, `ConversationRow`, `ListRow` render a plain view without `onPress`); mutants M11 and M12 below | crawl logs, code |
| Sections whose task is done keep their designed empty state | CONFIRMED for the screens FIX-29 touched: Explore with an empty Hub (neutral frames, heading and See all, doors), a failed read (banner, sections), Wallet new account ("No transactions yet" card), bank down and loading (W4 shapes without the removed tabs, actions and tiles), Me content ("Nothing published yet"). One blank body found elsewhere, not caused by this task (finding 1) | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/sheet-explore-empty*.png`, `sheet-wallet-*.png` |
| Builder's decisions against R-47 | CONFIRMED, one for the owner. (a) One button left alone (E16 shows Done full width, the Me menu opens with Settings only): consistent with R-47 and the ticket. (b) E21 keeps its words and the system's price, with Back only (no Get verified): not an entry, consistent with R-47; but the person can read "A creator or professional tick, N a year" and has no way to buy it until ME-12, see finding 3. (c) E22 kept without an entry: a built screen, not an entry; reached only by a link until EVENTS-08. (d) `CreateButton` unused, kept with a required `onPress` and its own test: allowed (no screen draws it; `explore-create` absent in every state, creator or not). (e) Creator cards drawn with Follow and not pressable: right for R-47 | tests and pictures |
| `unbuilt_entries` reports nothing and still catches a planted call | CONFIRMED. `python3 scripts/gates/run.py --gate unbuilt_entries --json` on the head: no failure, no warning (455 files scanned; 456 with the planted file). With a planted file holding `unbuilt('ME-03')` (todo), `unbuilt('PROS-01')` (done), `unbuilt('NOPE-99')` and `unbuilt(which)`: 3 fail and 1 warn (the done task, the missing task and the non-literal fail; the todo task lists as inert). The planted file was deleted (`git status` clean) | run in this session |
| Layout after removals, 320, 360, 390, 430 px, light and dark | CONFIRMED. 88 loads (explore data, empty, failed; wallet data, new, bank down, loading; Me menu; events E1; E21; E16): `scrollWidth` equals the viewport on every one and nothing runs off the screen outside a rail that scrolls by design. By eye: no gap where an entry was, no orphaned divider (the doors card holds two rows and one divider; the Me menu sheet holds one row), no heading over nothing, the last Explore row clears the tab bar, E16's Done is full width, the E1 tab row holds two tabs | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/lay/` (88 pictures plus 7 scrolled ones), `lay.log`, contact sheets `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/sheet-*.png` |
| Tests assert absence for the right reason | CONFIRMED. 24 mutants of my own, one edit each, the named test files run, the file restored and compared (`git status` clean after each): all 24 killed (table below). M16 first survived `BalanceCard.test.tsx` alone (that file does not press the eye) and was killed by `WalletScreen.test.tsx` and `walletTabFlow.test.tsx` | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/mutants.log`, `mutants.py` |
| Main moved since `603bd29` | No. `git fetch` twice: origin main `603bd29`, the branch contains it | `git rev-parse` |

Mutants (each fails at least one test; failing count of the files named):

| # | Edit | Result |
|---|---|---|
| M1 | Find a school put back as an inert door | killed (8 fail) |
| M2 | Find a professional door dropped (done entry) | killed (9) |
| M3 | Settings row dropped from the Me menu (done entry) | killed (5) |
| M4 | inert Saved row put back in the Me menu | killed (2) |
| M5 | Wallet scan icon put back, inert | killed (18) |
| M6 | no-wallet card loses Open your wallet (done entry) | killed (3) |
| M7 | My events tab put back, inert | killed (1) |
| M8 | Get verified put back on E21, inert | killed (1) |
| M9 | My events button put back on E16, inert | killed (1) |
| M10 | Explore bell put back, a button that does nothing | killed (4) |
| M11 | creator card made pressable to nowhere | killed (1) |
| M12 | wallet transaction row made pressable to nowhere | killed (6) |
| M13 | Upcoming events' See all opens nothing (done entry) | killed (1) |
| M14 | Create button drawn on Explore, inert | killed (8) |
| M15 | Featured creators' See all put back, inert | killed (5) |
| M16 | balance eye removed (done entry) | killed by the Wallet tests (8), survived the card's own test file |
| M17 | inert Dollar tab put back on the Wallet tab | killed (17) |
| M18 | Settings row opens nothing (done entry) | killed (4) |
| M19 | List your services door opens nothing (done entry) | killed (4) |
| M20 | category tile opens nothing (done entry) | killed (3) |
| M21 | Host event tab does nothing (done entry) | killed (1) |
| M22 | Done on E16 does nothing (done entry) | killed (1) |
| M23 | Find a professional opens the List your services target | killed (3) |
| M24 | W5's empty card removed (nothing renders blank) | killed (6) |

### Findings

None is a blocker.

1. **note (not this task's diff; a follow-up for INBOX-04 or the Inbox row tasks).** The Inbox tab draws a blank body when the Hub serves rows but none has a renderer: `src/features/inbox/InboxScreen.tsx` line 48 filters the rows with `drawableRows` (`rows.tsx`: `inboxRowRenderers` is empty until INBOX-05, -10, -18 and -19) and the empty state at line 85 draws only when the Hub served zero rows. With the stand-in serving three rows the screen shows the title and the All chip, nothing under them, and the tab badge says 3 (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/pics/inbox-390-light.png`). A person with messages sees a blank page. It is the R-47 pattern (a row with nowhere to go is not drawn) without the empty state R-47 keeps for a built section. Suggested default: when `inbox.items.length > 0` and `rows.length === 0`, draw the same "No messages yet" state, or hide the badge count; the lead decides.
2. **note.** `WalletBar` is 53 px high at 390 (6 above, a 30 px title, 14 below), not the 62 the artboard has with its 42 px icons; the builder report says both bars "keep their 44 high row", which is true of `ExploreBar` (64, test-pinned) but not of `WalletBar` (no `minHeight`). The body sits about 9 px higher than the artboard until WALLET-06 and WALLET-20 add the icons, and moves down when they do. No gap, no overlap. The wallet test that pins layout does not pin the bar's height.
3. **unclear (owner, low).** E21 ("Hosting needs a verified tick. A creator or professional tick, N a year.") tells the person to buy something the app cannot sell yet and offers Back only. It is not an inert entry and the price is the system's, so it stands under R-47; the owner may prefer the price line to wait for ME-12 as well. Same family: E2 lets a person pick ticket quantities and shows a running total with no Get tickets button (EVENTS-06, `todo`); EVENTS-01 built the steppers and total as a capability check (`tasks/EVENTS-01.md` line 59), so this is not FIX-29's, but it is a picker with no checkout (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/pics/event-ticketed-picked-390.png`).
4. **note (test gap, no capability broken).** `BalanceCard.test.tsx` alone does not pin the eye (M16 survived that file); the Wallet screen tests do.
5. **note (docs).** `scripts/gates/checks/unbuilt_entries.py` (its docstring), `scripts/gates/tests/*` and `src/lib/unbuilt.ts` still describe R-46 ("a screen draws its whole artboard"). `scripts/**` is fenced and the ticket keeps the helper and gate, so leaving them is right here; a follow-up can reword them to R-47.
6. **note.** `src/components/CreateButton.tsx` is under the fenced `src/components/**`; the ticket's scope (the Create entry) required the edit and it only removes the `unbuilt` call and makes `onPress` required, so no SHARED-CHANGES row is needed.

Diff against the report: the 38 files in `git diff --stat origin/main...HEAD` are the ones the report names (Explore, Wallet, Me menu, the three Events removals, `CreateButton`, the rewritten tests and the new `createButton.test.tsx`) plus comment-only edits (`ExploreEvents.tsx`, `CategoryTiles.tsx`, `categories.ts`, `LoadFailedBanner.tsx`, `ExploreSkeleton.tsx`, `explore/__tests__/model.test.ts`, `(tabs)/explore.tsx`) that the report calls "stale R-46 comments", and the five deleted wallet files (`AccountTabs`, `BillTiles`, `WalletActions`, `WalletCardRow`, `useRowRoom`). Nothing missing, nothing extra, no package or fenced-script change, no local copy of a main component.

### Checks I ran

`npm run check` on this branch with the report, status `review` and the regenerated `docs/PROGRESS.md` in place (setting `review` is what makes `unbuilt_entries` fail an entry still inert for this task, so the run is after the flip): typecheck 0; lint 0 errors, 7 warnings (the same seven the builder named, none in a file this task changed); jest 114 suites, 1899 tests, all passed (no load flake this time; `eventsScreens.test.tsx` passed); gates 10 run, 455 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), baseline 0, `unbuilt_entries` nothing; task check 271 tasks. Every stage of the chain printed its result, so it exited 0 (the log is `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix29/check1.log`). Secret scan of what I staged (the task file, `docs/LOG.md`, `docs/PROGRESS.md`): no key-shaped string, no `sk_`, `FLWSECK`, bearer token or private-key header; no BVN, NIN or phone number written; no em-dash in anything a user reads.

### NOT RUN

- The real Hub, a real WAWU ID and the real Fintava wallet: every picture and press used the stand-in above (schema-shaped sample data). Unblocked by a local backend worktree of main with a seeded account (`docs` OPS-03).
- A phone or the tester build (taps, the share sheet, the clipboard on a phone, the file picker, `mailto:`): the web build proves the handlers fire; the native modules are not exercised.
- Presses at 320, 360 and 430 px and in dark mode: the press sweep ran at 390 px light only (layout and overflow ran at all four widths in both themes); the same components render at every width.
- Every step of the host wizard (E13 to E15) pressed one by one: step one was pressed by the crawl, the whole wizard was driven only by the picture script through to E16, and the wizard's own tests are EVENTS-04's.
- The inert-entry gate against EVENTS-08, ME-12, EXPLORE-02 and the other tasks when they land: each must add its entry as drawn.

## Lead merge note (10 Oct 2026)

Merged 10 Oct 2026 on its verifier's review (mobile cbc903f; 340 presses over 43 states, no inert entry left, no done entry removed). Taken over from the builder stopped on 10 Oct at midnight. Follow-ups filed: the Inbox blank body (INBOX-04), the E2 ticket picker with no buy button until EVENTS-06, the R-46 wording left in the gate docs.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
