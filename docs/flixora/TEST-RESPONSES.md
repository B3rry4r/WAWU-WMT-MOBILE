# Flixora test environment: what really came back

Recorded 23 Oct 2026 by the FLIX-02 builder, with the TEST key only (`flx_test_`), against the base URL in
`PARTNER-API.md`. Every answer said `X-Flixora-Environment: test`. About 20 requests in all (the limit is 1,000 per
15 minutes). No key, token or link is written here. The catalog is Flixora's real test catalog: it will change.

## Catalog (`GET /v1/movies`)
- 29 titles, region NG or no region (the same 29); region UK gave 28, so `region` really filters. All English.
- One page of `limit=100` holds the whole catalog: `{ total: 29, page: 1, limit: 100, totalPages: 1, hasNextPage: false }`.
- An empty page (for example `updatedSince=2030-01-01T00:00:00.000Z`) is `{ data: [], pagination: { total: 0, page: 1,
  limit: 100, totalPages: 0, hasNextPage: false } }` (`totalPages` is 0, not 1).
- `updatedSince=2026-10-20T00:00:00.000Z` gave 4 titles, so it filters on a real change time.
- Every field in the docs' movie object is present on every title. Types: `rating`, `ratingCount`, `views`, `year`,
  `runtimeMinutes` are integers (no title has a rating yet: all `ratingCount` are 0); `originalTitle` null on 24,
  `tagline` null on all 29, `backdropImage` null on 24, `trailerUrl` null on 7, `premierDate` null on 23.
- Trailers: 22 are a video file, 7 have none; none is a YouTube link in this catalog (the YouTube case is still in the docs).
- Images are on `flixora-...amazonaws.com` (S3); posters on all 29.
- Premiere: 5 titles say `premiering: true`, and all 5 premiere dates (20 Sep to 11 Oct 2026) are already past. One title
  has a `premierDate` with `premiering: false`. So `premiering` alone does not mean "still ahead"; the Hub treats a title as
  not yet premiered only while `premiering` is true and the date has not passed (or has none).
- `genre` values can hold a pipe inside one entry (`"Comedy | Thriller"`, `"Drama | Music | Thriller"`, `"Horror | Sci-Fi |
  Thriller"`): they are single genres to Flixora, so the Hub's genre filter lists them as they come.
- `flixoraPath` is `/stream-movies/<id>` and `flixoraUrl` is `https://www.flixora.com/stream-movies/<id>`, as the docs' link example says.

One title (trimmed):
```json
{ "id": "6ad60a9ae094f832be0b5b6e", "title": "Grand Theft Auto 6", "originalTitle": null, "synopsis": "The Goodtime Rockstar",
  "tagline": null, "genre": ["Action", "Animation"], "language": "English", "countryOfOrigin": "United States",
  "year": 2026, "runtimeMinutes": 26, "ageRating": "PG-16", "posterImage": "https://flixora-...amazonaws.com/assets/posters/....png",
  "backdropImage": null, "trailerUrl": null, "cast": [{ "name": "Stephen Root", "character": "Featured Cast" }],
  "rating": 0, "ratingCount": 0, "views": 1, "premiering": false, "premierDate": null, "addedAt": "2026-10-19T12:18:34.524Z",
  "flixoraPath": "/stream-movies/6ad60a9ae094f832be0b5b6e", "flixoraUrl": "https://www.flixora.com/stream-movies/6ad60a9ae094f832be0b5b6e" }
```

## One title and errors
| Request | Status | Body |
|---|---|---|
| `GET /v1/movies/{id}` | 200 | `{ "data": movie }` |
| `GET /v1/movies/000000000000000000000000` (no such title) | 404 | `{ "message": "Movie not found." }` |
| `GET /v1/movies/not-an-id` | 404 | `{ "message": "Movie not found." }` |
| a made-up `flx_test_...` key | 401 | `{ "message": "Invalid or revoked partner API key." }` |
| no key | 401 | `{ "message": "Partner API key required." }` |
A 401 carries no `X-Flixora-Environment` header. 403 and 429 were not provoked (they need an unapproved account and 1,000 requests).

## Headers on every 200 and 404
`ratelimit-limit: 1000`, `ratelimit-policy: 1000;w=900`, `ratelimit-remaining: <left in the window>`, `ratelimit-reset:
<seconds to the window's end>`, `x-flixora-environment: test`, `content-type: application/json; charset=utf-8`.
The adapter reads `ratelimit-remaining` and `ratelimit-reset` and stops calling when 25 or fewer are left until the reset.

## Not checked (waits on the test sign-in secret and the partner slug)
The signed link opening Flixora as a sandbox user, and Flixora's sign-in error codes (INVALID_TOKEN, TOKEN_EXPIRED and the rest).
