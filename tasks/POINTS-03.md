---
id: POINTS-03
title: Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet
owner: YOU
area: POINTS
order: 213
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [POINTS-01, POINTS-02]
decisions: [R-43, R-38]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-03 · Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

Every AI tool shows its points cost before use (PT1, PT2), runs only once its points are held, and keeps them only
if it succeeds ("No points were taken" when it fails). Daily and per-job caps give a friendly answer (PT7). When
points run short and "Use wallet" is on, the person is shown the wallet money needed and nothing runs until they
confirm (PT3; brief: "Without confirm, do nothing").

## Scope

- `src/points/spend/`: an internal service (`hold`, `commit`, `release` for a job) that the AI tools' server code calls; client routes `POST /points/quote` (`action`, `units` → cost from config, balance, shortfall, the wallet money for the shortfall at the pack rate in the person's currency, and any cap that stops it), `POST /points/shortfall` (PIN, Idempotency-Key: buys exactly the shortfall from the wallet, purpose `points_shortfall`, one lot), `PUT /me/points/settings` (`useWallet`, off by default).
- Caps from config: daily points per person, characters per job and minutes per job; over a cap the answer is `points_cap_reached` naming the cap and when it resets.
- Not in scope: the AI tools themselves (ElevenLabs, the Voice Intro), which tasks cut from the PT and VF boards build on this service. They open from the Create button, never a tab (R-38).

## Capability checks

- [ ] A person sees VoiceOver's cost for 2 minutes (from config) before running; a hold takes it, a failed job releases all of it, a finished job keeps it.
- [ ] With too few points and "Use wallet" off, the quote shows the shortfall and offers buying points; nothing is taken.
- [ ] With "Use wallet" on, the quote shows the wallet money for the shortfall; nothing is debited until `POST /points/shortfall` with the PIN, which debits once and grants once even when sent twice (V8).
- [ ] Past the daily cap, or over the characters or minutes per job, the answer names the cap and nothing is held.
- [ ] Two holds at once never take points below zero.

## Builder report

## Verifier report

## Owner sign-off
