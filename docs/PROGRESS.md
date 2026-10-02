# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 7 of 165.**

| | You | Developer |
|---|---|---|
| todo | 95 | 84 |
| building | 0 | 0 |
| verifying | 0 | 0 |
| review | 0 | 1 |
| done | 6 | 1 |

## Built and verified, waiting for the owner's sign-off

- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)

## Done

- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [OPS-04](../tasks/OPS-04.md) Designer: Shop to Schools, the ₦ glyph, real numbers (You)
- [OPS-05](../tasks/OPS-05.md) Update the other repos' CLAUDE.md for today's rulings (You)
- [MONEY-01](../tasks/MONEY-01.md) Protected route list and regression suite (You)
- [CHECK-0](../tasks/CHECK-0.md) Checkpoint 0: safe to start building (You)

## Next up

- **You:** [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls, [OPS-07](../tasks/OPS-07.md) Rule the web features missing from the canvas (D14), [MONEY-02](../tasks/MONEY-02.md) The PIN sheet
- **Developer:** [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring, [SHELL-03](../tasks/SHELL-03.md) Tester builds, [UI-01](../tasks/UI-01.md) Core components: text, buttons, inputs, money

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · SHELL-01 built: five-tab shell (Home, Explore, Inbox, Wallet, Me), the design's tab bar, Inbox badge read from data (hidden at zero); boot screen removed; status verifying.
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
- 2 Oct 2026 · Fintava's dashboard charges recorded (`docs/fintava/fees.md`): user pays Fintava's charge plus WAWU's fee.
- 2 Oct 2026 · No mocks, no feature flags: money is built on the real Fintava sandbox.
- 2 Oct 2026 · Owner's rulings R-6 to R-20 applied to every task.
