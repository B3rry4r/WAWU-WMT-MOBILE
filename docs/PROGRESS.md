# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 7 of 165.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 62 | 55 | 32 | 30 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 1 | 0 | 0 | 0 |
| done | 6 | 1 | 0 | 0 |

## Built and verified, waiting for the owner's sign-off

- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)

## Done

- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [OPS-04](../tasks/OPS-04.md) Designer: Shop to Schools, the ₦ glyph, real numbers (You)
- [OPS-05](../tasks/OPS-05.md) Update the other repos' CLAUDE.md for today's rulings (You)
- [MONEY-01](../tasks/MONEY-01.md) Protected route list and regression suite (You)
- [CHECK-0](../tasks/CHECK-0.md) Checkpoint 0: safe to start building (You)

## Next up

- **You:** [OPS-07](../tasks/OPS-07.md) Rule the web features missing from the canvas (D14), [MONEY-02](../tasks/MONEY-02.md) The PIN sheet, [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet
- **Developer:** [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs, [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring, [UI-01](../tasks/UI-01.md) Core components: text, buttons, inputs, money
- **Developer 2:** [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat, [INBOX-03](../tasks/INBOX-03.md) Phone push notifications
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Hosting an event: hybrid, kinds, one-step submit, [PROS-02](../tasks/PROS-02.md) Professional fields and card data, [LEGAL-01](../tasks/LEGAL-01.md) Legal starts as a chat

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · MONEY-09 (transaction PIN) now depends on MONEY-04 (the contract that says how the PIN is sent) instead of the Fintava client: Fintava has no wallet PIN. MONEY-04 started; MONEY-02 and MONEY-03 being built.
- 2 Oct 2026 · Rebalanced by screens, not just task count: Developer 2 takes Inbox, Bills and Ads (30 tasks, 50 screens); Developer 3 takes Events, Schools, Legal and Professionals (28 tasks, 57 screens).
- 2 Oct 2026 · Two more developers join. Developer 2 takes Inbox and Events (30 launch tasks); Developer 3 takes Schools, Professionals, Legal, Bills and Ads (28). You and the first developer keep 107 of 165 launch tasks (65%).
- 2 Oct 2026 · OPS-02 · First Fintava sandbox calls saved in `docs/fintava/sandbox/`; the sandbox merchant is inactive, so customer, transfer and bill calls are refused (403) until Fintava activates it. `naira-api.md`, `limits.md`, `fees.md` corrected.
- 2 Oct 2026 · Branching and merging rules written (WORKFLOW section 8): branch from the newest main, merge main in before verification, regenerate generated files instead of fixing them, LOG.md merges as a union, one merge at a time.
- 2 Oct 2026 · Rule change: a task can start once its dependencies are verified (`review`); the owner's sign-off happens at merge and never blocks the next task.
- 2 Oct 2026 · SETUP-01 merged from the developer's branch (renderer runs offline, colour/spacing gate catches rgb/hsl/named colours and literal spacing); SETUP-01, OPS-03, OPS-05, MONEY-01 and CHECK-0 signed off by the owner.
- 2 Oct 2026 · Fintava test key works on the sandbox (refused by the live API); tier limits recorded in `docs/fintava/limits.md`.
- 2 Oct 2026 · Backend deploy after wawu-backend #23 succeeded; the full test suite, including the new route suite, passed in it.
- 2 Oct 2026 · wawu-backend #23 merged: OPS-03 (run the backend locally), MONEY-01 (235 routes locked), OPS-05 (backend CLAUDE.md).
- 2 Oct 2026 · wawuafrica #23 merged: OPS-05 (web CLAUDE.md follows the mobile rulings).
- 2 Oct 2026 · CHECK-0 evidence written; waiting on the developer's SETUP-01 push and the owner's sign-off.
- 2 Oct 2026 · Developer verified SETUP-01 in their own session; push blocked by GitHub access to MOXN-AFRICA.
- 2 Oct 2026 · Owner: designs are final; the 112 brief changes are made in code. OPS-04 closed.
- 2 Oct 2026 · OPS-04 designer brief passed verification (4 rounds, 112 changes).
