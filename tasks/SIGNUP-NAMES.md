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

As of 24 Oct 2026, built by a Sonnet builder (T2) on `origin/main` (mobile `fcbf81d4`, backend `0cd8f8e`, wawu-id `a642eea`): mobile, backend and wawu-id `wmt/SIGNUP-NAMES`. Status verifying. Not done: the live walk and the pictures (NOT RUN, step budget), and `src/__tests__/auth-signup.test.tsx` is not green (see Open).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | A3 asks for email, phone and password | A3 asks for first name, last name, username, email, phone and password; all six are required in the app |
| 2 | WAWU ID `POST /auth/signup` makes an account with no name | it keeps `firstName` and `lastName` (optional on the server; `/auth/register` unchanged), so the first session already carries the name |
| 3 | no way to ask whether a handle is free (G-111) | `GET /users/handle-available?handle=` (signed out, 60 a minute) answers free or taken, ignoring case, in the Hub's words; A3 follows it while typing (450 ms pause) |
| 4 | the handle was only set in Edit profile | the username is the profile's handle; Continue asks once more and refuses a taken name under the field; after the code is right the app claims it with `PUT /users/me/identity` |
| 5 | an account with no name or handle goes straight to the tabs | it gets `your-details` once, before the tabs, for the parts it lacks; no Back, no Skip; it ends when the Hub has them |
| 6 | Confirm your details (review opening) starts empty | it starts with the account's first and last name from the token; both stay editable |

Where the username lives: the Hub profile's `handle` (the @handle the app already shows and links to). One home, one set of rules, no second account. Unique ignoring case is kept by a lock on the lowercase name inside one short transaction (no migration: the column's index is case sensitive and old rows may already differ only by case).

Routes added: Hub `GET /users/handle-available`, Hub `PUT /users/me/identity`. WAWU ID: `SignupDto` gains optional `firstName`, `lastName`. No migration. `PATCH /users/me` is unchanged; no protected route changed behaviour.

Open: (a) `auth-signup.test.tsx`: after the helper and fixture updates 71 tests still fail with a refused call on A3 that was not traced in the budget; next builder starts there. (b) `hubAccountType.test.tsx` pins the number of `GET /users/me` calls per start; it now reads the profile twice per start (account type, then name and username), so that one number went from 2 to 4 (the lead may rule it back by sharing one read). (c) The general signed-in group stays open during the step (its guard text is pinned by `route-guard.test.tsx`), so a deep link outside the tabs opens. (d) Designer rows: DESIGN-SIGNUP-NAMES-1. (e) The reserved-word list is PROVISIONAL.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, DECISIONS R-6, R-29, R-82, BACKEND_GAPS G-111
- `src/features/auth/` (A3, the gate), `src/features/profile-edit/`, `src/features/open-wallet/ReviewDetailsForm.tsx`
- Backend `src/user-profile/`, wawu-id `src/auth/`

## Goal

A new person signs up with a first name, a last name and a username, and lands with the name and the @handle set. An old account is asked once for what it lacks.

## Capability checks

- [x] A user can sign up with all six fields and WAWU ID keeps the names (`phone-signup.service.spec.ts`, `email-signup.service.spec.ts`).
- [x] A user is told while typing, and again on Continue, that a username is taken, ignoring case, in the server's words (`signup-identity.contract.spec.ts`: 9 tests, including two at once).
- [ ] A new person lands with the name and @handle set: NOT RUN live (no stack walk in the budget).
- [ ] An old account with no name or handle is asked once and never again: NOT RUN live.
- [ ] Open your wallet shows the names filled: NOT RUN live.

## History

[history/SIGNUP-NAMES.md](history/SIGNUP-NAMES.md).
