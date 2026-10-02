---
id: OPS-02
title: Fintava test keys: the first real calls
owner: YOU
area: OPS
order: 3
priority: launch
repo: wawu-wmt-mobile
type: ops
status: verifying
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-02 · Fintava test keys: the first real calls

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Money is built from Fintava's published docs (`docs/fintava/`), so nothing waits on this task. When the test (sandbox) keys arrive, this task runs the real calls and corrects anything the docs got wrong before money goes live (CHECK-2).

## Scope

The published docs are already in `docs/fintava/reference/`, digested in `docs/fintava/naira-api.md`. Still needed: sandbox keys in the backend's local `.env` (not committed), one file per sandbox call with request and full response (keys and BVNs masked), webhooks with their headers, and written answers to the questions at the end of `naira-api.md`. Correct `naira-api.md` wherever a real response differs.

## Capability checks

- [ ] docs/fintava/ has every sandbox call listed in docs/PLAN.md, each with request and response.
- [ ] Every question at the end of `docs/fintava/naira-api.md` has a written answer or 'unknown'.
- [ ] No secret or real BVN is committed (gates and a manual read).

## Builder report

Builder, 2 Oct 2026, branch `wmt/OPS-02`. About 100 sandbox calls (`dev.fintavapay.com/api/dev` only), ₦40 spent, 0 customers created.
- **Blocker:** WAWU's sandbox merchant is `inactive`. Create customer, customer reads, BVN check, every transfer, every bill purchase and freeze/unfreeze answer `403 Merchant is not active` before validation. Unblocked when Fintava activates the sandbox merchant so `POST /create/customer` stops answering 403 (question 10 in `naira-api.md`).
- Files: `docs/fintava/sandbox/` (README plus 25 call files), corrections in `docs/fintava/naira-api.md`, `limits.md`, `fees.md`, `README.md`; `docs/LOG.md`; this file.
- Check 1 (every PLAN call saved): **partly**. Ran to a result: bank list, both name enquiries, phone check, selfie check, merchant balance and history, lookups by reference and id, discos, meter preview, data and cable lists, error shapes, measured charges. Saved as refused (403, NOT RUN to a result): BVN check, create customer, wallet-to-wallet (3 directions), bank send (success, failure, reversal), freeze/unfreeze, electricity, airtime, data, cable. Webhooks NOT RUN: no public URL here and nothing could fire (`sandbox/23-webhooks.md` lists the tunnel steps).
- Check 2 (every question answered or 'unknown'): done in `sandbox/README.md`, with evidence; 6 new questions added (10 to 15).
- Check 3 (no secret or real BVN committed): `git diff --cached` grepped for the key (0 hits) and for 11-digit runs (0 hits). The one real BVN and NIN received (the merchant admin's, embedded by Fintava in `GET /transaction/id`) are masked completely.
- Findings that change plans: a wrong key is 400 not 401; error bodies are `{status,timestamp,message[],path}` or a nested validation object; unknown transaction id is 200 `data:null`; `/txn/merchant` is cached about 5 minutes per page/take; selfie (₦10) and phone (₦5) checks are charged even when they fail; merchant balance returns `tier: "TIER_3"`; transaction-by-id embeds the customer's BVN/NIN; postpaid discos exist and minimums vary; 9mobile data is `ETISALAT`.
- Gates (`npm run check`): before (clean HEAD copy) typecheck 0 errors, lint clean, tests 4/4, gates 9 run, 5 files scanned, 0 fail/0 warn/0 accepted, task check 187 tasks. After: identical (exit 0; tests 4/4, gates 9 run, 5 scanned, 0/0/0, 187 tasks). Docs-only change, so no count moved.
- No shared-change requests. Nothing filed in `BACKEND_GAPS.md` (no code changed).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
