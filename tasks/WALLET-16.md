---
id: WALLET-16
title: Earnings land in the wallet automatically
owner: YOU
area: WALLET
order: 98
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-12]
decisions: [R-11, R-55, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-16 · Earnings land in the wallet automatically

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge (the B1 medium F1 and F3 closed by the R-55 round; 3 lows); branch CI red only on the Fintava-double earning-settlement spec (R-55, owner question Q-42, ruled in R-70) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-16-R55.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main.
- **Branches:** backend `wmt/WALLET-16-R55` `9580bb0` (from `wmt/B1` `e41210e`; B1 not pushed to), mobile `wmt/WALLET-16-R55` (records and the contract copy). Migration `20261025140000_earning_daily_moves`, additive: table `EarningMove`, nullable `EarningSettlement.moveId`, CHECKs, two guard triggers. The stamps `20261025120000` and `20261025130000` are unchanged. SHARED-CHANGES WALLET-16 #8.
- **Merged and live:** nothing of this task (it is in `wmt/MERGE-12`, not on main).
- **Sweep start cutoff (lead ruling 17 Oct):** untouched; its spec passes.
- **One move a day (R-55, built):** the sweep makes one `EarningMove` per creator per Lagos day, carrying every earning not yet in a move, as ONE wallet-to-wallet transfer; the provider's charge is paid once. Made when the creator has a wallet, a total of at least `EARNINGS_MOVE_MIN_KOBO` (20000; exactly N200 moves, N199.99 waits and joins the next day's), no open move, and no move made or landed today. The reference is `wawu-earn-d-<YYYYMMDD>-<24 hex of the creator>`; (creator, day) is unique and one open move per creator is a partial unique index, so two servers on one day make one. All earnings land with the move in one write; the ledger has one pair for the transfer. No wallet: the creator keeps earning (`waiting` `payee_wallet`) and the first sweep after the wallet opens moves it all.
- **Review 72 h after the first refusal (R-55, built):** `firstRefusedAt` is written once (the provider refused, or its record says the move failed); at `EARNINGS_REFUSED_REVIEW_AFTER_HOURS` (72) after it the move goes to review, once (`reviewSince`), and the look after a refusal is never later than that hour. Later refusals do not restart it. A frozen wallet, a missing wallet, funds and an unreachable provider are not refusals and keep waiting, as before.
- **B1 check fixes (lead, 17 Oct):** F1 medium: `GET /admin/money/earnings/before-start` is now the repo's cursor page `{ startsAt, source, count, items, nextCursor }` with `?limit&cursor`, so page 2 is reachable; tested over HTTP (superadmin, finance, support 403, no token 401, walked by the server's own cursor, bad limit and cursor 400). F3 low: `EARNINGS_SWEEP_START` refuses a day that does not exist (`2026-02-31`) and `T24:00`, `T23:60`, `T10:00:60`; unit tests in `earning-day.spec.ts`.
- **Specs (Nuvion stand-in, ledger equals the stand-in after each):** `earning-daily-move.contract.spec.ts` 8 tests: many sales one transfer per creator, two servers one move and a later sale waits, 199.99 waits then joins and 200.00 moves, first refusal then 72 h then one review row, a refused move that lands is the day's transfer, no wallet then moved the day it opens, an earning whose sale is pulled leaves before sending, the database guards. `earning-day.spec.ts` (unit, 11). Run: these, the sweep-start spec (5, with the HTTP cursor test), `earning-settlement-nuvion`, `nuvion-earnings`, unlock, legal fee and tip wallet specs, `earning-rules`, money-in notice, account-data-map, data-export-map: 210 pass.
- **Changed by the ruling, not to pass a check:** the three Nuvion earnings specs asserted one transfer per sale (`wawu-earn-<payment id>`) and now assert the creator's one move; the shared `wallet-pay-harness.ts` cleanup also removes moves.
- **NOT RUN, for the lead:** `earning-settlement.contract.spec.ts` is the Fintava spec (per-sale transfers, the old bound); it was not touched or run and will fail in CI by design under R-55: it needs the owner's or the lead's decision on a Fintava task.
- **Decisions to confirm (agent defaults):** the move is made at the first sweep of the day at which the total reaches the floor, not at a fixed hour, so a creator's later sales that day wait for the next day; a held kind's release (DM, ticket, bill) is still its own transfer; no admin view of moves in review yet.
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-MONEY (B1 F2, F4 to F6; R55-1 to R55-3).
- **Records:** tasks/history/WALLET-16.md.

## Owner rulings of 16 Oct 2026 (R-55)

- **Refused earnings (R-55, owner 16 Oct):** an earning the wallet refuses goes to review 72 hours after its FIRST refusal. This settles F3 (a `refused` earning never reached review): the review path uses 72 h from the first refusal, not a count of tries.
- **One move a day (R-55, owner 16 Oct; G-703):** all of a creator's earnings go to their wallet once a day in one transfer per creator. A day's total under ₦200 waits for the next day and is added to it. This replaces one move per sale and answers G-703 (sales under about ₦155 no longer cost WAWU more than its 15%): the provider's charge is paid once per creator per day. The split is unchanged: 85/15 (R-5). The ₦200 floor and the 72 h are settings.
- The sweep builds the reference per creator and day (idempotent); a creator with no wallet keeps earning and the money waits (R-11).
- F8 stays open (the owner or production access): the count of unsettled completed sales with a payee on the LIVE database before this task merges.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-11 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Sales, tips and answered paid questions land in the creator's wallet automatically (R-11). W39 shows where they came from.

## Scope

Per-content earnings breakdown; automatic settlement into the wallet. A creator without a wallet keeps earning; the money waits and lands the moment they open one.

## Capability checks

- [x] Earnings shown equal the sum of that creator's sales after the split.
- [x] A creator with no wallet who earns, then opens a wallet, sees the waiting earnings land once.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-16.md](history/WALLET-16.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
