# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 17 of 176.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 63 | 52 | 34 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 1 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 11 | 6 | 0 | 0 |

## Being verified

- [MONEY-06](../tasks/MONEY-06.md) Fintava client (You)

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
- [MONEY-02](../tasks/MONEY-02.md) The PIN sheet (You)
- [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet (You)
- [MONEY-09](../tasks/MONEY-09.md) Transaction PIN (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend
- **Developer:** [UI-03](../tasks/UI-03.md) Avatars, ticks and chips, [AUTH-03](../tasks/AUTH-03.md) Phone check at sign-up, and the email trap, [SETTINGS-07](../tasks/SETTINGS-07.md) Notification switches the server honours
- **Developer 2:** [INBOX-06](../tasks/INBOX-06.md) Free chat between users, [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · MONEY-06 · Fintava client built in wawu-backend `src/fintava/` beside Flutterwave (no route served): every plan call typed in kobo, our reference on every send, reconcile before any resend, no secret in logs; sandbox run 25 passed, 5 NOT RUN (charged checks, no new customers, payouts blocked by question 17, webhooks are MONEY-07's); new fact: lookups answer `200 {}` for SUCCESS records too. To verifying.
- 2 Oct 2026 · MONEY-03 merged: the pay-from-wallet sheet (purchase H14/H17/H18 and the send variant W10) matching the canvas to the pixel on shared parts only. Shared changes with it: MediaCard byline and image, IconTile strokeWidth, Card and BottomSheet inset hairlines, exact fractional line heights, and the kit's `normal` leading on kvLabel/kvValue/meta/cardTitle/errorLine/linkStrong.
- 2 Oct 2026 · MONEY-03 · Lead ruling applied: kit variants on `line-height: normal` use `canvasNormalLineHeight` in the theme; the pay sheet's per-line overrides removed; H14, H17, H18, W10 and W11 still equal to the canvas.
- 2 Oct 2026 · MONEY-03 · Theme `style()` line heights now exact, as CSS (Lead-authorised), plus `canvasNormalLineHeight`; H18 now matches (edge 485); H14, H17, W10 and W11 unchanged and equal to the canvas.
- 2 Oct 2026 · MONEY-03 · Round 8: MediaCard `byline`/`image`, IconTile `strokeWidth` and Card's inset edge (Lead-authorised); the pay sheet uses MediaCard and IconTile; H14, H17, W10 and W11 match the canvas at the measured points; back to verifying.
- 2 Oct 2026 · MONEY-03 · BottomSheet's top hairline drawn inset, as the kit does (Lead-authorised): H14, H17 and W11 panel edge to grabber 9 = 9; W11's title, dots and keys unchanged.
- 2 Oct 2026 · MONEY-03 · Round 6: the pay sheet passes `gap={16}` to BottomSheet (H14/H17 grabber to header 20 = 20); W10 matches the canvas (160 = 160) after trimming "Sending to" to the browser's normal line height; no-wallet state has no Pay (R-27).
- 2 Oct 2026 · MONEY-03 · Round 5: the pay sheet uses the shared BottomSheet, GroupedList, KeyValueRow, Card, Avatar, CurrencyFlag and Text variants; every local copy deleted; W10 avatar-to-card 161 px against 160; BottomSheet `gap` prop requested.
- 2 Oct 2026 · MONEY-03 · Round 4: the pay sheet uses UI-01's `Button`, `Money` and `Text` (local copies deleted); requests filed for the kit's missing `Text` sizes, `Money`'s kobo line height (W10 is 4 px taller until then) and shared `Avatar`/`CurrencyFlag`; back to verifying.
- 2 Oct 2026 · MONEY-03 · Round 3 follow-up: main 6b7eaff merged; the Fees-row ruling renumbered to R-23; the pay sheet's failed mark is `X` (as W14) now that the icon set has it; the X generator request row removed.
- 2 Oct 2026 · MONEY-03 · Round 3: owner overruled two deferrals; the pay sheet now uses the shared Lucide `Icon` and `VerifiedTick` (View-drawn icons deleted) and has a W10 `send` variant (faded kobo, Note after Total). Fees-row ruling recorded as R-23. Back to verifying.
- 2 Oct 2026 · MONEY-03 · Round 2: verified tick in the pay sheet header, 1 px lines, Fees subtotal for two-part fees, double-tap guard on Pay; back to verifying.
- 2 Oct 2026 · MONEY-03 · Pay-from-wallet sheet built (`src/components/pay-sheet/`): price, fee breakdown and total in kobo, enough / not enough with shortfall and Add top-up / paying / still confirming / failed / no wallet; to verifying.
- 2 Oct 2026 · Owner stops narrowed (WORKFLOW section 10): agents decide anything with a sensible default, record it, and carry on; only invented money or legal facts, ledger mismatches, real data loss and destructive git go to the owner. No fix-round limit. Sign-up defaults recorded as R-36.
- 2 Oct 2026 · MONEY-02 merged: the PIN sheet every payment reuses. Fingerprint or face (whatever the phone has), "<Name> failed. Use your PIN.", lock countdown, the shared BottomSheet (new `gap` prop) and Text (`errorLine`, `linkStrong`), matching W11 exactly. Adds expo-local-authentication: the next Android build carries it.
