# REF-03 · round history

Moved out of [tasks/REF-03.md](../REF-03.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, 17 Oct 2026. Files: `src/features/referral/` (api, model, parts, InviteScreen, RewardMoment, RulesScreen, ShareCard, ShareCardScreen, cardPicture (+ `.web`), useMoments, seen, pendingCode, tests), routes `src/app/invite.tsx`, `invite-rules.tsx`, `invite-card.tsx`, `r/[code].tsx`; edited `src/app/(tabs)/me.tsx` and `src/features/me/{MeScreen,ProfileHeader}.tsx` (the gift button), `src/app/(tabs)/index.tsx` (one hook), `package.json` and `package-lock.json` (view-shot, SHARED-CHANGES REF-03 #1). No `src/components` or `src/api` change.
- Link and code copy and share (RF1): `InviteScreen.test.tsx` (Copy writes the link and the code, says Copied only when the phone took it); Share opens RF2 and the help button RF4 (`inviteRoutes.test.tsx`, through the real routes).
- Brought, verified, earned, pending, level, next milestone from the Hub: `InviteScreen.test.tsx` (RF1, RF1a, RF1b, no card once every milestone is reached) and `model.test.ts`; checked against the real Hub on batch 7 (REF-02) with seeded rows.
- RF4 hold days and multipliers from the Hub: `RulesScreen.test.tsx` (10 days in, no "7"), `model.test.ts`.
- No outside brand on the card: `ShareCardScreen.test.tsx` scans the card for Instagram, WhatsApp and the providers. Share hands the picture to the phone's share sheet; Save to the photos; a phone with no share sheet shares text.
- RF3 and RF3a once per phone and account: `InviteScreen.test.tsx` (first look silent, told once, not told again, held and cancelled are not told, oldest first).
- Link V10: `referralLink.test.tsx` (signed out: welcome and the code waits; after sign-in Home claims it once; signed in: claimed at once; a refusal drops it; offline keeps it).
- Loading, empty and error states are entered by their real cause (a hanging answer, `brought` 0, an offline phone, an unreadable answer): the same files.
- Gates before and after: 0 fail, 5 warn (the PROVISIONAL warnings are other tasks'); baseline entries 0. Typecheck 0, lint 0. Full check: 3,549 tests passed, 203 suites passed; final run in this file's history line.
- Pictures at 390 px, light and dark, from a web export through a local stack (Hub on batch 7, mock WAWU ID, ports 7700 to 7707) beside the rendered boards: RF1a, RF1, RF1b, RF2, RF3, RF3a and RF4 in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ref-03-b/pics/` (new, some, close, card, moment, milestone, rules); boards in `build/design_shots/`. Taken from one real Hub answer each; the rows were seeded in the stack's own database. The web build has no status bar, so the boards' top is 50 px lower.
- Not done: the native share and save (view-shot, share sheet, photos) are covered by tests with the modules stood in; they need a dev build on a phone (NOT RUN here). QR and the "Who Made This? chat" target are not drawn (R-47).
- Gaps filed: G-812 (updated), G-830, G-831. Shared change: REF-03 #1 applied. Questions for the owner: the address a link is shared as (G-812); whether a reward needs a push notice (G-830).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

