# ADS-01 · round history

Moved out of [tasks/ADS-01.md](../ADS-01.md) word for word, oldest first. The current state is in that file.

## Builder report

Mobile `wmt/ADS-01` only; no backend or wawu-id change, no migration. Files: new `src/features/ads/{api.ts,useAd.ts,look.ts,SponsoredStep.tsx,SponsoredSlot.tsx}` and `__tests__/{api.test.ts,ReaderSponsored.test.tsx,TodaySponsored.test.tsx,steps.test.ts}`; edited `src/features/tgif/{TgifReader.tsx,model.ts}`, `src/app/tgif.tsx`, `src/features/home/TodayScreen.tsx` (SHARED-CHANGES ADS-01 F1); `contract/` and `src/api/schema.generated.ts` regenerated (ADS-01 #1); `BACKEND_GAPS.md` G-760, G-761.
- **H33, Get tickets and Skip (a user can):** spec `ReaderSponsored` (17 tests) drives the real reader: six steps, the card at step 5 of 6, the Hub's words and button word, the button calls `onOpenEvent(id)`, Skip lands on the takeaway; a tap on the words does not skip. Live: web export through the stack, Get tickets opened the seeded event (E2) and back returned to the card; Skip showed the takeaway.
- **Today (H36):** spec `TodaySponsored` (14 tests): TGIF off draws the card right after the money card and opens `/events/[id]`; TGIF on, a switch that cannot be read, no campaign, an error, a destination this build cannot open, loading: nothing drawn and the card is not asked for when TGIF shows. Live: same run.
- **Counted once (ADS-05):** specs assert one view, one tap, one skip however often pressed or re-rendered, and no view while Today is not in front. Live: after four runs by one person the Hub held one view, one tap and one skip for the reader's campaign and one view and one tap for Today's (`AdEvent`, `AdDailyTotal`).
- **V6:** no campaign (`data: null`), loading, failure and an unknown destination each draw nothing, by their real cause, never a frame; a card that arrives after the person is on the takeaway is not put in front of them (spec).
- **V5:** H33 and H36, dark and light, 390 wide, beside the artboard, in the evidence folder named in Current state. Differences: the artboard's phone status bar; the line "Ads keep TGIF free" (left out, G-760).
- **Figures not hard-coded:** the event, place, date and price, the button word and the picture are the Hub's; only SPONSORED and Skip are the app's.
- **Gates before and after:** `npm run gates` 0 fail, 5 warn, 0 accepted (581 files) before; 0 fail, 5 warn, 0 accepted (590) after. Full local check (`npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks`): EXIT 0, 159 suites and 2878 tests passed, gates 0 fail / 5 warn / 0 accepted (590 files); mobile CI cannot run (billing), so this is the local run, on the code as committed.
- **Not done:** a verifier's V9 read-back with the real wawu-id (the stack ran the mock WAWU ID, whose login body is not the one the app reads, so the pictures were taken signed in with the mock's own token placed in the browser's storage); nothing else open.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

