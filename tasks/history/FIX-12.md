# FIX-12 · round history

Moved out of [tasks/FIX-12.md](../FIX-12.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 18 Oct 2026 (Sonnet agent, bundle S9). Backend `wmt/S9` `50066b9` (shared with EVENTS-12), mobile `wmt/S9` (records).
- **Files (backend):** `src/event/event.service.ts` (the cancelled check in `update`, `EVENT_CANCELLED_MESSAGE`), `src/event-ticketing/event-ticketing.service.ts` (`assertNoneSold` names each tier once; `editableEvent` uses the shared sentence), new `src/event-ticketing/tests/event-price-edit-followups.contract.spec.ts` (11 tests).
- **R7 and R8** (the organiser's `remaining` leaves a retired tier out): a published event, 3 tickets in an open checkout, the host reprices (the old Regular is retired), the checkout settles on the retired tier, 2 more sell on the new one: dashboard sold 5, remaining 108 (110 on sale less 2). Mutants: retired capacity counted gives 208, retired sales subtracted gives 105; each fails both tests.
- **R10** (a PUT matches the tiers on sale only): after a retire, the host sends the old Regular back with VIP: a new Regular row is on sale, the retired row stays retired. Mutant (match retired rows too): the PUT is "no change", Regular is not on sale; killed.
- **O8:** after sales on the retired Regular and on the Regular that replaced it, the 409 reads `Tickets have already sold for "Regular". Add a new tier instead of editing one people have bought.` Two different names still both appear. Fails before (it named "Regular" twice), mutant killed.
- **Cancelled:** PATCH and PUT on a `cancelled` event answer 409 `This event has been cancelled.`, nothing written (status, text, `updatedAt` unchanged); a recap field is refused too; on a live event both work as today. PATCH failed before (200, `pending`).
- **What a price change leaves alone:** the buyer who paid the old 5,000 keeps the paid order, the 3 tickets and the amount, and the gross counts 3 at 5,000 plus 2 at 6,000.
- **Fails before, passes after:** on `4c52e57` the new spec fails exactly 3 tests (O8 and the two PATCH tests); R7, R8 and R10 pass there because the code was right, and are held by 5 mutants (R7, R8, R10, O8, the cancelled check), all killed.
- **Checks:** same as EVENTS-12 (one push): tsc EXIT 0, eslint EXIT 0, this spec 11/11, `event-tickets-review`, `event-edit-races`, `event-purchase-races` pass, protected suite EXIT 0 (253/253), gates EXIT 0, `contract:build` adds nothing for this task.
- **Gap:** G-FIX-12-1: a sold-tickets 409 caused only by a sale on a retired tier names a tier the host sees as unsold (same name, other price); a plain sentence for that case needs the Hub to say which tier is hidden. Left alone, low, for SWEEP-EVENTS.
- **NOT RUN:** CI (the lead watches), the full backend suite, Fintava and Flutterwave (not called).

## Verifier report

_Not started._

