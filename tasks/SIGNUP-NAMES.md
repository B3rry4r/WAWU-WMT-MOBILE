---
id: SIGNUP-NAMES
title: Sign-up asks for a first name, a last name and a username (R-82)
owner: YOU
area: AUTH
order: -126
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-6, R-29, R-47, R-82]
passes: [V1, V6, V7, V9]
artboards: []
tier: T2
---
# SIGNUP-NAMES · Sign-up asks for a first name, a last name and a username

## Current state

Round 3 (24 Oct 2026, Sonnet builder, T2; mobile and Hub `wmt/SIGNUP-NAMES`, each with `origin/main` merged first; Hub `e547602`; WAWU ID not touched, still `00b9f8e`): the verifier's two mediums and lows, built. Status verifying.

| # | Verifier found | Round 3 |
|---|---|---|
| r3-1 | M1: `mode: 'insensitive'` is `ILIKE`, so `_` matched any one character (`sg_wXild` held, `sg_wXil_` refused) | The check and the claim compare `lower(handle) = lower($1)` (raw, parameter bound). Spec: holding `sgu<stamp>_wXild` leaves `sgu<stamp>_wXil_` free and claimable (fails with the `ILIKE` form, passes now), the held name is taken in any case, and `Ada`/`ada` still collide on the check and the claim. Live on a local stack: the same. |
| r3-2 | M2 (lead ruling): Edit profile's `PATCH /users/me` has no case-blind rule and no reserved words | `PATCH /users/me` is exactly as on main (`test:protected` 253 of 253). New `PUT /users/me/handle` beside `PUT /users/me/identity` (one rule set: the same `checkHandleShape`, `claim` and lock; it differs only in letting a person who has a username take another). The app's Edit profile no longer sends `handle` in `PATCH`: `changesOf` returns it apart, Save sends the username first (so a refusal leaves nothing half saved), then the profile, then the details, and a username already saved is not sent again on a retry. A 409 or 400 shows the Hub's sentence under the field. Specs: the app path refuses `pat1` while `Pat1` is held (409) and a reserved word (400), changes and frees the old name, two at once give one winner. Gap G-SIGNUP-NAMES-1: until the web follows after launch it can still make case-variant duplicates through `PATCH`. |
| r3-3 | Lows (new routes only) | Reserved list gains `me`, `root`, `login`, `logout`, `signup`, `settings`, `www` (still PROVISIONAL; `admin`, `support`, `help`, `wawu`, `wawuafrica`, `whomadethis`, `api` were there); a username needs a letter or a number (`.`, `..`, `_` refused); a first or last name with a control character (NUL, tab, line break, DEL) is a 400 "Your name has a character that cannot be saved. Remove it and try again." and nothing is saved (a NUL byte was a 502). New specs for these, for an underscore in a name, and for the 60 a minute limit on `GET /users/handle-available` (the app's real throttlers behind the global guard: 60 answered, the 61st a 429 with `Retry-After`). |

Assertions changed (sweep rule: a finding that names the defect is the ruling; these tests pinned the username going through `PATCH /users/me`): `form.test.ts` "sends only the fields that changed" (the username moved out of the PATCH body), `editProfile.test.tsx` "a user can edit their handle" (the PATCH body became a `PUT /users/me/handle`) and "a user who picks a handle another account has" (a PATCH 400 "handle is already taken" became a PUT 409 in the Hub's words). `serve()` gained the `PUT` default. Nothing else in a test the task did not write was touched.

Verifier, 24 Oct 2026 (Sonnet, T2, heads: mobile `949ab60b`, Hub `0b9939e`, WAWU ID `00b9f8e`): **FIX**. Two medium findings and lows; the round 3 table above answers them. Everything else passed (web replay identical, race one winner, live walk dark and light, full jest 5500 of 5501 with the one failure a load flake that passes alone). L2, L4, L5 and L6 (WAWU ID's 400 for a bad name, a renamed wallet owner, the unsigned existence check, the Hub answering before WAWU ID) were not in this round's brief and are unchanged; the history file has them.

As of 24 Oct 2026, built by a Sonnet builder (T2) on `origin/main` (mobile `fcbf81d4`, backend `0cd8f8e`, wawu-id `a642eea`), finished in round 2 (merged with `origin/main`: mobile `e4d88d68`, backend `21cba57`, wawu-id unchanged): mobile, backend and wawu-id `wmt/SIGNUP-NAMES`. Status verifying. Round 2 closed what round 1 left open (see Open); the live walk ran on a local stack (web export 390 x 844, Chromium).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | A3 asks for email, phone and password | A3 asks for first name, last name, username, email, phone and password; all six are required in the app |
| 2 | WAWU ID `POST /auth/signup` makes an account with no name | it keeps `firstName` and `lastName` (optional on the server; `/auth/register` unchanged), so the first session already carries the name |
| 3 | no way to ask whether a handle is free (G-111) | `GET /users/handle-available?handle=` (signed out, 60 a minute) answers free or taken, ignoring case, in the Hub's words; A3 follows it while typing (450 ms pause) |
| 4 | the handle was only set in Edit profile | the username is the profile's handle; Continue asks once more and refuses a taken name under the field; after the code is right the app claims it with `PUT /users/me/identity` |
| 5 | an account with no name or handle goes straight to the tabs | it gets `your-details` once, before the tabs, for the parts it lacks; no Back, no Skip; it ends when the Hub has them |
| 6 | Confirm your details (review opening) starts empty | it starts with the account's first and last name from the token; both stay editable |

Round 2 (24 Oct 2026):

| # | Round 1 left | Round 2 |
|---|---|---|
| r2-1 | `auth-signup.test.tsx`: 71 failures (A3's Continue showed "Something went wrong on our side") | The call was `GET /users/handle-available` at Continue. The Hub's client keeps the `fetch` it first finds, so this suite's fixture never answered it (the Hub address is a closed port there) and the refusal reached the banner. The suite now answers the username check and the claim at the module that makes them (`identityApi`, recorded apart from WAWU ID's `calls`), as other suites answer `@/api/identity`. No assertion was changed to pass: the old fillAndContinue fixture only gained the three name fields, and the body assertions list `firstName` and `lastName`. Six new tests (field order, empty names, a bad character, taken while typing, refused on Continue with no sign-up started, claimed after the code). 107 pass (101 before, 71 of them failing). |
| r2-2 | `GET /users/me` read twice per start (hubAccountType.test.tsx 2 to 4) | One read per start: the gate's account type check and name check share the app's own profile query (`readMine`, `meKey`), so Home and Edit profile find the answer already cached. `hubAccountType.test.tsx` is byte-identical to `origin/main` again (the number is 2). The step saves, then asks for the profile again. |
| r2-3 | the general signed-in group stayed open during the step | its guard now also reads `!gate.needsIdentity`; a deep link to any screen shows the step. `route-guard.test.tsx` changed only on the `GENERAL_GUARD` line that pins that text (lead ruling). New `identityStepGate.route.test.tsx` (6 tests: three deep links, an account with all three, an account lacking only the username, a Hub that cannot be asked). |
| r2-4 | live walk NOT RUN | ran (below). |

Live walk (local stack: Hub, WAWU ID, web export, Nuvion stand-in and a mail stand-in; pictures in the scratchpad's `signup-names-b2/pics`): a new person signed up with all six fields and landed with `GET /users/me` showing first name, last name and handle, and WAWU ID's row holding the names; the step did not open for them. A taken username was refused while typing (a lower-case copy of an existing name) and on Continue (an upper-case copy, no sign-up started). An account registered the old way (no name, no username) was shown the step on a deep link to a tab, again on two other deep links, saved, and was never asked again on reload or on a second deep link. After saving, the access token carries the first and last name that "Confirm your details" starts from.

Where the username lives: the Hub profile's `handle` (the @handle the app already shows and links to). One home, one set of rules, no second account. Unique ignoring case is kept by a lock on the lowercase name inside one short transaction (no migration: the column's index is case sensitive and old rows may already differ only by case).

Routes added: Hub `GET /users/handle-available`, Hub `PUT /users/me/identity`, and in round 3 Hub `PUT /users/me/handle` (Edit profile's username). WAWU ID: `SignupDto` gains optional `firstName`, `lastName`. No migration. `PATCH /users/me` is unchanged; no protected route changed behaviour.

Open: (a) Closed in round 2 (r2-1). (b) Closed in round 2 (r2-2). (c) Closed in round 2 (r2-3). (d) Designer rows: DESIGN-SIGNUP-NAMES-1. (e) The reserved-word list is PROVISIONAL. (f) The walk did not drive Open your wallet's BVN step to reach "Confirm your details" on screen (a deep link to it lands on the BVN step, which comes first): the prefill is proved by the token claims the form reads (`namesOfToken`) and by its unit test, not by a picture. (g) `src/protected-routes` on a stack with the mock WAWU ID: 245 of 253 pass; the 8 that fail are verification and professional routes whose answer is a 502 from the mock's missing tick route, in code this branch does not touch; the Hub's own CI runs the suite.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, DECISIONS R-6, R-29, R-82, BACKEND_GAPS G-111
- `src/features/auth/` (A3, the gate), `src/features/profile-edit/`, `src/features/open-wallet/ReviewDetailsForm.tsx`
- Backend `src/user-profile/`, wawu-id `src/auth/`

## Goal

A new person signs up with a first name, a last name and a username, and lands with the name and the @handle set. An old account is asked once for what it lacks.

## Capability checks

- [x] A user can sign up with all six fields and WAWU ID keeps the names (`phone-signup.service.spec.ts`, `email-signup.service.spec.ts`).
- [x] A user is told while typing, and again on Continue, that a username is taken, ignoring case, in the server's words (`signup-identity.contract.spec.ts`: 9 tests, including two at once).
- [x] A new person lands with the name and @handle set (live walk, round 2: Hub `GET /users/me` and WAWU ID's row).
- [x] An old account with no name or handle is asked once, on a deep link too, and never again (live walk, round 2, dark and light).
- [ ] Open your wallet shows the names filled: the token claims it starts from carry the names (live walk) and the unit test passes; the form itself was not reached on screen (see Open (f)).

## History

[history/SIGNUP-NAMES.md](history/SIGNUP-NAMES.md).

