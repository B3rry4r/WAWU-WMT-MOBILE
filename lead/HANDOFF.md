# HANDOFF: where the build stands (read this first)

As of Sat 17 Oct 2026 01:43 UTC (`date -u`), built from merge-notes (to 01:39), board.json and `git ls-remote`.
Everything below can drift in minutes: check `git ls-remote` against these heads before acting, then merge-notes.

## 1. How to start
1. Attach three repos: `MOXN-AFRICA/wawu-wmt-mobile` (the product, this branch `lead`), `B3rry4r/WAWU-Backend`
   (called wawu-backend) and `B3rry4r/wawu-id`. The web repo `B3rry4r/WAWUAfrica` is paused (R-49); attach it only if asked.
2. Enable the owner's skills on the account: admin-surface-extension, build-orchestration, contract-driven-backend,
   design-canvas-port, design-change-adoption, frontend-surface-build, legacy-app-repair, live-system-change, qa-audit,
   verification-harness. Put RUNBOOK.md section 1 (the owner's rules) into the account's global CLAUDE.md.
3. Read this file, then RUNBOOK.md. Compare `git ls-remote` of the three repos with sections 2 to 4; a head that moved
   means someone (an agent still running, or the owner) changed it: find out why before you act.
4. Set `LEAD_SCRATCH=<a folder>` (default: `scratch/` next to the repo). `tools/mk.py` writes briefs and renders
   common-rules.md there. The Machine section of tools/common-rules.md (paths under /home/user, memory, Postgres,
   Playwright) describes the first machine: edit it for yours.
5. Not in this folder, and the new account needs from the owner: Expo token (APK), Fintava and Nuvion sandbox keys,
   the Gemini test key (rotating, free tier, minimal calls), GitHub access to both orgs, a new board artifact link
   (put it here), and a new hourly check-in. The first account's board: https://claude.ai/artifact/2GCtXgV2hRKhpCpZEVexcU

## 2. Live now
| What | Head | Carries |
|---|---|---|
| backend main | a5e48fc | batch 5 (PR #141, deploy run 38984905981 success, health 200): bank sends, bills, credits, school fees, sends to WAWU users, upload preview, video and PDFs, FIX-40 to FIX-42; before it: batch 2 (#137), 3 (#138), 4 (#139), FIX-43 hotfix (#140) |
| app main | 7de785d | MERGE-5: batch 5 app side, DESIGN-V2 and DESIGN-V2-CUT (rulings R-50 to R-69, 38 new tasks); full check EXIT 0; launch list 170 of 292 |
| wawu-id main | 8e4ee10 | JOIN-03 (#17) and the WALLET-35 statement relay (#18), both deployed |
| web main | 5b45d65 | OPS-CI (#32); wawuafrica.com serves only /join (R-48) |
Open backend PRs: #83 EVENTS-11 (head a4b61fa) and #26 OPS-08 (93932ef): refresh onto main, then the owner's `relock-approved` label.

## 3. Ready to merge: batch 6 (nothing is merged or opened yet; stack first, RUNBOOK section 4)
| Task | Backend head | App head | Verdict report | To do at the stack |
|---|---|---|---|---|
| EVENTS-07 | 6603fba (on 73f4eb5, not on main) | 2c596a1 (on 1ca79a3) | history/verify/EVENTS-07.md: merge (r2+r3) | move onto main; rename migration 20261024010000; keep the purge hook call (SETTINGS-06 conflict) |
| WALLET-39 | 2194ffb (on main) | e768bc6 (on app main) | history/verify/WALLET-39.md: merge | regenerate app types |
| GATES-02 | 1d03bc2 (on main) | ec00b9a (on d1353ae) | history/verify/GATES-02.md: merge | baseline only; re-key the forks entry to the final line of content-piece.service.ts |
| HOME-16 | f3090ea (on main) | b3cb354 (on app main) | history/verify/HOME-16.md: merge | none; HOME-17 follows |
Next action: brief a MERGE-6 builder to stack these on backend a5e48fc and app 7de785d (add TIER-06 if its r2 check
passes), then one PR, the owner's approval prompt, deploy watch, health, app main fast-forward after a green full check.

## 4. In flight (heads from ls-remote at 01:43; builders push as they go)
| Task | Round, state | Backend | App | Ports, stamp | Waits for |
|---|---|---|---|---|---|
| SETTINGS-06 delete account | r8 built, lean verifier running | 2ef4591 (incl main) | 112a8f1 (on old main) | 7110-7117; 20261024030000, 040000, 050000 | verdict; then batch 7. Forks gate line is now :67 (MERGE-6 re-keys GATES-02) |
| TIER-06 plan, points, referral settings | r2 pushed, hand-back not yet read (r1 verdict fix) | 361df74 | 2599921 | 7430-7437; 20261024060000 | the r2 report, then v TIER-06 r2. r2 fixes: HIGH convert quote not bound, M tier purchase goods not bound, M third milestone must be OFF, cash rate not above cheapest pack price per point, lows |
| TIER-07 tier badge on profiles | built, verifier launched 01:39 | 493a276 | 5e94116 | 7470-7477; 20261024090000 (maker_badge_number); SHARED-CHANGES TIER-07 #1 | the verdict |
| KYC-06 ID and address screens | r2 building (r1 verdict fix: M1 resubmit loop after cold start, M2 files kept on Back, M3 routes outside the signed-in guard) | none | b6629b4 | 7460-7467; none | r2 with owner answers 29 to 31 and SHARED-CHANGES KYC-06 #1; then a verifier who takes the V5 pictures |
| EXPLORE-02 all creators and search | built, check queued | 2d0d5d9 | 86bbe0d | 7330-7337; 20261023240000 | the new designs (X boards); V5 pictures not taken; stamp must be renamed |
| WALLET-16 earnings to wallet | passed | 315b69b | 0da32a7 | 7021-7028 | the owner's live count of unpaid sales (Q-21) |
| LEAD-HANDOFF | this folder | | `lead` | | the owner's go to move accounts |

## 5. Next by wave (tasks/DESIGN-V2-CUT.md has the full table with orders and "after")
- Wave 1: GATES-02, HOME-16, WALLET-39 (ready), TIER-06, TIER-07, KYC-06 (in flight above).
- Wave 2 launches as slots open (money core first). Unblocked now (every dependency verified): WALLET-37, EXPLORE-06, ADS-07.
  After a task in flight: KYC-07 (KYC-06); REF-02 and WALLET-38 (TIER-06); EVENTS-12 (TIER-07, EVENTS-11); DV2-06 (HOME-16).
  After an older todo task: INBOX-22 and INBOX-24 (WALLET-17, which waits for WALLET-16 and EVENTS-07; INBOX-22 also needs the owner's
  relock label); VOICE-01 and AITOOLS-01 (POINTS-03 and the owner's AI voice key); DV2-COMP (SHARED-06). On the critical path and
  not in the table: TIER-05 (order 211), POINTS-02 (212), POINTS-03 (213), SHARED-06 (229), WALLET-17 (159). Task files on main
  still say `verifying` for work the board shows as passed: the board and merge-notes are the live state.
- Wave 3: VERIFY-01, ME-12, POINTS-05, REF-03, EXPLORE-07, INBOX-23, INBOX-14, DV2-01, DV2-03, DV2-05.
  Wave 4: VERIFY-02, VERIFY-04, VERIFY-05, POINTS-06, DV2-02, DV2-04. Wave 5: VERIFY-03, POINTS-07, DV2-COPY, DV2-RM. Wave 6: POINTS-08.
- Also queued: TIER-05 (pay by bank transfer at checkout), TIER-04 (add 5 more products), HOME-17 (TGIF time in admin, after
  TIER-06), FIX-44 (EVENTS-07 hook window, after batch 6), FIX-45 (pin-request-key flake, test only), FIX-39 (nuvion-documents 500
  under load, may be a real race), the SWEEP-* tasks for the lows. Stopped: WALLET-25, WALLET-26 (bank transfer only).
- Then Full QA (CHECK-3) and the stores (RELEASE-02). Target: the app (WMT) on 24 Oct; Voices a week or two after.

## 6. Waiting on the owner (the board's wording)
- Approve merges when asked: each merge is one Approve tap. The board text still says "Next: batch 5"; batch 5 is live, so batch 6 is next.
- Keys and accounts only the owner can give: Fintava sandbox key, Nuvion sandbox key, Expo token (for the APK), fix GitHub billing (app checks).
- For WMT on 24 Oct, Voices a week after: 1 more Max 20x plan (N280k); sign that plan into its own session; AI voice provider key
  (Voice Intro, Studio); one live count: unpaid sales (WALLET-16, Q-21 is the only open question); Voices: brand pick and section 22 by 24 Oct.
- Cards: WALLET-16 "your live sales count"; WEBPAY-01 "Website wallet, web paused"; EVENTS-11 and OPS-08 "refresh, then your label".
- Held until the owner confirms: the licence and CBN words (R-67); a board for community video and voice composers (G-807);
  whether private rooms keep any host approval. Branch deletion over the proxy is blocked: the owner can enable auto-delete of head branches.
- Mobile CI: GitHub cannot run it (billing), so mobile checks run locally and the lead trusts only the log's EXIT line.

## 7. Lead rulings not yet in DECISIONS.md (it ends at R-69)
Owner answers of 17 Oct 01:11 (round 7): KYC-06 adds ID type and number (A26) and bill type and postal code (A27); a
passport asks for one side; checking screen says "This usually takes a few minutes" and an alert when ready (A28); the
daily TGIF notice goes at 07:00 Lagos, changeable in admin, notices older than 30 days are cleared (HOME-17).
Lead rulings (the task file or merge-notes holds the detail; confirm the product ones with the owner at the next docs batch):
- Process: severity decides rounds; one PR at a time, each batch on the previous head; no transaction, connection or lock held
  across a network call; never disable git hooks (these are in tools/common-rules.md).
- Money: BILLS-04 one record settles one bill (+unique), provider checked first, a late success after a refund opens a review
  row. WALLET-09 refusals by kind (insufficient, frozen, payouts_blocked mean failed) and a signed nameToken valid 15 minutes.
  FIX-41 reviews a bank send that later succeeds. WALLET-02 W12 beneficiary switch is ON and saves itself; stale intents are
  dropped with one line. WALLET-39 notice target is the transaction, corrections are their own kind and listed when muted,
  30-day window. TIER-06 12-month lots, undrawn third referral milestone OFF, 7-day hold and AI costs as settings, W44 lines go to WALLET-38.
- Events and accounts: EVENTS-07 an erased host refunds held holds including the charge, only for events not started (started
  or past keep holds for G-461), a losing buyer gets fees back. SETTINGS-06 buyers keep access from the delete request, kept
  text is scrubbed, deletion-hidden pieces block only comments and saves. EXPLORE-05 popular searches use an allow-list (text
  equals a public name). ADS-01 shows "SPONSORED" alone. ME-04 a never-released late file counts past the limit.

## 8. Port and migration-stamp registry
Backend ports are blocks of 8 (some 10); a verifier reuses its builder's block. Used, 7001 up: MERGE-1 7001; WALLET-04 7011;
WALLET-16 7021; WALLET-10 7031; POINTS-04 7041; FIX-20 7051; WALLET-23 7070; FIX-18 7080; FIX-26 7090; WALLET-35 7100;
SETTINGS-06 7110; WALLET-25 7120; WALLET-26 7130; INBOX-12 7140; FIX-10 7150; FIX-13 7160; INBOX-21 7170; ME-04 7180; FIX-09 7190;
FIX-19 7200; FIX-15 7210; FIX-28 7220; FIX-22 7230; FIX-14 7240; EXPLORE-05 7250; SHARED-05 7260; SHARED-07 7270; ADS-01 7280;
SCHOOLS-10 7290; WALLET-09 7300; BILLS-04 7310; WALLET-02 7320; EXPLORE-02 and EVENTS-11 7330; FIX-34 7340; FIX-35 7350; FIX-36/37 7360
(to 7369); GATES-01 verifier 7370; FIX-41 7380; FIX-40/42 7390; INBOX-16 7400; EVENTS-07 7410; SCHOOLS-07 7420; TIER-06 7430;
WALLET-39 7440; HOME-16 7450; KYC-06 7460; TIER-07 7470. Older 4-port blocks 5961 to 6538 (NUV, MONEY, INBOX-05, OPS-STACK 6531) are
finished. **Next free ports: 7480-7487, then 7490, 7500 and so on.** Check `ss -ltn` before giving a range.
Migrations: backend main's last is 20261024020000_school_enrolments (SCHOOLS-07); before it 20261024000000 INBOX-16,
20261023230000 FIX-42, 20261023210000 BILLS-04, 20261023200000 WALLET-09, 20261023100000 ME-04. Reserved on branches:
20261024010000 EVENTS-07 and 20261023240000 EXPLORE-02 (both sort before main's last: rename at merge), 20261024030000/040000/050000
SETTINGS-06, 20261024060000 TIER-06 plan_settings, 20261024070000 WALLET-39, 20261024080000 HOME-16, 20261024090000 TIER-07.
**Next free stamp: 20261024100000** (the batch builder renames so the final order equals merge order). wawu-id's last on main:
20261011120000_phone_verified_for.

## 9. Spend so far (transcripts, API list prices; the folder holds no earlier days than 10 Oct)
Agents (Sonnet) $2,596 and lead (Opus) $299, total $2,895, 10 to 17 Oct 01:30. Agents by day: 10 Oct $832, 11 Oct $1,069, 16 Oct $577,
17 Oct $64 so far; runs on 16 Oct had a median of $2.48. Measured plan-week about $2,300; about $650 used since the weekly reset
(merge-notes, 17 Oct 01:19). Budget page figures: WMT 146 tasks, about 740 runs, about $4,070; total expected about $5,900; two
Max 20x plans (N560k); the heavy case slips WMT about two days instead of buying a third plan. Capacity guard: stop new builders near 80%.
