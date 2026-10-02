# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 14 of 165.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 61 | 50 | 32 | 30 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 8 | 6 | 0 | 0 |

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

- 2 Oct 2026 · SHARED-01 fix round 1 (merged UI-02's main): one `Avatar` (UI-02's API: `AvatarHue`, `initialsOf`, `source`, `decorative`; the kit's sizes, plus `hues` and bundled images), `CurrencyFlag`, and eight kit `Text` variants (`kvLabel`, `kvValue`, `meta`, `bannerBody`, `muted`, `cardTitle`, `sheetTitle`, `sheetTitleSm`). `Money` is exactly `size` tall on the web (kobo and ₦ runs get their own line height there; on a phone only the outer Text has one, confirmed by V10 on the first Android build) and tracks at the kit's -0.025em. SHARED-CHANGES applied rows MONEY-03 #6 to #8 and MONEY-02 #7 list what MONEY-02 and MONEY-03 now delete.
- 2 Oct 2026 · SHARED-01: shared `Avatar` and `CurrencyFlag` (the kit's `Av` and `Flag`) and seven kit `Text` variants (`kvLabel`, `kvValue`, `meta`, `muted`, `cardTitle`, `sheetTitle`, `sheetTitleSm`) are on main; `Money` is exactly `size` tall (kobo and ₦ runs get their own line height) and tracks at the kit's -0.025em. MONEY-02 and MONEY-03 drop their local copies (SHARED-CHANGES applied rows MONEY-03 #6 to #8, MONEY-02 #7).
- 2 Oct 2026 · OPS-02 merged: Fintava sandbox re-run with the merchant active (wallets, wallet-to-wallet, freeze work; bank sends and bills still refused by Fintava, question 17). `docs/fintava/` corrected with every fact; G-10 filed (a frozen wallet can't receive).
- 2 Oct 2026 · Over-the-air updates added (expo-updates, EAS Update on project @moxnafrica/wawu-wmt): once testers install the Android preview build, each merge to main can reach their phones without reinstalling.
- 2 Oct 2026 · OPS-02 re-run · Fintava's sandbox merchant is active now (since 09:22 UTC). Two test customers opened (`TIER_2`), wallet-to-wallet works in every direction with a ₦0 fee, freeze blocks money in and out; bank sends and bill purchases are still refused ("Unable to find customers"). Results in `docs/fintava/sandbox/` (README lists 9 contradictions), tier answers in `docs/fintava/limits.md`. ₦20 of sandbox charges.
- 2 Oct 2026 · UI-02 merged (lists, cards, sheets, tabs, skeleton, empty and error states; UI-01 fixes: button padding 14/18/24, visible focus ring, no browser outline). Still to match the design, Developer 1's next commit before UI-03: media-card gradient caption (expo-linear-gradient), sheet shadow at the 0.5 scrim token, the selected segment's soft shadow.
- 2 Oct 2026 · UI-02 built: list, card, row, chip, segmented tab, bottom sheet, skeleton, empty and error components; Button padding 14/18/24, double focus ring, no web outline; 51 new tests; status verifying.
- 2 Oct 2026 · MONEY-04 merged: the wallet contract (29 money routes, declared and not served yet) is on backend main (PR #24) and mobile types are regenerated from it. MONEY-09 (transaction PIN) can start.
- 2 Oct 2026 · Builders now replace any stand-in for a shared component as soon as main has it, and verifiers fail a branch that keeps one (BUILDER.md, VERIFIER.md). Fintava fees: the dashboard rates in `docs/fintava/fees.md` are final; the sandbox's ₦0 doesn't change them.
- 2 Oct 2026 · MONEY-04 round 2: kobo fields are `integer` in the contract, the never-null list corrected to 11, and three Lead rulings applied and recorded (merchant cap from config on merchant-wallet money only, purchases count toward the daily limit, W26 grouped unlock rows); status verifying.
- 2 Oct 2026 · MONEY-04 built: money conventions (kobo, +234, one error shape, Idempotency-Key, PIN in `X-Transaction-Pin`, cursor pages) and the Naira wallet contract, 29 routes declared in wawu-backend `src/money/` and in the contract marked not served yet; artboard mapping and 11 canvas-versus-Fintava conflicts for the owner in wawu-backend `docs/contract/WALLET.md`; status verifying.
- 2 Oct 2026 · UI-01's open questions settled: Money takes kobo and older naira routes are converted once in `src/api` (R-21); component sizes are the board kit's own, no owner ruling needed (R-22, SHARED-CHANGES row 6 closed). Developer 1 fixes the rest in UI-02's first commit: button side padding 14/18/24, focus ring visible on accent buttons, no browser outline on web, duplicate import in Button.tsx.
- 2 Oct 2026 · UI-01 merged (text, buttons, inputs, money components). Its local icon set was folded into the shared `Icon` (Lucide names: ChevronLeft, Search, Copy, X...), so there is one icon component. `npm run icons` now also catches one-letter names (`X`). Developer 1: merge main into UI-02 before going further.
- 2 Oct 2026 · UI-01 fix round 1: back icon is a chevron, field sizes match the design, no browser outline on focused fields, button ring for keyboard focus only, 10 new tests, token request row 6 in SHARED-CHANGES.md.
- 2 Oct 2026 · UI-01 built: Text, Button, IconButton, TextField, Money, Credits and Icon in `src/components/`, a dev-only gallery at `/dev/components`, 22 new tests; status verifying.
