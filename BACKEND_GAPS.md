# Backend gaps

What a screen needs that the backend doesn't serve. A screen is never reshaped
to fit the current API; the gap is written here, with the artboard and field,
and becomes (or joins) a backend task.

The analysis already turned 136 gaps into tasks (see `tasks/INDEX.md` and
`docs/analysis/ANALYSIS-EVIDENCE.md`, "Backend build list"). Add new ones
below as screens are built.

| # | artboard | field or behaviour needed | found by | task |
|---|----------|---------------------------|----------|------|
| G-1 | all | The backend contract repeats inline response shapes per route (`FlutterwaveConfig` ten times, `Items` four times) instead of named schemas, so clients cannot share one type. Publish named schemas. MONEY-04 did this for the wallet routes (every `/money/*` body is named, checked by `src/money/tests/money-contract.spec.ts`). Still open for the served routes: the Flutterwave checkout config inline 9 times, Prisma rows inlined (a legal request 14 times), `Paginated<T>` inlined 12 times, and 8 nullable named fields written `{ $ref, nullable }`, which generated clients read as never null (list in wawu-backend `docs/contract/WALLET.md`, section 5). Retypes live routes' contract entries, so it needs a V3 run. | setup, 1 Oct 2026 | MONEY-04 (wallet routes); served routes: none yet (owner to assign) |
| G-2 | all (sign-up) | wawu-id `POST /auth/register` returns an `accessToken` (and refresh token) before the email is confirmed, so the Hub accepts calls from an account whose email was never proven; only `/auth/login` checks `emailVerified`. Decide whether register should issue tokens before confirmation. | OPS-03 verifier, 2 Oct 2026 | none yet (wawu-id, owner to assign) |
| G-3 | seed data | `prisma/seed.ts` gives the seeded `creator-basic` account the bio "Basic tier, building my slots.", which names the creator tiers removed on 20 Sep 2026. Seeded copy should describe the product as it is. | OPS-03 verifier, 2 Oct 2026 | none yet (wawu-backend seed, owner to assign) |
| G-4 | I1 (Inbox tab badge) | An unread-message count for the signed-in user. `GET /api/hub/dm/inbox` returns messages with no total or unread figure and needs a signed-in session; the tab badge reads `useInboxUnread()` and shows nothing until INBOX-04 writes it. | SHELL-01 builder, 2 Oct 2026 | INBOX-04 |
| G-5 | all (sign-in) | wawu-id publishes no OpenAPI contract, so the app's two sign-in calls (`POST /auth/login`, `POST /auth/refresh`) are read by hand in `src/api/identity.ts`, each accepting only a `data.accessToken` and `data.refreshToken` pair. Publish a wawu-id contract and generate these types (`npm run api`). | SHELL-02 builder, 2 Oct 2026 | none yet (wawu-id, owner to assign) |
| G-6 | Settings (sign out) | wawu-id has no sign-out route. Signing out clears the tokens on the phone, but the refresh token stays valid on the server until it expires (30 days in the example env, `REFRESH_EXPIRES_IN=30d`; the production value is for the owner to confirm). Add `POST /auth/logout` that revokes the presented refresh token (additive), and the app calls it before clearing. | SHELL-02 builder, 2 Oct 2026 | none yet (wawu-id, owner to assign) |
| G-7 | W35, A8 (limits row) | The daily limit and what is left of it today (`limits.md`: `TIER_LIMITS` in config, a send over the limit stopped before the PIN). The contract has the fields (`WalletView.limits`, `FeeQuoteView.withinDailyLimit`, `daily_limit_exceeded`) but no launch task fills them, so `limits` stays null and the row is hidden. | MONEY-04 builder, 2 Oct 2026 | none yet (owner to assign) |
| G-8 | W27 (Report a problem) | A support conversation that opens with the transaction's reference. No support route exists in the backend. | MONEY-04 builder, 2 Oct 2026 | none yet (owner to assign) |
