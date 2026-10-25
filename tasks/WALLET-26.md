---
id: WALLET-26
title: Add money by USSD
owner: YOU
area: WALLET
order: 312
priority: after-launch
repo: wawu-backend
type: third-party
status: review
depends_on: [MONEY-06]
decisions: [R-10, R-42, R-47, R-79, R-83, R-84]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
tier: T2
---
# WALLET-26 · Add money by USSD

## Current state

As of 24 Oct 2026, built by the same Sonnet builder as WALLET-25 (bundle B21, T2) on the same branches: backend `wmt/WALLET-25`, mobile `wmt/WALLET-25` (one branch per repo, named for the bundle's first task; commits name both). R-84 turned this task on (`priority` left `after-launch`, order unchanged: the lead moves it). Status verifying. **Default (lead), owner may override:** "USSD" is Nuvion's mobile money prompt (`funding_type` `momo`) and "open banking" is its hosted bank checkout (a funding session); both go through the one add-money route (`rail` `ussd` and `open_banking`) and the one status screen.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | no USSD and no bank checkout | `POST /money/add-money` with `rail` `ussd` (a prompt on the person's phone, the number defaulting to the account's) or `open_banking` (a hosted page, opened with expo-linking, back by `wawu://add-money/status`); the attempt is read from Nuvion by the webhook (`funding_sessions.updated`, read back before it is believed) and by the sweep; the credit is the settled inflow (see WALLET-25 row 2) |
| 2 | W15 had no USSD row | W15 lists USSD and Bank checkout from the Hub's options; each shows the Hub's reason when it cannot be used (R-47: nothing opens that does nothing) |

**Dev answers.** Nuvion lists mobile money channels for Tanzania and Kenya only, so there is no Nigerian USSD to send: the Hub offers USSD only when `ADD_MONEY_USSD_CHANNEL` is set and says "USSD is not available for Nigerian phone numbers yet." until then (G-WALLET-26-1). Naira funding sessions of both kinds answer 503 on dev. GBP open banking and KES mobile money were created and read on dev; EUR open banking was settled on 23 Oct (NUV-04 row). **NOT RUN:** a USSD payment or a bank checkout settling to a naira wallet; the screens on a phone. The capability checks below are about the code and the stand-in; the dev rows say what Nuvion did.

- **Round 1 (24 Oct 2026):** the shared fixes (F1 to F7) are recorded in tasks/WALLET-25.md; for USSD and the bank checkout they are F2 (a frozen attempt is held and credits on unfreeze), F4 (the hosted bank checkout is listed first), F5 to F7 (stamp, ciphertext length for the card only, the atomic daily limit).
- **Next:** a verifier (not the builder). Nuvion names a Nigerian USSD channel and switches on naira funding sessions.
- **History:** none yet. Reports go to tasks/history/WALLET-26.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 4e21f52, app e3eaf6ec, verifier PASS in the lead's merge log, 24 Oct (v-WALLET-25-r1, same bundle B21; lead accepted round 3 on green Branch checks).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W15: a USSD option.

## Scope

USSD funding if Fintava supports it; otherwise the USSD option stays not built and `docs/designer/BRIEF.md` records it. This task adds the USSD option to W15 when it lands.

## Capability checks

- [x] A USSD attempt asks Nuvion for a prompt on the person's phone, and a failed prompt ends in plain words (spec, stand-in).
- [x] The bank checkout and Apple Pay are hosted pages the app opens in the browser and comes back from by link (spec; `OtherWays` and the status screen tests).
- [ ] A sandbox USSD payment credits the wallet once: NOT RUN, Nuvion has no Nigerian USSD channel and dev refuses naira funding sessions (G-WALLET-26-1).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

Checked together with WALLET-25, one branch and one verdict, **FIX**: see the Verifier report in `tasks/WALLET-25.md` (F1 to F7). USSD: not claimed for Nigeria (options and quote say so); the bank checkout reached Nuvion in GBP (checkout URL and expiry); naira bank checkout 503 is mapped to a plain refusal.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
