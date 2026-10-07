---
id: AUTH-08
title: Refreshing and signing out stay fast however many times a person has signed in
owner: YOU
area: AUTH
order: 182
priority: launch
repo: wawu-id
type: backend-endpoint
status: todo
depends_on: [AUTH-03]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# AUTH-08 · Refreshing and signing out stay fast however many times a person has signed in

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/CHECK-1.md`, Verifier report, finding F-5; `tasks/SETTINGS-01.md`, gap G-264
- wawu-id `src/auth/tokens.service.ts` (`rotateRefreshToken`, `revokeRefreshToken`) and `src/auth/session-security.spec.ts`

## Goal

A refresh or a sign-out finds the presented refresh token directly instead of password-hash-checking it against every token the account has ever stored. Today both read all of the account's stored refresh tokens and run argon2 on each until one matches, and nothing deletes expired ones: the CHECK-1 audit saw a refresh take over 20 s for an account with 53 stored tokens, and SETTINGS-01 saw sign-out take 13 to 49 s.

## Scope

wawu-id only. Each new refresh token carries an id (a `jti`) stored with its record; rotation and revocation look up that one record and verify it once. Tokens issued before this change (no `jti`) still work until they expire, by the old path limited to unexpired records. Expired records are removed (on issue, or by a sweep). Single-use rotation, the account lock, and every rule in `session-security.spec.ts` stay exactly as they are. Additive migration only.

## Capability checks

- [ ] With 200 stored refresh tokens on one account, a refresh and a sign-out each answer in under 1 s, and the same refresh at 2 tokens is no slower than before.
- [ ] A refresh token issued before the change still refreshes once, and only once.
- [ ] Every existing session-security rule still holds (reuse refused, a password change or sign-out sweeps every token, a rotation racing a sign-out loses).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md)._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "evidence reviewed"._
