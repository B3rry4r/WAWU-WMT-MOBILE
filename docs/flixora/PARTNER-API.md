# Flixora Partner API (facts)

Source: the owner pasted Flixora's partner docs (flixora.com/developers) on 22 Oct 2026; that page sits behind a bot
check that blocks every fetch from the build machine. Facts here come only from those docs and, later, real test
responses. Nothing here is a guess.

## Overview
- Read the Flixora catalog (posters, trailers); send signed-in users to Flixora with a short-lived signed link; see
  which users came and what they watched.
- The catalog never includes a link that plays a film: titles are watched on Flixora. Playback needs Chrome or Edge on a
  computer with the Flixora streaming extension, which viewers are prompted to install.
- Access: register the company in the developer portal, create keys and sign-in secrets there. A test environment works
  straight away; live access opens once Flixora has reviewed the account.
- Base URL: `https://prime-pit-backend-production-3a1f.up.railway.app/api/partners`. All responses are JSON.

## Test and live
| | How it works |
|---|---|
| API keys | `flx_test_…` / `flx_live_…`; separate per environment, up to 5 active each |
| Sign-in secret | one per environment; test secret to test, live secret for real users; the link is the same |
| Catalog | the same real catalog in both |
| Users signed in | test sign-ins create separate sandbox accounts and never touch a real Flixora account, even with a matching email |
| Plays | sandbox plays show in test data but never count towards views or payouts |
| `/v1/users` | a test key sees only sandbox users; a live key only real ones |
| Before approval | live keys and live sign-ins return 403 until Flixora approves; a disabled account loses both |
Every response carries `X-Flixora-Environment: test|live`. Test user records have `"environment": "test"` in the user
detail endpoint.

## Authentication
API key on every request, from the server only (never a browser or app): header `x-partner-key: flx_…`, or
`Authorization: Bearer flx_…`. The key decides the environment. Up to five active keys per environment; a revoked key
stops working immediately.

## Catalog
`GET /v1/movies`: published titles, newest first by default.
| Parameter | Type | Description |
|---|---|---|
| page | integer | from 1, default 1 |
| limit | integer | 1 to 100, default 20 |
| search | string | title contains this text, case-insensitive |
| genre | string | exact genre, e.g. Drama |
| language | string | exact language, e.g. English |
| year | integer | release year |
| region | NG \| UK \| US | only titles open to viewers in this region; leave out for all |
| premiering | boolean | true: only titles with an upcoming premiere; false: only titles without |
| updatedSince | ISO 8601 | only titles changed since then (incremental sync) |
| sort | newest \| rating \| views \| title | default newest |
Answer: `{ "data": [movie], "pagination": { "total", "page", "limit", "totalPages", "hasNextPage" } }`.

`GET /v1/movies/{id}`: `{ "data": movie }`; 404 if it does not exist or is not published.

Movie object:
| Field | Type | Notes |
|---|---|---|
| id | string | Flixora's id |
| title | string | |
| originalTitle | string \| null | original-language title when different |
| synopsis | string | |
| tagline | string \| null | |
| genre | string[] | |
| language | string \| null | |
| countryOfOrigin | string \| null | |
| year | integer \| null | |
| runtimeMinutes | integer \| null | |
| ageRating | string \| null | G, PG, PG-13, PG-16, PG-18, R or NC-17 |
| posterImage | string \| null | image URL |
| backdropImage | string \| null | wide image URL |
| trailerUrl | string \| null | may be embedded or linked; a video file OR a YouTube link |
| cast | { name, character }[] | |
| rating | number | average viewer rating |
| ratingCount | integer | |
| views | integer | plays on Flixora |
| premiering | boolean | true when the title has a premiere date |
| premierDate | ISO 8601 \| null | until then only the trailer is available |
| addedAt | ISO 8601 | when added to Flixora |
| flixoraPath | string | the title's path on Flixora; pass it as `redirect` in a sign-in link |
| flixoraUrl | string | the title's page on Flixora |

## Sign users in
When a signed-in user picks a title, the partner's server signs a short-lived token and sends the user to Flixora with
it. **The first visit creates their Flixora account from the name and email sent; later visits reuse it.** (There is no
API call that creates or closes an account.)

Token: HS256 JWT signed with the environment's sign-in secret.
| Claim | Type | Description |
|---|---|---|
| iss | string, required | the partner slug (portal); same in both environments |
| aud | string, required | always "flixora" |
| email | string, required | the user's email |
| given_name | string | first name |
| family_name | string | last name |
| sub | string, recommended | the partner's permanent id for the user; without it users are matched by email, which breaks if they change it |
| email_verified | boolean | true only if the partner verified the email; needed to link to a Flixora account that already uses it |
| jti | string, required | unique per token; each token works once |
| iat | number, required | seconds; tokens older than 5 minutes are refused |
| exp | number, required | seconds; keep it short (60 s is plenty) |

Link: `https://www.flixora.com/partner/<slug>/login#token=<token>&redirect=/stream-movies/<movie id>`. The token goes
after `#` so it never reaches server logs (`?token=` also works). `redirect` is optional, must start with `/`, defaults to
the catalog; use the movie's `flixoraPath`. A fresh token for every click.

Sign-in errors (shown to the user on Flixora):
| Code | Status | Meaning |
|---|---|---|
| MISSING_TOKEN | 400 | no token in the link |
| INVALID_CLAIMS | 400 | no valid email, or no exp / jti |
| INVALID_TOKEN | 401 | wrong secret, wrong iss or aud, or malformed |
| TOKEN_EXPIRED | 401 | past exp, or issued more than 5 minutes ago |
| TOKEN_REUSED | 401 | this jti was already used |
| PARTNER_NOT_APPROVED | 403 | live secret before approval |
| UNKNOWN_PARTNER | 404 | unknown slug, or the account is disabled |
| EMAIL_IN_USE | 409 | a Flixora account already uses the email and email_verified was not true |
| PROTECTED_ACCOUNT | 409 | the email belongs to a Flixora creator or staff account |

## Your users
`GET /v1/users`: the partner's users who signed in to Flixora, with activity; only the key's environment.
Parameters: page, limit (1 to 100), search (email, first or last name, or the partner's user id), joinedFrom/joinedTo,
activeFrom/activeTo, watchedFrom/watchedTo (YYYY-MM-DD, UTC, inclusive), watched (true/false), minViews, sort
(joined | oldest | lastActive | views; default joined, newest first).
Answer: `{ data: [user], summary: { users, usersWhoWatched, views }, pagination }`; summary covers every matching user.
User: externalId (the `sub` sent, or the email if none), email, firstName, lastName, joinedAt, lastLoginAt,
lastActiveAt, loginCount, views (movies started, once per movie per day), moviesWatched, lastWatchedAt.
`GET /v1/users/{externalId}`: one user with `environment` and `watchHistory` (most recent 200 plays: movieId, title,
posterImage, date, watchedAt).

## Errors and limits
Errors: `{ "message": "..." }` (sign-in errors add `code`). 400 bad request; 401 missing, invalid or revoked key, or a bad
sign-in token; 403 live key before approval, or any key once disabled; 404 not found or not yours; 409 sign-in only;
429 too many requests.
Limits: API requests 1,000 per 15 minutes per partner; sign-in links 30 per minute from one IP address.
