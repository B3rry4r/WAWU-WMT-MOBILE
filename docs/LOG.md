# Work log

Newest first. One line per thing that happened, written when it happens.
`docs/PROGRESS.md` shows this beside the task counts.

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
- 2 Oct 2026 · Icons: one shared `Icon` (`src/components/icon/`) on the latest Lucide (lucide-react-native 1.49) under the canvas's own icon names, drawn with the board kit's strokes (1.8, buttons 2.2, active tab 2.2, FAB 2.4). All 163 canvas icons resolve: 161 from Lucide, Facebook and Instagram from Simple Icons (Lucide dropped brand logos). `npm run icons` regenerates the list; the tab bar now uses it and the hand-copied `TabIcon` is gone. Expo project linked (`@moxnafrica/wawu-wmt`); test builds are Android only for now.
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
- 2 Oct 2026 · wawu-backend #23 merged: OPS-03 (run the backend locally), MONEY-01 (235 routes locked), OPS-05 (backend CLAUDE.md).
- 2 Oct 2026 · wawuafrica #23 merged: OPS-05 (web CLAUDE.md follows the mobile rulings).
- 2 Oct 2026 · CHECK-0 evidence written; waiting on the developer's SETUP-01 push and the owner's sign-off.
- 2 Oct 2026 · Developer verified SETUP-01 in their own session; push blocked by GitHub access to MOXN-AFRICA.
- 2 Oct 2026 · Owner: designs are final; the 112 brief changes are made in code. OPS-04 closed.
- 2 Oct 2026 · OPS-04 designer brief passed verification (4 rounds, 112 changes).
- 2 Oct 2026 · Fintava's dashboard charges recorded (`docs/fintava/fees.md`): user pays Fintava's charge plus WAWU's fee.
- 2 Oct 2026 · No mocks, no feature flags: money is built on the real Fintava sandbox.
- 2 Oct 2026 · Owner's rulings R-6 to R-20 applied to every task.
