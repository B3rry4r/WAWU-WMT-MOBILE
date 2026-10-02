# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 14 of 176.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 67 | 52 | 34 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 8 | 6 | 0 | 0 |

## Done

- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)
- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring (Developer)
- [OPS-04](../tasks/OPS-04.md) Designer: Shop to Schools, the ₦ glyph, real numbers (You)
- [SHELL-03](../tasks/SHELL-03.md) Tester builds (Developer)
- [OPS-05](../tasks/OPS-05.md) Update the other repos' CLAUDE.md for today's rulings (You)
- [UI-01](../tasks/UI-01.md) Core components: text, buttons, inputs, money (Developer)
- [MONEY-01](../tasks/MONEY-01.md) Protected route list and regression suite (You)
- [UI-02](../tasks/UI-02.md) Lists, cards, sheets, tabs and states (Developer)
- [CHECK-0](../tasks/CHECK-0.md) Checkpoint 0: safe to start building (You)
- [MONEY-04](../tasks/MONEY-04.md) Money conventions and the wallet contract (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [MONEY-02](../tasks/MONEY-02.md) The PIN sheet
- **Developer:** [UI-03](../tasks/UI-03.md) Avatars, ticks and chips, [AUTH-03](../tasks/AUTH-03.md) Phone check at sign-up, and the email trap, [SETTINGS-07](../tasks/SETTINGS-07.md) Notification switches the server honours
- **Developer 2:** [INBOX-06](../tasks/INBOX-06.md) Free chat between users, [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · Backlog fixed from the two task reviews: Android first (iOS is RELEASE-03), no staging, fingerprint or face instead of Face ID, links between screens (R-27), the designer brief in every screen task, fees in every payment check, 12 new tasks (OPS-09, OPS-10, KYC-05, SUPPORT-01, INBOX-21, LEGAL-07, SETTINGS-07, SETTINGS-08, WALLET-35, WALLET-36, SCHOOLS-12, RELEASE-03), D14 and D15 closed, Lead rulings R-24 to R-35, every list reordered so nothing comes before what it needs and ads land before CHECK-3.
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
- 2 Oct 2026 · Builders now replace any stand-in for a shared component as soon as main has it, and verifiers fail a branch that keeps one (BUILDER.md, VERIFIER.md). Fintava fees: the dashboard rates in `docs/fintava/fees.md` are final; the sandbox's ₦0 doesn't change them.
