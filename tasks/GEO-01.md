---
id: GEO-01
title: WAWU ID takes a phone from any country and keeps a country of residence on every account (R-85)
owner: YOU
area: AUTH
order: -190
priority: launch
repo: wawu-id
type: backend-endpoint
status: building
depends_on: []
decisions: [R-6, R-36, R-85]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# GEO-01 · A phone from any country, and a country on every account

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B24): WAWU ID `wmt/GEO-01` `1e0faf1` on `origin/main` `1bbad17` (code, migration, contract); mobile `wmt/GEO-01` on `origin/main` `546db77e` (these records only). No app code. Status verifying. CI on `1e0faf1`: Branch checks run 40104274398 and Gates run 40104274389, both success.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | sign-up writes a Nigerian number as `+234...` and refuses every other country (`PHONE_NOT_SUPPORTED`); a `+` number that reached `normalisePhone` passed as typed, valid or not | any country's number is written as E.164 and must be valid for its country (libphonenumber-js `1.13.15`, exact pin, MIT; max metadata). Nigerian `0803...`, `234...`, `+234...`, `8031234412` give the same `+234...` as ever, whatever country is also sent. A number with no country code is read in the country named by `countryCode`, else refused |
| 2 | every lookup read a phone through `normalisePhone` | login, the duplicate and expiry checks, erased identifiers, the proof check and the G-16 script read through `comparablePhone`: the strict reading, else exactly the old one, so the same stored rows are found. Only a number being given now has to be valid |
| 3 | the mailed sign-up code (`SIGNUP_VERIFY_CHANNEL=email`) also refused non-Nigerian numbers | the mailed code keeps any valid number (it texts nothing). The texted code still goes only under `SIGNUP_ALLOWED_PHONE_PREFIX` (`+234`; `*` is every country). Default (lead), owner may override: texting abroad stays off until the SMS provider's delivery and price are confirmed |
| 4 | an account had only the web's free-text `country` ("Nigeria") | `POST /auth/signup` takes optional `countryCode` (ISO 3166-1 alpha-2, any case; default the phone's own country, else `NG`; not on the 249-code list is `400 COUNTRY_INVALID`, before anything is written or sent). Stored in `wawu_users.country_code`. `POST /auth/register` takes it too, and derives it from the phone when absent (the web is unchanged) |
| 5 | the Hub could not read where a person lives | `countryCode` (string or null) is on the session `user` (login, sign-up confirm, every route that answers one), the access token claim, and every row of `POST /internal/users/lookup`. The free-text `country` is untouched |
| 6 | existing rows have no country | migration `20261024120000_country_code`: nullable `VARCHAR(2)`, a CHECK for two capitals, and `NG` for a stored Nigerian phone in any of its three spellings; every other row stays null. `rollback.sql` refuses (changes nothing) while any account holds a country the backfill would not give again. The 30-day anonymise clears it |

### Proof

| Check | Result |
|---|---|
| `tsc --noEmit`; eslint on changed files, no `--fix` | EXIT 0; the only findings are 9 that were on the files before (`auth.controller.ts` 204, `tokens.service.ts` 242 and 442, `provisioning.service.ts` five), none on a line this task wrote |
| jest, 8 affected specs plus `src/common` (phone, country, contract) | 8 suites, 230 tests, EXIT 0; 4 suites, 98 tests, EXIT 0 |
| `contract:build` then `contract.spec` | contract regenerated; additions only (`SignupDto.countryCode`, `SessionUser.countryCode`, two descriptions) |
| migration on a real Postgres with 9 live-shaped rows | 3 Nigerian spellings got `NG`, a Ghanaian number, `released:`, `deleted:`, a landline and `06031234412` stayed null; the CHECK refuses `ng`; the rollback refused with one chosen `GH`, ran clean once it was cleared, and `prisma migrate deploy` applied it again; `migrate diff` against the schema: no difference |
| `test:phone-local` | 105 pass, 2 fail: both F-3 timing checks (medians within 40 ms) fail the same way on `origin/main` at this load (machine load 10 to 14 on 4 CPUs) |
| `test:signup-email-local`, `test:phone-hold-local`, `test:g16-local`, `test:erase-local`, `test:signup-local`, `test:session-local` | 51, 40, 28, 27, 34, 38 pass, 0 fail (the email test failed once on a 6 second resend gap under load and passed on the rerun) |
| `test:refresh-local` | 28 pass, 1 fail: "with 200 stored tokens a refresh answers in under 1 s" took 1104 ms under load; the test touches no phone |
| gates, `check_baseline.py` | 0 fail, 22 warn (before and after), 0 accepted; baseline entries 0 |

Live checks added to the two local sign-up tests: a Nigerian number typed `0803 777 0101` is stored `+2348037770101` in `NG`; `countryCode: 'gh'` is stored `GH`; `ZZ` is `COUNTRY_INVALID` with nothing made; `+1 111 111 1111` is `PHONE_INVALID`; a mailed sign-up from Ghana is answered `+233245550101`, lives in `GH` and texts nothing; the country sent wins over the phone's.

Assertions changed (R-85 is the ruling; each pinned the old behaviour): `login-phone-verified.spec.ts` and `test/phone-signup.local.mjs` list the session user's keys and now include `countryCode`; `email-signup.service.spec.ts` "refuses a number that is not Nigerian, or not a number" no longer expects `PHONE_NOT_SUPPORTED` for `+14155552671` (the mailed code keeps it) and keeps the not-a-number checks. Nothing else in a test the task did not write was touched.

Open (for GEO-02, GEO-03 and the sweep): (a) the Hub's `WawuJwtClaims` and its admin screens do not read `countryCode` yet (GEO-02); the app's copy of this contract (`contract/identity/`, `identity.generated.ts`) is not synced (GEO-03: `npm run api -- --identity ../wawu-id`). (b) No route changes the country after sign-up; the internal phone-change routes still store the digits the Hub sends, not E.164 (G-GEO-01-2). (c) Accounts with a non-Nigerian phone stay null; an optional backfill script from the phone is not built (G-GEO-01-3). (d) Kosovo (`XK`) is user-assigned, not ISO, so it is refused; Ascension and Tristan da Cunha numbers count as Saint Helena; `+44 7911` is Guernsey as the library says, and the person can send another country. (e) A login typed as a national number outside Nigeria (`0241234567`) finds nothing: send E.164.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, DECISIONS R-85, R-6, R-36
- WAWU ID `src/common/phone.util.ts`, `src/common/country.util.ts`, `src/auth/signup-country.ts`, `src/auth/phone-signup.service.ts`, `src/auth/email-signup.service.ts`, `prisma/migrations/20261024120000_country_code/`

## Goal

A person signs up with a phone from any country and has a country of residence; the Hub can read it from the token or the lookup; every Nigerian number and every lookup behaves as before.

## Scope

`wawu-id` only: phone and country utilities, the sign-up services, the DTOs, the session user, the access token, the internal lookup, one additive migration, the regenerated contract, `deploy/ENV.md`, `WAWUAfrica_API_Contracts.md`. No Hub, app or web code.

## Capability checks

- [x] A person with a Nigerian number typed any of its ways signs up as before and lives in `NG`.
- [x] A person with a valid number from another country signs up by mailed code, is answered the number in E.164 and lives in that country.
- [x] A number no country has is refused (`PHONE_INVALID`); a country not on the list is refused (`COUNTRY_INVALID`); neither writes or sends anything.
- [x] The Hub can read `countryCode` from the token and from the lookup.
- [x] The migration applies to live-shaped rows, and its rollback refuses to lose a chosen country.
- [x] CI on WAWU ID `wmt/GEO-01` `1e0faf1`: Branch checks 40104274398 and Gates 40104274389, success.

## Verifier report

Verifier (Sonnet, T2 check, 24 Oct 2026) of WAWU ID `wmt/GEO-01` `1e0faf1` against `origin/main` `1bbad17`. Verdict: **FIX** (1 medium, 3 low). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/geo-12-v/` (`p1.log`, `p3.log`, `jest-id.log`, `local-*.log`).

| Check | Result | How |
|---|---|---|
| Nigerian forms, same requests on `main` and the branch (8 forms: `0803...`, `234...`, `+234...`, `8031234412`, spaced, `00234`, `+2340`, dashed) | passed | sign-up (mailed code), confirm, login by all 8 spellings and by email, internal lookup, repeat sign-up, web `/auth/register`: statuses, codes, stored phone `+234...` identical; the only differences are the added `countryCode` (user, claim, lookup row) |
| Duplicates across spellings | passed | legacy verified rows stored `08031230101`, `2348031230102`, `+2348031230103`: every spelling answers 409 on both trees; a non-Nigerian verified `+233245550199` answers 409 for `+233 24 555 0199`, `00233245550199`, `0245550199`+GH |
| Another country by mailed code | passed | `+233 24 555 0101` stored `+233245550101`, `GH`; `+1 415 555 2671` `US`; token claim, session user and lookup row carry the code; login by `+233...`, `00233...` finds the same account |
| Invalid number, bad country | passed | `+1 111 111 1111`, `+233 123 4567`, `+999...`, letters: 400 `PHONE_INVALID`; `ZZ`, `Ghana`, `GHA`, `XK`: 400 `COUNTRY_INVALID`, 0 rows written; `gh`, ` gh `, empty and null are accepted as designed |
| Texted code | passed | Ghana by text: 400 `PHONE_NOT_SUPPORTED`, 0 texts; Nigeria: 1 text; `SIGNUP_ALLOWED_PHONE_PREFIX=*` texts Ghana |
| Web `/auth/register`, Nigerian number | passed | 8 cases same status, stored phone and `country` as `main`; adds `countryCode` only |
| Migration `20261024120000_country_code` | passed | 12 live-shaped rows: 4 Nigerian (3 spellings plus `+2347...`) get `NG`; `released:`, `deleted:`, landline, `06031234412`, short and long numbers stay null; CHECK refuses `ng`; rollback refuses for a chosen `GH` on a Ghana or Nigerian phone and for `NG` on a Ghana phone, runs clean when only derived `NG` remains, redeploy applies it again, `migrate diff` empty; stamp later than every branch |
| Changed assertions | passed | `login-phone-verified.spec.ts` and `phone-signup.local.mjs` add only `countryCode` to the key list; the email spec drops `PHONE_NOT_SUPPORTED` for `+14155552671` (R-85 keeps it) and keeps and widens the not-a-number refusals. Honest under R-85 |
| tsc, eslint (no fix), gates, contract | passed | tsc EXIT 0 (branch and main); eslint 8 findings on both, same files, none on a line the task wrote; `contract:build` leaves no diff; gates 0 fail, 22 warn, 0 accepted (main same); `check_baseline` EXIT 0 |
| Specs | passed | 28 spec files (auth, common, contract; none that names Fintava): 28 suites, 616 passed, 20 skipped, EXIT 0 |
| Local phone tests | 1 timing fail | `phone-signup.local` 105 pass, 1 fail: F-3 "medians within 40 ms" (spread 141 ms at load 15 to 20 on 4 CPUs; a timing comparison, not a timeout; not re-run on `main`). `signup-email` 51, `phone-hold` 40, `g16` 28, `erase-locks` 27: all pass. Ports 8664 to 8666 (the phone test is a port-changed copy: ports only) |

### Findings

- **medium** `src/common/phone.util.ts:42-56` and `:86-87`. The Nigerian reading runs before the country the person named, so a national number from another country that fits Nigeria's pattern (0 or nothing, then 10 digits starting 7, 8 or 9) is stored as a Nigerian phone with no error. R-85 says a leading 0 works "when Nigeria is chosen". Repro on the branch, `SIGNUP_VERIFY_CHANNEL=email`: `POST /auth/signup {phone:'07400123456', countryCode:'GB'}` answers 201 and stores `+2347400123456` (country `GB`); `{phone:'7135551234', countryCode:'US'}` stores `+2347135551234`; every UK mobile (`07...`) and many US numbers with area codes 7xx to 9xx do this. `{phone:'4155552671', countryCode:'US'}` and `{phone:'0245550114', countryCode:'GH'}` are read correctly. The mailed code is then confirmed against a phone that is not theirs. Fix: when `countryHint` is a country other than NG and the number has no `+` or `00`, read it in that country first and fall back to the Nigerian reading only when it is not valid there (a Nigerian living abroad typing `08037770101` still lands on `+234...`). The builder's note "whatever country is also sent" is the cause; no test pins it.
- **low** `prisma/migrations/20261024120000_country_code/migration.sql:33-36`. The backfill matches only the three exact spellings. The web stores a phone as typed, so rows such as `0803 123 4412`, `0803-123-4412` or `8037770303` (10 digits with the dial code kept separately) stay null. GEO-02's `/me/location` fills them from the older `country` text, so nothing is lost; an optional backfill script is already G-GEO-01-3.
- **low** `src/auth/auth.service.ts` (`register`, the `countryForSignup` call). `COUNTRY_INVALID` is thrown at create time, after the expired-sign-up clean-up and the duplicate check, so a bad `countryCode` with a taken phone answers 409 and one with a free phone answers 400; `POST /auth/signup` refuses before any write as the task says.
- **low** `+44 7911 123456` defaults the country to `GG` (the library's reading; builder item d). The person can send `GB`.

Not a finding: login typed as `233245550101` (no `+`) answers 404; only E.164 or `00` reach a non-Nigerian number (builder item e).
