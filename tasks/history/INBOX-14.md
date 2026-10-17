# INBOX-14 · round history

Moved out of [tasks/INBOX-14.md](../INBOX-14.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** new `src/features/community-pass/` (api, model, usePassPurchase, PassScreen, tests), `src/features/community-host/` (api, model, NewCommunityScreen, CreatedScreen, JoinRequestsScreen, tests), `src/features/communities/CoverHeader.tsx`, routes `src/app/community/{pass/[id],new,created/[id],requests/[id]}.tsx`; edited CommunitiesView, useCommunities, routes, RoomScreen, RoomHeader (CreditPill shared), CreateScreen, create.tsx, push/routes.ts and their tests (SHARED-CHANGES INBOX-14 #1 and #2). Contract merged key by key from `28cea21` into MERGE-11's.
- **Capability checks, how tested (stub Hub, jest):** a user pays a 30 day pass with the PIN, one purchase carrying the quote they saw, then I31 says what was paid and the end day; the button carries the total (price plus the Hub's charge); a fresh quote is asked on the tap; a wrong PIN then the right one is two attempts and one payment; a lost answer then a retry sends the same key and gives one pass; a short wallet shows what is missing, offers no Add money and sends nothing; no wallet leads to Open your wallet; Renew early and a pass that ended; a removed member reads the Hub's sentence and sees no Pay; the host is inside. I32: Private without a price, with a price of 0, or without a picture sends nothing; the room built for the Hub carries `passPriceKobo` in kobo and a picture, an open room never carries a price, whatever the Hub refuses is shown in its words (lead note, INBOX-24 finding 3).
- **Defaults (agent), owner may override:** I31 draws "Your pass ends on <day>" and a Renew tap, never "Renews" or "Cancel any time" (R-63: no automatic debit); messages in a pass room still cost their credit (G-INBOX-24-4), so the board's "text and emoji are free" line is not drawn; the board lets the name run past the picture, here it sits on the picture's bottom edge; gaps of 2, 6 and 10 are the nearest token; I34 shows the handle and how long ago (G-INBOX-14-2).
- **Gaps filed:** G-INBOX-14-1 to -5 (the host's share and message price, request row detail, follows in the room, the host's name, create without an idempotency key). Not drawn for want of a source: "Free to host", "You keep 85%", "Members pay 1 credit a message", "Bisi and 12 people you follow", "Answers requests within a day".
- **Not done:** see Current state (the stack run, the pictures, four entries, the host's way to I34). `git checkout -- <file>` was run once on a generated contract file of my own (a slip, restored from the commit; nothing of anyone else's).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

