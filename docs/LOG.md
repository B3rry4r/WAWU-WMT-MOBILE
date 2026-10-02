# Work log

Newest first. One line per thing that happened, written when it happens.
`docs/PROGRESS.md` shows this beside the task counts.

- 2 Oct 2026 · SHELL-03 · `eas.json` written (development, preview, production; API and ID addresses per profile, still `.invalid` placeholders until the owner supplies them) and `expo-dev-client` added. No build was run: that needs an Expo login, and the first iOS build needs the owner's Apple login.
- 2 Oct 2026 · SHELL-01 merged: the app has its five tabs and tab bar. Developer 2 and 3's screen tasks still wait for SHELL-02.
- 2 Oct 2026 · MONEY-09 (transaction PIN) now depends on MONEY-04 (the contract that says how the PIN is sent) instead of the Fintava client: Fintava has no wallet PIN. MONEY-04 started; MONEY-02 and MONEY-03 being built.
- 2 Oct 2026 · Rebalanced by screens, not just task count: Developer 2 takes Inbox, Bills and Ads (30 tasks, 50 screens); Developer 3 takes Events, Schools, Legal and Professionals (28 tasks, 57 screens).
- 2 Oct 2026 · Two more developers join. Developer 2 takes Inbox and Events (30 launch tasks); Developer 3 takes Schools, Professionals, Legal, Bills and Ads (28). You and the first developer keep 107 of 165 launch tasks (65%).
- 2 Oct 2026 · OPS-02 · First Fintava sandbox calls saved in `docs/fintava/sandbox/`; the sandbox merchant is inactive, so customer, transfer and bill calls are refused (403) until Fintava activates it. `naira-api.md`, `limits.md`, `fees.md` corrected.
- 2 Oct 2026 · Branching and merging rules written (WORKFLOW section 8): branch from the newest main, merge main in before verification, regenerate generated files instead of fixing them, LOG.md merges as a union, one merge at a time.
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
