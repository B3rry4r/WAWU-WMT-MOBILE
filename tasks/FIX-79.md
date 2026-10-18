---
id: FIX-79
title: Tests that fail by timing or by date: the paid thread's answer card, and FIX-78's end dates at New Year
owner: YOU
area: FIX
order: -79
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T1
depends_on: []
decisions: [R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-79 · Tests that fail by timing or by date: the paid thread's answer card, and FIX-78's end dates at New Year

## Current state

As of 18 Oct 2026, built (T1 builder, Sonnet), waiting for the lean verifier. Mobile `wmt/FIX-79` from `origin/wmt/FIX-78` `9a7925a0` merged with `origin/wmt/MERGE-18` `f3a7dcaa` (kept every side; conflicts only in `BACKEND_GAPS.md` (both sides kept), `docs/PROGRESS.md` and `tasks/INDEX.md` (regenerated)). Head in the lead's hand-back. Mobile only; no backend, contract or Fintava change.
- **1 askFlow flake, cause (a) and (b), both fixed.** The log of the MERGE-18 failure (`merge-18-b/logs/rerun-alone.log`) fails at the I5 card: it read "This question is closed." where the test expects "Ask a follow-up for ₦1,500...".
  - **(a) Product, `PaidThreadScreen.tsx` (the `answeredCard` call):** the newest answered question's card said "This question is closed." whenever the creator's terms were not known yet. The terms are two reads after the thread (the profile, then the Hub's pause), so on every open of an answered thread the card first told the person the question was closed, then changed to the offer. It was a wrong I5 state on a slow phone, not a test artefact. Now `followUpOf(terms)` gives `'pending'` until both reads are here, the card draws a loading line (the shared Skeleton, `paid-card-<id>-body-loading`) and says nothing about asking again; "closed" is said only for an older answer or when the Hub says the creator is switched off or paused.
  - **(b) Test, `askFlow.test.tsx`:** the I5 test and the empty-thread test (`states`) read the creator's terms (the offer, the "Ask a question" button) the moment the thread was drawn, and the `loading` test assumed the stand-in had not answered when `render` returned. Each now waits for what it reads (`findByRole` for the offer and the button) or holds the Hub's answer (`hold('thread')`) until the test opens it. No timeout raised, no assertion loosened, every expected word is the same.
  - **The race made to happen every time:** a 300 ms lag on the creator's profile and pause in the stand-in. Old test on old product: 20 of 20 runs red (I5 and the empty-thread test). New test on new product: 20 of 20 green (a first batch showed one red in the loading test, which assumed the Hub had not answered; fixed by holding the thread, then 20 of 20). New test on the old product: the three new gated cases are red 5 of 5.
  - **Under load** (askFlow beside two heavy suites, `dv2-comp` and `explore/screens`, in loops; the machine's own load average was 15 to 20 as well): before 18 of 20 green (the 2 reds were the empty-thread test), after 20 of 20 green.
  - **New cases:** the answer card has no body line, only the loading line, until the terms are here and never says "closed" meanwhile; a creator who turns out paused gets "closed" only once the Hub says so; an older answer is closed at once while only the newest waits. `model.test.ts`: `answeredCard('pending')` and `followUpOf` for none, switched off, paused and on.
- **2 FIX-78's real-clock cases, fixed (tests only).** `publishAndTier.test.tsx` and `tierCheckout.test.tsx` read the real year (`new Date().getUTCFullYear()`), while the screen reads the Lagos year, which turns an hour early (23:00 UTC on 31 Dec is 00:00 on 1 Jan in Lagos). The old cases went red from 23:00 to 23:59 UTC on 31 Dec: four reds at 23:30 UTC (the three year cases and the "on Verify" blurb that built "26 Nov" from the UTC year), all green at 00:30 UTC on 1 Jan and on an ordinary day.
  - Both files now pin the clock (`jest.setSystemTime`, the router renderer's fake clock) to 18 Oct 2026 09:00 UTC in `beforeEach`, and the held tier's default end is the fixed `2026-11-26`. The year cases are tables read at pinned instants: an ordinary day, 22:59:59 UTC on 31 Dec, 23:00:00 (Lagos midnight), 23:30:00 (00:30 on 1 Jan in Lagos, the same instant) and 00:30 UTC on 1 Jan, each with its exact words ("Active until 15 Jul 2027" before the Lagos turn, "Active until 15 Jul" after it; "Ended 15 Jul 2025" and "Ended 15 Jul 2026" by the year). They hold at every moment of the real year because none reads it.
  - `publishAndTier.test.tsx` "a user sees the Hub's dates and counts (active)..." took an end date 40 days out and accepted an optional year; it now gives the Hub a fixed end date and asserts `Active until 26 Nov` exactly.
- **Checks:** tsc EXIT 0; eslint on the changed files EXIT 0 (one old warning, `MB18` unused in `publishAndTier.test.tsx`, not touched); paid-ask, verify and points jest; gates; `npm run tasks`. Counts in the lead's hand-back.
- **Round 2 (18 Oct 2026), after the lean verifier's check (G-FIX-79-1, MEDIUM V6, fixed).** When the creator's profile read failed (a 500, or a dropped connection) the terms stayed unknown for good: the answer card's line and the bottom bar were grey loading bars, with only Back on screen and no way to try again.
  - **What the person sees now:** the thread stays readable (the bubbles, the card's title, Back). The bar is the shared `ErrorState` ("Couldn't check if you can ask", the app's own sentence for the cause: "Something went wrong. Try again." for a 500, "No connection. Check your internet and try again." for a dropped request) with a Try again that reads the creator's profile again (`profile.refetch()`). While it reads, the bar is the loading bar again; on success the offer ("Ask a follow-up · ₦1,500") takes its place; on another failure the error comes back and Try again still works. The newest answer's card says "We couldn't check if you can ask a follow-up. Try again below." (`followUpOf(terms, failed)` is `'failed'`, `answeredCard('failed')`): not a loading bar, never "closed", never an offer by guess. A question that still waits keeps its locked bar and shows no error: it needs no terms.
  - **Where:** `PaidThreadScreen.tsx` (the composer slot and `followUpOf(terms, profile.isError)`), `parts.tsx` (`FailedComposer`: the composer's `Bar` around the shared `ErrorState`; no new error component), `model.ts` (`'failed'`, `TERMS_FAILED_LINE`). Product diff: 3 files, +44 -12.
  - **Tests, red before and green after:** `askFlow.test.tsx` has a stand-in `profile` mode (`'fail'` answers 500, `'drop'` throws the lost request the client reads as no connection) and a read counter. New cases (7 red on the round-1 product, all green after; the waiting-question case is a guard and is green on both): each cause by itself shows the error, the card's line, no loading bar, Back works, Try again makes the second read and the offer appears; Try again while still failing shows the loading bar, then the error, then a third read succeeds; an empty thread with a failed profile; the loading line is two lines high. `model.test.ts`: `followUpOf(null, true)` and `answeredCard('failed')`.
  - **Low (V5), fixed:** the loading line was one line high and the offer is two, so the card grew 18 px when the terms arrived and slid under the composer in a long thread. The loading line is now two lines of the card's leading (35 px, two bars). Measured at 390 px on the web export, light and dark, a long thread: the card is 82.75 px before and after the terms arrive and the list's scroll height is the same (2599 px), so nothing moves.
  - **Low, recorded (G-FIX-79-2, not fixed here):** `src/api/client.ts` has no request timeout, so a read that never answers (a held request) leaves a loading bar for good, here and on every other screen. On a phone the OS usually ends such a request with an error, which now lands in the error above. A client-wide timeout is its own decision (it changes every screen's read and write); the shared client is untouched. Not a backend gap.
- **Low, noticed:** `askFlow.test.tsx` "two taps on Send open one PIN sheet and pay once" prints three "overlapping act() calls" warnings (two unawaited presses in one `act`). It passes and is not the cause of any red; left alone.
- **Next:** the lean verifier checks round 2 (G-FIX-79-1); then the batch.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The MERGE-18 askFlow logs named above; `src/features/paid-ask/PaidThreadScreen.tsx`, `useAskTerms.ts`, `model.ts` (`answeredCard`, `followUpOf`)

## Goal

The answer card in a paid thread never says "This question is closed." while the creator's terms are still being read, and no test in these files fails by timing or by the date the machine runs it on.

## Capability checks

- [x] The newest answered question shows a loading line, not "closed", until the creator's terms are here; then "Ask a follow-up for ₦1,500..." or, for a paused creator, "This question is closed."
- [x] An older answered question says "This question is closed." at once.
- [x] The I5 and empty-thread tests of `askFlow.test.tsx` pass every time with a 300 ms lag on the creator's profile (20 of 20), and the old tests fail every time with it (20 of 20).
- [x] When the creator's profile read fails, the thread stays readable, the bar says so with Try again, Try again reads the profile again, and the offer appears (round 2).
- [x] The year cases of `publishAndTier.test.tsx` and `tierCheckout.test.tsx` pass whatever the real date is, including 23:30 UTC on 31 Dec.

## Owner sign-off

Not needed.
