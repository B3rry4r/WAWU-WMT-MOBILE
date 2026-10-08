---
id: NUV-09
title: A dollar wallet for people billed in dollars
owner: YOU
area: MONEY
order: 207
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [NUV-02, NUV-03, NUV-04, NUV-05, TIER-01]
decisions: [R-43, R-44, R-16, R-21]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# NUV-09 · A dollar wallet for people billed in dollars

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- DECISIONS.md R-43 (dollar prices outside Nigeria) and R-16
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `core-concepts__entities.md` (foreign individuals), `core-concepts__account-details.md` (USD coordinates), `api-reference__accounts.md`

## Goal

People outside Nigeria pay their tier, extra products and points at the dollar prices (R-43). With no card
payment (R-44) they need a dollar wallet: their own Nuvion USD account, opened without BVN or NIN, filled by bank
transfer to its USD account details. Default (agent), owner may override (`docs/PAYMENTS-PLAN.md` question 2).

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- WALLET-32 (dollar account and swaps, after launch): the part R-43 needs moves to launch here; swaps and FX stay after launch in WALLET-32.

## Scope

- Opening for a person without a Nigerian BVN: the entity with nationality, ID details, ID document and proof of address (NUV-03), no BVN or NIN; a USD `checking` account and its USD account details as Nuvion issues them.
- The money core holds a currency: a nullable `currency` (default `NGN`) on the ledger, payment and balance rows; amounts in minor units (cents for USD); one currency per wallet. Pay from wallet, hold, release and refund work in USD for the purchase kinds of TIER-03, TIER-04, POINTS-02 and POINTS-03 only. Sends to people and banks stay naira only.
- `GET /money/wallet` and `GET /money/wallet/balance`: additive `currency`.
- Not in scope: FX, USD payouts, cards.

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] A person with no Nigerian BVN can open a dollar wallet with an ID and a proof of address, and sees USD account details once active.
- [ ] A USD transfer in credits their dollar wallet once, in cents; the balance is Nuvion's USD `available`.
- [ ] They can pay a tier from the dollar wallet at the dollar price, once per reference (V8); a naira-billed person can never pay in dollars and a dollar-billed person never in naira.
- [ ] Every existing naira money spec passes unchanged (currency defaults to NGN) (V3).
- [ ] (key) A sandbox USD account for a non-Nigerian test entity gets active account details.

## Builder report

## Verifier report

## Owner sign-off
