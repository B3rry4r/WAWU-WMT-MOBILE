# Backend gaps

What a screen needs that the backend doesn't serve. A screen is never reshaped
to fit the current API; the gap is written here, with the artboard and field,
and becomes (or joins) a backend task.

The analysis already turned 136 gaps into tasks (see `tasks/INDEX.md` and
`docs/analysis/ANALYSIS-EVIDENCE.md`, "Backend build list"). Add new ones
below as screens are built.

| # | artboard | field or behaviour needed | found by | task |
|---|----------|---------------------------|----------|------|
| G-1 | all | The backend contract repeats inline response shapes per route (`FlutterwaveConfig` ten times, `Items` four times) instead of named schemas, so clients cannot share one type. Publish named schemas. | setup, 1 Oct 2026 | MONEY-04 |
| G-2 | all (sign-up) | wawu-id `POST /auth/register` returns an `accessToken` (and refresh token) before the email is confirmed, so the Hub accepts calls from an account whose email was never proven; only `/auth/login` checks `emailVerified`. Decide whether register should issue tokens before confirmation. | OPS-03 verifier, 2 Oct 2026 | none yet (wawu-id, owner to assign) |
| G-3 | seed data | `prisma/seed.ts` gives the seeded `creator-basic` account the bio "Basic tier, building my slots.", which names the creator tiers removed on 20 Sep 2026. Seeded copy should describe the product as it is. | OPS-03 verifier, 2 Oct 2026 | none yet (wawu-backend seed, owner to assign) |
