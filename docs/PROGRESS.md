# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 10 of 165.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 61 | 52 | 32 | 30 |
| building | 1 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 1 | 0 | 0 | 0 |
| done | 6 | 4 | 0 | 0 |

## Built and verified, waiting for the owner's sign-off

- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)

## Being built (or fixing verifier findings)

- [MONEY-04](../tasks/MONEY-04.md) Money conventions and the wallet contract (You)

## Done

- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [OPS-04](../tasks/OPS-04.md) Designer: Shop to Schools, the ₦ glyph, real numbers (You)
- [OPS-05](../tasks/OPS-05.md) Update the other repos' CLAUDE.md for today's rulings (You)
- [MONEY-01](../tasks/MONEY-01.md) Protected route list and regression suite (You)
- [CHECK-0](../tasks/CHECK-0.md) Checkpoint 0: safe to start building (You)
- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)
- [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring (Developer)
- [SHELL-03](../tasks/SHELL-03.md) Tester builds (Developer)

## Next up

- **You:** [OPS-07](../tasks/OPS-07.md) Rule the web features missing from the canvas (D14), [MONEY-02](../tasks/MONEY-02.md) The PIN sheet, [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet
- **Developer:** [UI-01](../tasks/UI-01.md) Core components: text, buttons, inputs, money, [AUTH-01](../tasks/AUTH-01.md) Sign in and password reset, [AUTH-02](../tasks/AUTH-02.md) Welcome and why you're here
- **Developer 2:** [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat, [BILLS-01](../tasks/BILLS-01.md) Pay a bill: choose biller, meter and amount
- **Developer 3:** [EVENTS-01](../tasks/EVENTS-01.md) Events: list, filters, detail, sold out, [EVENTS-02](../tasks/EVENTS-02.md) Hosting an event: hybrid, kinds, one-step submit, [PROS-01](../tasks/PROS-01.md) Find a professional

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · MONEY-04 built: money conventions (kobo, +234, one error shape, Idempotency-Key, PIN in `X-Transaction-Pin`, cursor pages) and the Naira wallet contract, 29 routes declared in wawu-backend `src/money/` and in the contract marked not served yet; artboard mapping and 11 canvas-versus-Fintava conflicts for the owner in wawu-backend `docs/contract/WALLET.md`; status verifying.
- 2 Oct 2026 · SHELL-02 (signed-in session and API wiring, 3 verification rounds; fixed a sign-out race) and SHELL-03 (tester build config, eas.json, expo-dev-client) merged. Screen tasks for Developers 2 and 3 are now unblocked. Builds wait on the owner's `eas init` and real addresses.
- 2 Oct 2026 · SHELL-02 built: signed-in session in `src/api/` (tokens in secure storage, one silent refresh on 401, one error shape, query defaults), proven live against the local backend and wawu-id; status verifying.
- 2 Oct 2026 · SHELL-03 · `eas.json` written (development, preview, production; API and ID addresses per profile, still `.invalid` placeholders until the owner supplies them) and `expo-dev-client` added. No build was run: that needs an Expo login, and the first iOS build needs the owner's Apple login.
- 2 Oct 2026 · SHELL-01 merged: the app has its five tabs and tab bar. Developer 2 and 3's screen tasks still wait for SHELL-02.
- 2 Oct 2026 · MONEY-09 (transaction PIN) now depends on MONEY-04 (the contract that says how the PIN is sent) instead of the Fintava client: Fintava has no wallet PIN. MONEY-04 started; MONEY-02 and MONEY-03 being built.
- 2 Oct 2026 · Rebalanced by screens, not just task count: Developer 2 takes Inbox, Bills and Ads (30 tasks, 50 screens); Developer 3 takes Events, Schools, Legal and Professionals (28 tasks, 57 screens).
- 2 Oct 2026 · Two more developers join. Developer 2 takes Inbox and Events (30 launch tasks); Developer 3 takes Schools, Professionals, Legal, Bills and Ads (28). The lead and Developer 1 keep 107 of 165 launch tasks (65%).
- 2 Oct 2026 · OPS-02 · First Fintava sandbox calls saved in `docs/fintava/sandbox/`; the sandbox merchant is inactive, so customer, transfer and bill calls are refused (403) until Fintava activates it. `naira-api.md`, `limits.md`, `fees.md` corrected.
- 2 Oct 2026 · Branching and merging rules written (WORKFLOW section 8): branch from the newest main, merge main in before verification, regenerate generated files instead of fixing them, LOG.md merges as a union, one merge at a time.
- 2 Oct 2026 · SHELL-01 built: five-tab shell (Home, Explore, Inbox, Wallet, Me), the design's tab bar, Inbox badge read from data (hidden at zero); boot screen removed; status verifying.
- 2 Oct 2026 · Rule change: a task can start once its dependencies are verified (`review`); the owner's sign-off happens at merge and never blocks the next task.
- 2 Oct 2026 · SETUP-01 merged from the developer's branch (renderer runs offline, colour/spacing gate catches rgb/hsl/named colours and literal spacing); SETUP-01, OPS-03, OPS-05, MONEY-01 and CHECK-0 signed off by the owner.
- 2 Oct 2026 · Fintava test key works on the sandbox (refused by the live API); tier limits recorded in `docs/fintava/limits.md`.
- 2 Oct 2026 · Backend deploy after wawu-backend #23 succeeded; the full test suite, including the new route suite, passed in it.
