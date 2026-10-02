# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 16 of 176.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 65 | 52 | 34 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 10 | 6 | 0 | 0 |

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
- [MONEY-09](../tasks/MONEY-09.md) Transaction PIN (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet
- **Developer:** [UI-03](../tasks/UI-03.md) Avatars, ticks and chips, [AUTH-03](../tasks/AUTH-03.md) Phone check at sign-up, and the email trap, [SETTINGS-07](../tasks/SETTINGS-07.md) Notification switches the server honours
- **Developer 2:** [INBOX-06](../tasks/INBOX-06.md) Free chat between users, [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · MONEY-02 merged: the PIN sheet every payment reuses. Fingerprint or face (whatever the phone has), "<Name> failed. Use your PIN.", lock countdown, the shared BottomSheet (new `gap` prop) and Text (`errorLine`, `linkStrong`), matching W11 exactly. Adds expo-local-authentication: the next Android build carries it.
- 2 Oct 2026 · MONEY-09 merged (transaction PIN on the server: 4 digits, argon2id, locks after 5 wrong tries for PIN_LOCK_MINUTES, X-Transaction-Pin guard; verified with no defects). Backend PR #25.
- 2 Oct 2026 · Task backlog reviewed and fixed (199 tasks): order and dependencies, Android first, no staging (tester builds use the live services; checks run locally with the sandbox), biometric not Face ID, the designer brief in every screen task, links between screens, duplicates removed, Lead rulings R-24 to R-35. Each person's first tasks are startable now.
- 2 Oct 2026 · Backlog fixed from the two task reviews: Android first (iOS is RELEASE-03), no staging, fingerprint or face instead of Face ID, links between screens (R-27), the designer brief in every screen task, fees in every payment check, 12 new tasks (OPS-09, OPS-10, KYC-05, SUPPORT-01, INBOX-21, LEGAL-07, SETTINGS-07, SETTINGS-08, WALLET-35, WALLET-36, SCHOOLS-12, RELEASE-03), D14 and D15 closed, Lead rulings R-24 to R-35, every list reordered so nothing comes before what it needs and ads land before CHECK-3.
- 2 Oct 2026 · MONEY-02 · Lead-authorised shared additions: `BottomSheet` takes a `gap` (default 18; the PIN sheet passes W11's 14) and `Text` gains `errorLine` and `linkStrong` from the kit. The PIN sheet now matches W11's spacing from the grabber exactly. Back to verifying.
- 2 Oct 2026 · MONEY-02 · The PIN sheet now uses the shared `Text` (`sheetTitleSm`, `muted`) and UI-02's `BottomSheet`; its own frame and the matching kit constants are gone. SHARED-CHANGES 1.7 applied by SHARED-01; request 10 asks `BottomSheet` for a `gap` prop. Back to verifying.
- 2 Oct 2026 · MONEY-02 · Fix round 2: kit sizes (R-22) and shared `formatMoney`; the biometric key is whatever the phone has (fingerprint or face, `expo-local-authentication`, owner ruling) with "<Name> failed. Use your PIN."; `Fingerprint` added to the icon set; Face ID gap renumbered G-9. Back to verifying.
- 2 Oct 2026 · MONEY-02 · Fix round 1: the PIN sheet uses the shared `Icon`, answers follow MONEY-04's contract (403 `pin_incorrect.triesLeft`, 423 `pin_locked.lockedUntil`), the lock shows a running clock, the busy flag resets when the sheet hides mid-check, and the tests no longer time out on a cold cache. Face ID refusal copy is an open question for the owner. Back to verifying.
- 2 Oct 2026 · MONEY-02 · The PIN sheet built in `src/components/pin-sheet/` (entering, wrong PIN with tries left, locked with a countdown, Face ID key, submitting, error); tries and lock time come from the server's answer. Dev-only preview at `/preview/pin-sheet`. Waiting for verification.
- 2 Oct 2026 · UI-02 follow-up merged: media-card gradient caption (expo-linear-gradient), sheet shadow at the 0.5 scrim token, the selected segment's soft shadow. First Android preview build is out; an over-the-air update carries main to it.
- 2 Oct 2026 · UI-02 follow-up: shelf media card draws its caption over the design's `scrimCard` gradient (expo-linear-gradient); bottom sheet shadow is 0.5 black and the selected segment has the kit's soft shadow, both themes; theme shadow tokens requested (SHARED-CHANGES row 7).
- 2 Oct 2026 · SHARED-01 merged: shared `Avatar` (one, UI-02's API with the kit drawing), `CurrencyFlag`, Text variants (kvLabel, kvValue, meta, muted, bannerBody, cardTitle, sheetTitle, sheetTitleSm) and Money at exactly its size (per-run line heights on web only). Phone check (V10) waits on the Android build.
- 2 Oct 2026 · MONEY-09 built: the transaction PIN is served on backend branch `wmt/MONEY-09` (set, change, verify, state; argon2id; 5 wrong tries lock it for `PIN_LOCK_MINUTES`, provisional 30; `X-Transaction-Pin` guard for every debit); gaps G-11, G-12; status verifying.
- 2 Oct 2026 · Each developer's file (docs/people/DEV*.md) now says to keep working through the list without waiting to be prompted: pull main, take the next startable task, build, verify, push, repeat; ask only when everything left is blocked.
- 2 Oct 2026 · The app now points at the live services the web uses, `https://api.wawuafrica.com` and `https://id.wawuafrica.com` (eas.json, `src/api/env.ts` fallbacks, BUILDS.md). The `.invalid` placeholders and the stale Railway address are gone.
