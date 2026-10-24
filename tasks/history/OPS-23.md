# OPS-23 · round history

Moved out of [tasks/OPS-23.md](../OPS-23.md) word for word, oldest first. The current state is in that file.

## Verifier report

Verifier: a Sonnet agent that built none of it (T1 check, bundle B15, 24 Oct 2026). Under check: dashboard `origin/wmt/OPS-23` `ca16990` against `origin/main` `c1dfca6`; Hub read at `origin/main` `b69aa7f`; mobile `wmt/OPS-23` `ae2b5034`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | dashboard `wmt/OPS-23` `ca16990` vs `origin/main` `c1dfca6`: 19 files, all dashboard, no Hub file; `npm run build` EXIT 0 (`/support`, `/join`, `/join/referral-codes`, `/finance/oversight` built); `check:oversight-contract` EXIT 0 against Hub `origin/main` `b69aa7f`; typecheck EXIT 0; lint EXIT 0 (1 old warning, `SHOP_DTO`); `check:invariants` EXIT 0 (142 files); `check:contrast` EXIT 0; gates EXIT 1 with only the old `finance/payouts/page.tsx:39` finding (same on main, 142 vs 128 files); `check_baseline` EXIT 0. `npm run check` is EXIT 1 on main and on the branch (finding F1, not this task's). Logs: `ops-23-v/` in the verifier's scratchpad |
| V6 | partly run | refusals and Hub answers drawn through their real cause (409, 404, 400 toasts; role refusals with no request sent). NOT RUN: network cut and 500 on the list screens |
| V7 | passed | each of the four admin roles signed in through the real form (`superadmin`, `support`, `finance`, `reviewer`) and walked all four screens; see the matrix below |
| V9 | passed | local stack (Hub `origin/main` `b69aa7f`, Nuvion stand-in, real Hub admin login, no injected token); every number on screen came from the Hub |

Pictures: 1440 px, light and dark, `dash-b15-v/<role>-<state>-<theme>.png` (82 files) in the verifier's scratchpad; they match the builder's `dash-b15/` set element by element (header, nav entries, cards, tabs, toasts, copy).

Role matrix (live, each role signed in; "no request" means the Hub saw no call):

| Screen | superadmin | support | finance | reviewer |
|--------|-----------|---------|---------|----------|
| Support threads | list, read, reply | list, read, reply | refusal, no request | refusal, no request |
| Registrations and CSV | read, filters, export | read, filters, export | read, filters, export | refusal, no request |
| Referral codes | read, New code, Turn off and on | read only, no buttons | read only, no buttons | refusal, no request |
| Oversight: older sales | read | refusal, no request | read | refusal, no request |
| Oversight: identity hold | release, refuse | release, refuse | refusal, no request | refusal, no request |

Findings (none medium or worse that belongs to this task; verdict PASS, status review):

- F1, medium, NOT this task's (same on `origin/main`): `npm run check` exits 1 against Hub `origin/main` (and `3d33a05`). `check:contract` and `check:ops-contract` throw `setGlobalPrefix not found in src/main.ts` (`scripts/generate-contract-types.mjs:823`, `scripts/generate-ops-contract.mjs:502`; the Hub moved it to `src/hub-app-config.ts`). The `&&` chain stops there, so the new `check:oversight-contract`, typecheck and lint never run inside `npm run check`; run singly they all pass. Repro: `HUB_API_PATH=/home/user/wawu-backend HUB_API_REF=origin/main npm run check`. For the lead: a follow-up that teaches the two older generators the new file (the new generator already reads it).
- F2, low: a price above the ceiling is refused in the Hub's words, "The price must be from 0 to the standard price (200000 kobo).", while the form takes whole naira (`src/components/join/ReferralCodesScreen.tsx:112`). Typing 9999999 naira gets a figure 100 times off from what was typed. Repro: Referral codes, New code, price 9999999. To the sweep: show the ceiling in naira.
- F3, low: the CSV the Hub builds (saved byte for byte) holds an "Access code" column; the screen hides that code on purpose (`RegistrationsScreen.tsx`). The registrations route serves `accessCode` to the same three roles, so the file is no wider than the route.
- F4, low (old convention): the sidebar is not role-filtered, so a reviewer sees Support threads, Registrations, Referral codes and Oversight and gets a plain refusal. Same for every older entry (`src/components/layout/nav.ts` has no role field).
- F5, test gap: the dashboard has no test script (`npm test` is EXIT 1, "Missing script", same on main), so nothing kills a mutant of these screens; the live walk is the only proof.

Checks (all passed): OPS-23 a reply lands in the person's own chat (read back as that person through the Hub), the thread leaves "Waiting for a reply" and stays under "All threads", a 2001-character reply is refused in the Hub's words and the draft is kept; the Creator lookup and Identity hold links carry the person's `wawuId` (`?account=` pre-fills the oversight form). OPS-24 the status, exact code and "no code" filters narrow the table, and Export CSV with each filter is byte-for-byte the Hub's own export (1 row for paid and GOLD1, 4 rows for no code); every CSV column maps to a field the registrations route serves; a price above the ceiling is refused (400) and the dialog stays open; NEWV15 made, turned off behind the confirm that says people who paid keep what they paid, turned on, turned off (DB `active` false). OPS-25 release success (opening in `review` and `stopped`, as superadmin and as support: 200, `Released`, row `expired`, then `Already released`), refusals in the Hub's words (409 opening still `open`, 404 no opening), a malformed id is stopped in the form; the in-review row stayed `open`. Generator: `check:oversight-contract` passes on Hub `b69aa7f` and fails when a route it reads changes (route path renamed, controller path renamed, role dropped, controller path moved: stale, exit 1; a view type renamed: throws `IdentityHoldReleaseView is neither declared in nor imported into ...`), tried in the verifier's Hub worktree only. OPS-25 moves no money in a new way: the dashboard calls only `GET /admin/money/earnings/before-start` (WALLET-16, 17 Oct) and `POST /admin/identity-holds/:id/release` (NUV-02, 10 Oct), both older than the branch; the diff holds no Hub file; after the walk `WalletPayment` still 3 rows, `EarningSettlement` 0, `FintavaWallet` 0.

NOT RUN: the network cut and 500 states of the list screens; a phone; "Load more" paging (the stack held 3 threads, 3 sales, 8 registrations); the release refusal for an account that has a wallet; a real wallet opening (the holds were seeded in the test database as `nuvion` openings in `review` and `stopped`). The Hub's CORS list holds only the stack's own pages, so the dashboard dev server reached the Hub through a header-only forwarding proxy on the verifier's port 8342 (it changes no body or status).
