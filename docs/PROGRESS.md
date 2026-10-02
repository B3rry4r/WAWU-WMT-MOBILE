# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 14 of 165.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 61 | 49 | 32 | 30 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 1 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 8 | 6 | 0 | 0 |

## Being verified

- [AUTH-03](../tasks/AUTH-03.md) Phone check at sign-up, and the email trap (Developer)

## Done

- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [OPS-04](../tasks/OPS-04.md) Designer: Shop to Schools, the ₦ glyph, real numbers (You)
- [OPS-05](../tasks/OPS-05.md) Update the other repos' CLAUDE.md for today's rulings (You)
- [MONEY-01](../tasks/MONEY-01.md) Protected route list and regression suite (You)
- [CHECK-0](../tasks/CHECK-0.md) Checkpoint 0: safe to start building (You)
- [MONEY-04](../tasks/MONEY-04.md) Money conventions and the wallet contract (You)
- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)
- [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring (Developer)
- [SHELL-03](../tasks/SHELL-03.md) Tester builds (Developer)
- [UI-01](../tasks/UI-01.md) Core components: text, buttons, inputs, money (Developer)
- [UI-02](../tasks/UI-02.md) Lists, cards, sheets, tabs and states (Developer)

## Next up

- **You:** [OPS-07](../tasks/OPS-07.md) Rule the web features missing from the canvas (D14), [MONEY-02](../tasks/MONEY-02.md) The PIN sheet, [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet
- **Developer:** [UI-03](../tasks/UI-03.md) Avatars, ticks and chips, [AUTH-01](../tasks/AUTH-01.md) Sign in and password reset, [AUTH-02](../tasks/AUTH-02.md) Welcome and why you're here
- **Developer 2:** [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat, [BILLS-01](../tasks/BILLS-01.md) Pay a bill: choose biller, meter and amount
- **Developer 3:** [EVENTS-01](../tasks/EVENTS-01.md) Events: list, filters, detail, sold out, [EVENTS-02](../tasks/EVENTS-02.md) Hosting an event: hybrid, kinds, one-step submit, [PROS-01](../tasks/PROS-01.md) Find a professional

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · AUTH-03 fix round 1: the phone routes act only on a pending sign-up, wrong codes count per number and are never reset by a resend (12 a day), every kind of number gets the same answer, unconfirmed sign-ups expire after 24 h and release their email, parallel requests no longer 500, Nigerian numbers only, limits per address, number and day in the database; the sign-in answer carries `accountType` when the account has one (R-36). All limits PROVISIONAL.
- 2 Oct 2026 · AUTH-03: wawu-id texts a 6-digit sign-up code (`POST /auth/signup`, `/auth/phone/verify/start`, `/auth/phone/verify/confirm`) through Fintava's SMS route; the fourth wrong code makes the user wait (provisional 900 s); a phone-verified account can sign in without a verified email; occupation and account type are stored. Additive migration; real SMS send NOT RUN (needs Fintava sandbox keys).
- 2 Oct 2026 · UI-02 follow-up merged: media-card gradient caption (expo-linear-gradient), sheet shadow at the 0.5 scrim token, the selected segment's soft shadow. First Android preview build is out; an over-the-air update carries main to it.
- 2 Oct 2026 · UI-02 follow-up: shelf media card draws its caption over the design's `scrimCard` gradient (expo-linear-gradient); bottom sheet shadow is 0.5 black and the selected segment has the kit's soft shadow, both themes; theme shadow tokens requested (SHARED-CHANGES row 7).
- 2 Oct 2026 · SHARED-01 merged: shared `Avatar` (one, UI-02's API with the kit drawing), `CurrencyFlag`, Text variants (kvLabel, kvValue, meta, muted, bannerBody, cardTitle, sheetTitle, sheetTitleSm) and Money at exactly its size (per-run line heights on web only). Phone check (V10) waits on the Android build.
- 2 Oct 2026 · Each developer's file (docs/people/DEV*.md) now says to keep working through the list without waiting to be prompted: pull main, take the next startable task, build, verify, push, repeat; ask only when everything left is blocked.
- 2 Oct 2026 · The app now points at the live services the web uses, `https://api.wawuafrica.com` and `https://id.wawuafrica.com` (eas.json, `src/api/env.ts` fallbacks, BUILDS.md). The `.invalid` placeholders and the stale Railway address are gone.
- 2 Oct 2026 · SHARED-01 fix round 1 (merged UI-02's main): one `Avatar` (UI-02's API: `AvatarHue`, `initialsOf`, `source`, `decorative`; the kit's sizes, plus `hues` and bundled images), `CurrencyFlag`, and eight kit `Text` variants (`kvLabel`, `kvValue`, `meta`, `bannerBody`, `muted`, `cardTitle`, `sheetTitle`, `sheetTitleSm`). `Money` is exactly `size` tall on the web (kobo and ₦ runs get their own line height there; on a phone only the outer Text has one, confirmed by V10 on the first Android build) and tracks at the kit's -0.025em. SHARED-CHANGES applied rows MONEY-03 #6 to #8 and MONEY-02 #7 list what MONEY-02 and MONEY-03 now delete.
- 2 Oct 2026 · SHARED-01: shared `Avatar` and `CurrencyFlag` (the kit's `Av` and `Flag`) and seven kit `Text` variants (`kvLabel`, `kvValue`, `meta`, `muted`, `cardTitle`, `sheetTitle`, `sheetTitleSm`) are on main; `Money` is exactly `size` tall (kobo and ₦ runs get their own line height) and tracks at the kit's -0.025em. MONEY-02 and MONEY-03 drop their local copies (SHARED-CHANGES applied rows MONEY-03 #6 to #8, MONEY-02 #7).
- 2 Oct 2026 · OPS-02 merged: Fintava sandbox re-run with the merchant active (wallets, wallet-to-wallet, freeze work; bank sends and bills still refused by Fintava, question 17). `docs/fintava/` corrected with every fact; G-10 filed (a frozen wallet can't receive).
- 2 Oct 2026 · Over-the-air updates added (expo-updates, EAS Update on project @moxnafrica/wawu-wmt): once testers install the Android preview build, each merge to main can reach their phones without reinstalling.
- 2 Oct 2026 · OPS-02 re-run · Fintava's sandbox merchant is active now (since 09:22 UTC). Two test customers opened (`TIER_2`), wallet-to-wallet works in every direction with a ₦0 fee, freeze blocks money in and out; bank sends and bill purchases are still refused ("Unable to find customers"). Results in `docs/fintava/sandbox/` (README lists 9 contradictions), tier answers in `docs/fintava/limits.md`. ₦20 of sandbox charges.
- 2 Oct 2026 · UI-02 merged (lists, cards, sheets, tabs, skeleton, empty and error states; UI-01 fixes: button padding 14/18/24, visible focus ring, no browser outline). Still to match the design, Developer 1's next commit before UI-03: media-card gradient caption (expo-linear-gradient), sheet shadow at the 0.5 scrim token, the selected segment's soft shadow.
- 2 Oct 2026 · UI-02 built: list, card, row, chip, segmented tab, bottom sheet, skeleton, empty and error components; Button padding 14/18/24, double focus ring, no web outline; 51 new tests; status verifying.
- 2 Oct 2026 · MONEY-04 merged: the wallet contract (29 money routes, declared and not served yet) is on backend main (PR #24) and mobile types are regenerated from it. MONEY-09 (transaction PIN) can start.
