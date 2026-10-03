---
id: WALLET-14
title: Saved recipients and payout account
owner: YOU
area: WALLET
order: 116
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-06, KYC-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-14 · Saved recipients and payout account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A21, W17: a saved payout bank with a real bank code, checked against the BVN name.

## Scope

Beneficiaries; payout account with bank code and resolved name (through the Fintava client, MONEY-06), checked against the BVN name (KYC-01).

## Capability checks

- [ ] A payout account whose name doesn't match the BVN name is flagged.
- [ ] A saved recipient can be removed.

## Builder report

Builder, 3 Oct 2026. Backend `wmt/WALLET-14` `514d3ad` (main `6d48c97`, unmoved, plus `wmt/MONEY-13` `35b68af` merged in `bd35548`, as the lead asked); mobile `wmt/WALLET-14` (on main `12aa3c9`, unmoved).
- **Built (backend, additive):** serves the five routes MONEY-04 declared: `GET`/`POST /money/beneficiaries`, `DELETE /money/beneficiaries/{id}`, `GET`/`PUT /money/payout-account` (`src/money/saved-accounts/`: controller, `BeneficiaryService`, `PayoutAccountService`, `BankAccountCheckService`, spec), each route behind MONEY-13's gate (`@RequireOpenWallet()`, `@CurrentWallet()`; my stand-in `open-wallet-gate.ts` deleted, G-47 handled), declarations removed from `money-transfer.controller.ts`. Migration `20261003160000_saved_beneficiaries_payout_account` (`MoneyBeneficiary`, `MoneyPayoutAccount`, nullable `WalletIdentity.bvnNameKeys`), purge map, one new code `beneficiary_limit_reached` (409), contract regenerated, CONVENTIONS section 10, WALLET.md. Small edits in other tasks' files: KYC-01's `wallet-identity.service.ts` and `identity-config.ts` (the name keys), MONEY-12's `wallet-opening.service.ts` (`beneficiaryCount` now counts), `money.module.ts` (one controller, three providers, `WawuAuthModule`; merged with MONEY-13's gate providers). MONEY-13's two route lists (`wallet-gate-coverage.spec.ts`, `wallet-gate.contract.spec.ts`) gain the five routes, nothing else in them changed.
- **Mobile:** `contract/` and `src/api/schema.generated.ts` from the branch (SHARED-CHANGES WALLET-14 #2); `docs/fintava/sandbox/37-wallet14-recipients.md`; G-46, G-47. No screen (A21 is WALLET-11's).
- **The BVN name:** KYC-01 kept no name, so the BVN check now stores, with every passed check, the keyed hash (`IDENTITY_HASH_KEY`) of each word of the BVN record's first and last name; never the name. A bank account is saved only with a bank code in Fintava's list and a name check that confirms it (`00`, a name, the same number); the name is the bank's, a body carrying one is 400.
- **Check 1, a payout account whose name doesn't match the BVN name is flagged:** passed. Through the real `POST /money/identity/bvn` (Fintava's documented BVN body, Ada B Sandbox) then `PUT /money/payout-account`: bank name `SANDBOX ADA` gives `matchesBvnName: true`, `SIMI MICHELLE` is saved and answers `false` (also on GET); `null` with no check, no name kept, or a wallet opened under another BVN check. Unit spec: order, case, accents, missing middle name match; an initial or one name only is flagged.
- **Check 2, a saved recipient can be removed:** passed. DELETE answers 200 and the list and `WalletView.beneficiaryCount` drop it; again, or someone else's id, is 200 and removes nothing; on the built Hub too (below).
- **Also proved (spec, 27 tests + 17 unit):** name check refusals 422 and nothing changes; Fintava 500, hang-up, refused key, 1.5 s timeout and bank list 502 are 503 with nothing saved; old CBN code `044` refused before Fintava; WAWU user saved only with a wallet (409/404/400 self); same place saved 4 at once is one row; 49 saved + 3 at once gives 201, 409, 409 (cap 50 under a per-person lock); 401 without token, 409 `wallet_not_open`/`wallet_opening` with nothing sent; no account number, name, BVN or NIN in any log line; no name word in any column. Mutation-checked (12): always-match, delete any owner's, no lock, ignore `matched`, ignore the number, any bank code, self allowed, mixed body, no keys stored, no wallet gate (before and after the merge: one `@RequireOpenWallet()` removed fails 11 tests), no opening tie: all killed.
- **Sandbox (V9 seam):** built Hub :4951, stand-in WAWU ID :4952, real login, 3 free GETs (`/banks`, `/name/enquiry` x2, stub `0123456789`/`000013`): saved and read back `GTBANK PLC`, `SIMI MICHELLE`; B saw nothing of A's. 0 key windows in log and output.
- **Runs (after the MONEY-13 merge, `514d3ad`):** tsc 0; eslint 0 on all 27 `.ts` files changed against main; the 6 suites that hard-code :4001 (kyc-submission, notification, blocked-account, privacy-settings, saved-item, credits-state) 6/6 suites, 62/62 tests (my mock on :4001 once `lsof` showed it free, stopped after); full suite on fresh `w14_full_test`: 126 suites, 3,065 passed, 3 skipped, 0 failed (gate specs 45/45, mine 27/27); protected `--fresh HEAD` 253/253, lock `6d48c97` unchanged; tripwire 0 added lines; `hub-rate-limits` 10/10 (no `@Throttle` added); gates main 16 fail / 10 warn, branch 16 / 11 (the added warn is `PROVISIONAL(BENEFICIARIES-MAX)`), same 16 fails, baseline OK; `contract:build` unchanged by the merge (mobile copy byte-identical). Mobile `npm run check`: main exit 1 (PROGRESS.md out of date on main; 20 suites 371 tests, gates 0 on 96 files), branch exit 0 (typecheck, lint, 20 suites 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks). Before the merge (`a53fe14`) the same checks passed, except that :4001 was held by another session.
- **NOT RUN:** `matchesBvnName` against a real sandbox BVN record (no sandbox BVN passes, question 11). The sandbox seam (3 calls, above) ran before the MONEY-13 merge; the gate reads only our database, and its HTTP spec covers the five routes.
- **Defaults (agent), owner may override:** flag, not refuse, a payout account in another name (G-46); match rule (every word of first and last name, any order, middle name not needed); at most 50 beneficiaries, PROVISIONAL; a person holding both ticks shows the creator tick (`MoneyPartyView` has one); bank list kept an hour; a saved WAWU user shows only while they have a wallet; `POST` answers 201 for an existing one too; "Creators only" on A21 not enforced (listed as not a fact).
- **Findings for other tasks:** WALLET-09's `name-check` and these saves both reveal an account holder's name for any number (Fintava's free check, global throttle only); a per-person limit there would cover both.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
