---
id: GEO-01
title: WAWU ID takes a phone from any country and keeps a country of residence on every account (R-85)
owner: YOU
area: AUTH
order: -190
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
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
