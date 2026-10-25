---
id: RELEASE-02
title: Fix QA defects, re-verify, submit to the stores
owner: YOU
area: RELEASE
order: 300
priority: launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: [CHECK-3]
decisions: [R-20, R-24]
passes: []
artboards: []
---
# RELEASE-02 · Fix QA defects, re-verify, submit to the stores

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): CHECK-3.
- **History:** none yet. Reports go to tasks/history/RELEASE-02.md.
- **R2-SOCIAL (25 Oct 2026, Sonnet builder, T2; mobile `wmt/R2-SOCIAL` on `origin/main` `a3fdaf71`; app only, no backend change, no native change, no route added):** the CHECK-3 social defects (audit `audits/CHECK-3/social.md`), status of the task unchanged (todo, the other areas are not in yet).

| # | CHECK-3 defect | Before | After |
|---|---|---|---|
| 1 (high) | I1: no + above the tab bar | never wired: INBOX-04 gave "the + button" to INBOX-19, which read it as a new-message compose with no person picker (G-882) and drew none. The board's + is the shared Create button (kit.js `Fab`, R-38) that Home, Explore and Me draw through `CreateEntry` | the Inbox tab draws it for creator accounts over every chip, opening Create; a fan sees none, as on Home, Explore and Me |
| 2 (med) | H22, I33: `wawuafrica.com/...` where the boards write `wawu/c/...` | shown as the real link | REPORTED, no change: nothing the Hub serves opens `wawu/c/<slug>` (G-R2S-1); the shared link stays the one that opens |
| 3 (med) | Explore "Who Made This?" empty | the rail read only the admin-featured list, empty until someone is featured | nobody featured: the rail is the first of All creators (what See all opens); featured creators still lead; empty only if both are |
| 4 (low) | H14, E3 "Bank charge / Total", E3 "Pay · ₦5,000", H14 no thumbnail | a zero fee drew a ₦0 charge line | a quote with no fee at all draws "Fee: No fee" (H14 without Total, E3 with); any fee is its parts; E3 button "Pay ₦7,500"; H14 thumbnail when the preview is a picture (a clip has none, G-1724) |
| 5 (low) | detail heart under H19, H20, H24, H25 | the like count | "N% liked" from the Hub's `ratingPct` when the piece has one, else the like count |
| 6 (low) | X5 "People are searching", X10 "Closest things we have" | not seen on the audit stack | NOT A DEFECT: both are built (`/search/popular`, empty until three people search the same thing; `/search/closest`) and tested; the stack had no data |
| 7 (low) | I32, I33 copy lines | both missing | I33: written from `GET /communities/message-cost` (R-62). I32: not drawn, no route serves the host's share (G-INBOX-14-1) |
| 8 (low) | E7 brightness caption | held back, `expo-brightness` "not installed" | it is (package.json); the screen goes to full brightness while a valid ticket is open and back after; the caption shows on a phone, not on the web |

Tests that pinned the old behaviour and were updated (the item names the defect, so it is the ruling): `buyTickets.test.tsx` `payButton` matched `Pay · `, now `Pay ₦`; `screens.test.tsx` and `slider.test.tsx` answer the All creators page the rail now reads when nobody is featured.

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nothing new is built here. Each CHECK-3 defect is fixed by the owner of that feature and re-verified by a different session; then the Android app is submitted to Google Play (R-24; iOS is RELEASE-03). Review time is the stores' decision, typically one to three days.

## Scope

Fixes for CHECK-3 defects only, each re-verified. Money launches with the app (R-20).

## Capability checks

- [ ] Every CHECK-3 defect is fixed and re-verified.
- [ ] The Android app is submitted to Google Play with the final build.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

**R2-SOCIAL lean T2 check (25 Oct 2026, Sonnet verifier; built none of it). Branch `wmt/R2-SOCIAL` `cd128c30` against `origin/main` `a3fdaf71`. Verdict: PASS (merge). No blocker, high or medium.**

Method: local stack (Hub on the Nuvion stand-in, mock WAWU ID, ports 9070 to 9079, no Fintava, no live host), web export of the branch, Chromium 390x844 dark. Seeded: a creator (@chidi), a fan with a funded wallet (ADA, 5,000,000 kobo, PIN set), three live priced pieces (template 96% rated, video 96% rated, template unrated), a published event with a Regular ticket at 7,500, an open community, three people searching the same word. Pictures in the verifier's scratchpad folder `v-r2-social/`.

| Check | Result | Evidence |
|---|---|---|
| I1 + for a creator, none for a fan | passed | creator: the + draws over All, Paid DMs, Communities and Money, same place and size as the board, and a tap opens `/create`; fan: 0 Create buttons on All, Communities and Money (`I1-creator-dark.png`, `I1-creator-light.png`, `I1-fan-dark.png`, `I1-plus-opens.png`) |
| Explore rail, nobody featured | passed | `featured-creators` answered empty, `explore/creators?page=1` was read, the rail shows @chidi with Follow, no "No creators to suggest yet" (`X1-explore-nobody-featured.png`) |
| H14, zero fee | passed | Price, Yours, "Fee: No fee", no Total, "Unlock · ₦1,500", thumbnail from a picture preview; matches the board (`H14-template-nofee.png`) |
| E3, zero fee | passed | Tickets ₦7,500, "Fee: No fee", Total ₦7,500, "Pay ₦7,500"; matches the board (`E3-pay-nofee.png`) |
| H14 and E3 with a fee | passed (sheet only) | Hub restarted with a ₦15.75 book fee: H14 "Bank charge ₦15.75, Total ₦2,515.75, Unlock · ₦2,515.75"; E3 "Bank charge ₦15.75, Total ₦7,515.75, Pay ₦7,515.75"; "No fee" never drawn (`H14-*-fee.png`, `E3-pay-fee.png`) |
| Detail heart | passed | "96% liked" on a piece with `ratingPct` 96 (`H19-c1-detail.png`); the unrated piece shows its like count (7) |
| I33 line | passed | "Chat and reading are free. Credits are for photos, video and voice notes." and `GET /communities/message-cost` answers text 0, photo 1, video 3, voice 3, so every word is backed (`I33-created.png`) |
| E7 ticket (web) | passed | ticket and QR drawn, no brightness caption on the web, as ruled (`E7-ticket-nofee.png`) |
| Money truth | passed | one wallet debit per pay: ₦1,500 unlock took the wallet 5,000,000 to 4,850,000 kobo (one `POST /unlock/wallet`), the ₦7,500 ticket took it to 4,100,000 (one `POST /orders/wallet/pay`, one paid order, one ticket). The extra EventOrder row is the quote of a look-only run, status pending, never charged. "No fee" only when the parts sum to 0 (`feesTotalKobo`), total is price plus the quote's parts, so the button equals the amount charged |
| X5 "People are searching", X10 "Closest things we have" | passed with data | three people searching "business" gives "PEOPLE ARE SEARCHING: business"; a no-result query "pricing zzz" gives "CLOSEST THINGS WE HAVE: Pricing playbook template" (`X5-search.png`, `X10-noresults.png`). Ruling (f) confirmed: built, needed data |
| Changed tests | passed | `buyTickets.test.tsx`: `payButton` `/^Pay · /` to `/^Pay ₦/` (the new copy) and the fee constant read from a field that still defaults to 1575; `screens.test.tsx` and `slider.test.tsx`: only add an answer for the All creators page the rail now reads. No assertion weakened; new tests added beside them |
| tsc | EXIT 0 | |
| jest, route-guard and the touched folders (pay-sheet, communities, community-host, content-detail, events, explore, inbox, unlock), maxWorkers 2, once | EXIT 0 | 56 suites, 1224 tests, all passed |
| gates | EXIT 0 | 10 gates, 1415 files, 0 fail, 18 warn; main is 1412 files, 0 fail, 18 warn (same); baseline check EXIT 0 |
| check_tasks | EXIT 0 | 443 tasks |
| native fingerprint | unchanged | `fingerprint:generate --platform android` is `17ffb13d520882bf144982b61d03f3994c6e40e4` on this branch and on main (default `b9901c63...`, iOS `496a3ee0...`, also equal) |

Rulings:
- (b) the link form kept as a real link: agree. `wawu/c/<slug>` has no scheme or host, so no chat app makes it tappable and nothing resolves a content slug; LINKS-01 A3 already ruled the bare label broken. differs-for-recorded-reason (G-R2S-1, owner for a short link host).
- (f) X5 and X10 built, needed data: confirmed above.
- I32 not drawn: right. No route serves the host's share (G-INBOX-14-1); R-47.

Findings (all low, no round needed):
1. low, differs-for-recorded-reason (G-1724): H14 for a video piece has no thumbnail (the quote carries no cover and a video preview is a clip); the head is the words alone, with no empty square. The board draws one. Reproduce: unlock sheet on the seeded video (`H14-video-nofee.png`).
2. low, NOT RUN: with a fee the sheets were captured but not paid. The stand-in keeps its fee at 0 unless it restarts (and loses its balances), so the Hub's ₦15.75 quote could not be paid against a matching debit. The pay path is the same code with or without a fee (total from the quote's parts), and the new PaySheet and buyTickets tests cover both.
3. low, NOT RUN: E7's brightness raise and caption on a phone (web has neither by design; `brightness.test.ts` covers the call order and the put-back). A phone is the lead's V10.
4. low, NOT RUN: "96% liked" moving after a new rating. `PUT /content/{id}/rating` answered 403 "Only people who bought this can rate it." for a piece the fan had not bought, and the fan bought the other piece only; the invalidate after a rating is covered by a unit test, not seen live.
5. test-gap note: the I33 line is tested for text cost 0 and above 0 in `memberCostLine`; no test mounts the screen while the cost read fails (it then shows only the first sentence, which is correct on reading the code).

Cleanup: stack down, my own Hub restart, the picture server and three worktrees removed; nothing of mine left listening on 9070 to 9089.

## Owner sign-off

_Owner: date, and "go" or what blocks it._
