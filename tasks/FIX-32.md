---
id: FIX-32
title: The last tests that read an answer before it lands, and one that depends on the clock
owner: YOU
area: FIX
order: 247
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [FIX-31]
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# FIX-32 · The last tests that read an answer before it lands, and one that depends on the clock

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-31.md` in full: the two causes (cold start, an answer read before it lands), the delay harness, the rule that nothing is weakened
- `tasks/INBOX-05.md` (defect 38, note 37), `tasks/LEGAL-02.md`

## Goal

No test in the app fails because of the machine's load or the time of day. The full check blocks a push only for a real fault.

## Scope (tests only; no product file, gate, baseline, jest config or package file)

1. `src/features/explore/__tests__/screens.test.tsx`: "X2, X3, X13 · Categories › a creator card in a category is not pressable yet (M5 is ME-02), and its Follow still follows" reads `categories-creator-p1` before the creators land (failed the lead's full check on 11 Oct; passes alone).
2. `src/features/legal/__tests__/LegalChatScreen.test.tsx` (or where LEGAL-02's chat tests live): the three tests FIX-31 round 2 found racing under delayed answers: "a consultant's message arrives without a refresh", "... matter has moved past awaiting a quote ... a new one starts", "an unfinished conversation is picked up ... 404".
3. `src/features/communities/__tests__/RoomScreen.test.tsx`: INBOX-05 defect 38. Its `message()` helper stamps messages about 16.5 minutes ago and expects the day separator `Today`, so it fails in the 17 minutes after local midnight. Pin the clock, as the test at its line 286 already does.
4. INBOX-05 note 37: a test that a refused next page is asked for once (dropping `!isFetchNextPageError` must fail it).
5. `MeScreen` M1 and `events/host/hostScreens` E13 to E15: stalls seen under load in other agents' full checks; find whether either reads before an answer lands or pays a cold start, and fix it the FIX-31 way, or record that it is load only.

## Capability checks

- [ ] Each fixed test fails on the old file at a delay-harness seed (or at the clock just after midnight) and passes on the new one at seeds 0 to 5 and 21 to 23.
- [ ] Each changed file passes alone 10 times in a row.
- [ ] Nothing is weakened: no assertion removed or loosened, no skip, retry or raised timeout.
- [ ] The full check, common-rules form, exits 0.

## Builder report

## Verifier report

## Owner sign-off
