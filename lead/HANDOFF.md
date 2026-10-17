# HANDOFF: where the build stands (read this first)

As of Sat 17 Oct 2026 06:45 UTC (`date -u`), built from merge-notes (to 06:39), board.json and `git ls-remote`.
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
   (title "Who Made This progress"; rebuild it with `board/board-refresh.sh`, RUNBOOK section 5).
6. Briefs in `history/briefs/` are already rendered with the first machine's paths. To relaunch one, copy it and replace
   the old scratch path and session link with yours (or write a fresh one with `tools/mk.py`).

## 2. Live now (unchanged since 17 Oct 01:41)
| What | Head | Carries |
|---|---|---|
| backend main | a5e48fc | batch 5 (PR #141, deploy run 38984905981 success, health 200): bank sends, bills, credits, school fees, sends to WAWU users, upload preview, video and PDFs, FIX-40 to FIX-42; before it: batch 2 (#137), 3 (#138), 4 (#139), FIX-43 hotfix (#140) |
| app main | 7de785d | MERGE-5: batch 5 app side, DESIGN-V2 and DESIGN-V2-CUT (rulings R-50 to R-69, 38 new tasks); launch list 170 of 292 |
| wawu-id main | 8e4ee10 | JOIN-03 (#17) and the WALLET-35 statement relay (#18), both deployed |
| web main | 5b45d65 | OPS-CI (#32); wawuafrica.com serves only /join (R-48) |
Open backend PRs: **#142 batch 6** (below), #83 EVENTS-11 (head a4b61fa) and #26 OPS-08 (93932ef): refresh the last two onto main, then the owner's `relock-approved` label.

## 3. Ready to merge: two batches, one PR at a time (stack first, RUNBOOK section 4)
**Batch 6 = PR #142, open, green, waiting for the owner's one tap.** Backend `wmt/MERGE-6` fbf391f (18 of 18 checks success, mergeable clean);
app `wmt/MERGE-6` 70a7895 (full check EXIT 0). After the tap, in order: merge with merge_method `merge` and the full sha; run
`tools/watch_deploy.sh` (expect success, health 200); then the app main fast-forward to 70a7895 (owner prompt again), `tasks/INDEX.md` and
`npm run api`. Deploy migrations and code together (TIER-07 badge number is null until its grant runs).
| Task | Verdict report in history/verify/ |
|---|---|
| EVENTS-07 | EVENTS-07.md (r2+r3): merge. Migration 20261024010000 sorts before main's 020000, deploy-tested OK |
| WALLET-39, HOME-16, GATES-02 | WALLET-39.md, HOME-16.md, GATES-02.md: merge |
| TIER-06 (r2 be 361df74, app 3aa7a52) | TIER-06.md (r1 fix, r2 section): merge |
| TIER-07 (be 493a276, app 5e94116) | TIER-07.md: merge |

**Batch 7 = backend `wmt/MERGE-7` 5d1d93a, app `wmt/MERGE-7` cb95de16, built on batch 6, no PR yet.** Backend CI green except ONE gate
FAIL: the accepted `forks` entry (FlutterwaveConfigResponse) points at content-piece.service.ts:62 and SETTINGS-06 moved it to :67.
It needs the OWNER's OK to re-key it: the MERGE-7 agent was refused by the auto-mode classifier ("Security Test Removal") and the lead
would not run the script itself in its place. After the OK: on `wmt/MERGE-7`, from the backend worktree root, run `python3 <lead checkout>/lead/tools/rekey-forks-62-67.py`
(it changes only evidence, where and the key hash of that one entry, as GATES-02 r2 did), commit, push, wait for CI 9 of 9,
then open ONE PR (after #142 has merged). Mobile check: 193 suites, 3352 tests, 333 tasks, EXIT 0. Order numbers: HOME-17 294, WALLET-40 295, FIX-45 296.
| Task | Backend / app heads | Verdict (history/verify/) |
|---|---|---|
| SETTINGS-06 delete account | 9cbd159 / 0f58c01 | SETTINGS-06.md (r9): merge |
| KYC-06, KYC-07 ID and address, Home flag | none / 96f92d7, 8f360cd | KYC-06.md, KYC-06-r2.md, KYC-07.md: merge |
| ADS-07 advert artwork, slider | cf6da4a / 50dc44e | ADS-07.md: merge (rollback.sql added) |
| EXPLORE-06 popular communities | 2915f00 / 9de1a4e | EXPLORE-06.md: merge |
| WALLET-37 own-name withdrawals | 516a6bc / ec6d37b | WALLET-37.md (r5): merge |
| REF-02 referral points | 1165e79 / d52ed61 | REF-02.md: merge |
| WALLET-38 your pass | none / e9db0bf | WALLET-38.md: merge |
| EVENTS-10 refund when called off | 1b0ea03 / 1de1658 | EVENTS-10.md: merge |
| FIX-45 two flaky tests | a842113 / 990ee02 | FIX-45.md (r1); lead accepted the r2 diff (+8 -1) |
| SHARED-06 shared components | none / d563eb3 | SHARED-06.md: merge |
| WALLET-40 account-ready alert | a456db7 / fda3381 | WALLET-40.md: merge |
| HOME-17 TGIF time, retention | 94f90c6 / 840983a | HOME-17.md: merge |
Checked and waiting for the next batch-7 addition: **DV2-06** (app 5de3160 on `wmt/SHARED-06` d563eb3; DV2-06.md: merge). EVENTS-13 and
TIER-05 r2 join the same way when their checks pass. Lows from all of these are in the SWEEP-* task lists on the batch.

## 4. In flight (heads from ls-remote at 06:40; builders push as they go)
| Task | Round, state | Backend | App | Ports, stamp | Brief (history/briefs/) and next step |
|---|---|---|---|---|---|
| v EVENTS-13 call-off: order cap, cancel once, free tickets | built, verifier running | b22e1b6 (on MERGE-7 ca9ec13) | c458abe | 7560-7567; 20261025000000 reserved, no migration | v-EVENTS-13.txt (builder b-EVENTS-13.txt). Passes: joins batch 7 |
| b DV2-COMP shared pieces (TierBadge, ProductsMeter, PointsFigure, VoicePlayer) | round 2 building. r1 fix: M1 'Sept' (use lagosTime MONTHS), M2 7-digit hero points overflow, lows L3 to L6 | none | 51235be (on SHARED-06 d563eb3) | 7620-7627 | b-DV2-COMP-r2.txt (r1 b-DV2-COMP.txt, verifier v-DV2-COMP.txt). Then a verifier; passing opens wave 3 |
| v TIER-05 r2 pay by bank transfer at checkout | r2 built, lean verifier running (r1 fix H1 sweep starvation, L2 to L4) | f992f4a | e8036f8 | 7610-7617 (builder 7570-7577); 20261024210000 | v-TIER-05-r2.txt (b-TIER-05.txt, b-TIER-05-r2.txt, v-TIER-05.txt). Residuals: pending-then-failed stays settled; provider error before payment retries each sweep |
| LEAD-HANDOFF | this folder | | `lead` | | the owner's go to move accounts |
Also waiting: WALLET-16 earnings to wallet (passed; be 315b69b, app 0da32a7) for the owner's count (Q-21); EXPLORE-02 (be 2d0d5d9, app 86bbe0d;
check queued) for the new designs, and its stamp 20261023240000 must be renamed.

## 5. Next by wave (tasks/DESIGN-V2-CUT.md has the full table with orders and "after")
- When DV2-COMP passes, wave 3 opens: VERIFY-01, ME-12, POINTS-05, REF-03, DV2-01, DV2-03, EXPLORE-07, DV2-05 (also INBOX-23, INBOX-14).
  Wave 4: VERIFY-02, VERIFY-04, VERIFY-05, POINTS-06, DV2-02, DV2-04. Wave 5: VERIFY-03, POINTS-07, DV2-COPY, DV2-RM. Wave 6: POINTS-08.
- SHARED-08 (tab bar media tone, 5 post layouts need pictures) and SHARED-09 (unwrap returns data codemod, about 60 callers) are serial
  shared-change passes after DV2-COMP: no screen task touches src/components while one runs.
- Waiting: WALLET-17 and INBOX-22/24 wait for WALLET-16 (the owner's live count, Q-21; INBOX-22 also needs the relock label);
  EVENTS-12 waits for EVENTS-11 (PR #83); VOICE-01 and AITOOLS-01 wait for POINTS-03 and the owner's AI voice key. EVENTS-06 must show
  `event_order_limit` (noted in its task). On the critical path, not in the table: POINTS-02 (212), POINTS-03 (213), WALLET-17 (159).
- Also queued: TIER-04 (add 5 more products), FIX-44 (EVENTS-07 hook window, after batch 6), FIX-46 (test-only flakes:
  publishing-gate.contract.spec.ts 429 on 4 parallel publishes; mobile create.test.tsx:514), FIX-39 (nuvion-documents 500 under load),
  the SWEEP-* tasks for the lows (first in the sweep: KYC-07's BVN/NIN shown in full on Back from A5, a privacy low). Stopped: WALLET-25, WALLET-26.
- Task files on main still say `verifying` for work the board shows as passed: the board and merge-notes are the live state.
- Then Full QA (CHECK-3) and the stores (RELEASE-02). Target: the app (WMT) on 24 Oct; Voices a week or two after.

## 6. Waiting on the owner (the board's wording)
- Approve merges when asked: batch 6 (PR #142) is one tap. Batch 7: one gate line moved (the same approved finding, line 62 to 67); the
  agent was not allowed to re-key it in auto mode, so it needs the owner's OK, then one tap.
- Keys and accounts only the owner can give: Fintava sandbox key, Nuvion sandbox key, Expo token (for the APK), fix GitHub billing (app
  checks), and on the Nuvion server set NUVION_WALLET_BANK_NAME=Nuvion (DV2-06 shows "Banking by <bank name>" and nothing while it is blank).
- For WMT on 24 Oct, Voices a week after: 1 more Max 20x plan (N280k); sign that plan into its own session; AI voice provider key
  (Voice Intro, Studio); one live count: unpaid sales (WALLET-16); Voices: brand pick and section 22 by 24 Oct.
- Open questions (board "Needs you" and Q list):
  - Q-21 Live sales count (WALLET-16).
  - Q-36 BVN step says "Checked with NIBSS": right under Nuvion?
  - Q-37 Social links: our icon set lost LinkedIn's logo. Draw LinkedIn's own logo, or a plain link icon with the word "LinkedIn"? (SHARED-06 drew a plain glyph without the word.)
  - Q-38 Paying by bank transfer at checkout waits 24 hours for the money, then lapses with nothing taken (changeable in admin). Is 24 hours right?
- Cards: WALLET-16 "your live sales count"; WEBPAY-01 "Website wallet, web paused"; EVENTS-11 and OPS-08 "refresh, then your label".
- Held until the owner confirms: the licence and CBN words (R-67); a board for community video and voice composers (G-807);
  whether private rooms keep any host approval. Branch deletion over the proxy is blocked: the owner can enable auto-delete of head branches.
- Mobile CI: GitHub cannot run it (billing), so mobile checks run locally and the lead trusts only the log's EXIT line.

## 7. Lead rulings not yet in DECISIONS.md (it ends at R-69)
Owner answers of 17 Oct 01:11 (round 7): KYC-06 adds ID type and number (A26) and bill type and postal code (A27); a passport asks for
one side; checking screen says "This usually takes a few minutes" and an alert when ready (A28); the daily TGIF notice goes at 07:00
Lagos, changeable in admin, notices older than 30 days are cleared (HOME-17). Confirm the product rulings with the owner at the next docs batch.
Since 17 Oct 01:19 (merge-notes has the detail):
- EVENTS-13: a cap on open paid orders per buyer per event, setting `events.open_orders_per_buyer` default 10 in the TIER-06 registry,
  admin-changeable, refused with 409 `event_order_limit`; lowering it undoes nothing; `ordersLeftToSweep` is left out when 0 (protected
  cancel shape); plus a cancel that answers 201 once, and no valid ticket on a free order for a called-off event.
- HOME-17 scope: TGIF time, NAME_CHECK_PER_HOUR, POPULAR_COMMUNITY_MIN_MEMBERS and retention days move into the registry; only
  `tgif_daily` rows older than 30 days are cleared, other notifications untouched; additive.
- TIER-05: the one-line test edit is approved (plan-purchase.contract.spec.ts:926 now expects 400 for 'card', still unsupported; precedent
  EVENTS-10 changing EVENTS-07 lines). A younger covered order is paid while an older one is short (kept). The 24 h window stays an admin default (Q-38).
- WALLET-40: no Settings switch for the account-ready alert (a one-off service notice); no owner question.
- DV2-COMP: VF7a #2A0C3E becomes its own token (the board wins); ME-12 adds it with the confetti tokens (SHARED-CHANGES DV2-COMP #2).
- WALLET-37: name match is a symmetric subset (the shorter name's words all in the longer, at least 2 words); no BVN name means compare with
  the wallet's provider account name; neither means refuse. ADS-07: schedule and resume refuse an advert with no artwork, no slider cap.
  SETTINGS-06 r9: marker by contentPieceId, one number scrubbed at a time, buyers keep only pieces live at deletion. KYC-06/07: drop
  "voter's card" and the no-BVN link. TIER-06 r2: the cash rate never exceeds the cheapest pack price per point.
- Process: severity decides rounds; one PR at a time, each batch on the previous head; no transaction, connection or lock held across a
  network call; never disable git hooks; no empty commits (a CI re-run is never a reason to push; say so in the hand-back); agents with no named
  ports use 7900-7907 (these are in tools/common-rules.md). The lead never runs a script the classifier refused an agent (permission laundering).
- Earlier: BILLS-04 one record settles one bill, provider checked first. WALLET-09 refusals by kind, signed nameToken valid 15 minutes. FIX-41
  reviews a bank send that later succeeds. WALLET-02 W12 beneficiary switch ON. WALLET-39 notice target is the transaction, 30-day window.
  TIER-06 12-month lots, third referral milestone OFF, 7-day hold. EVENTS-07 an erased host refunds held holds, only for events not started.
  SETTINGS-06 buyers keep access from the delete request, deletion-hidden pieces block only comments and saves. EXPLORE-05 popular searches
  use an allow-list. ADS-01 shows "SPONSORED" alone. ME-04 a never-released late file counts past the limit.

## 8. Port and migration-stamp registry
Backend ports are blocks of 8 (some 10); a verifier reuses its builder's block. Used, 7001 up: MERGE-1 7001; WALLET-04 7011;
WALLET-16 7021; WALLET-10 7031; POINTS-04 7041; FIX-20 7051; WALLET-23 7070; FIX-18 7080; FIX-26 7090; WALLET-35 7100;
SETTINGS-06 7110; WALLET-25 7120; WALLET-26 7130; INBOX-12 7140; FIX-10 7150; FIX-13 7160; INBOX-21 7170; ME-04 7180; FIX-09 7190;
FIX-19 7200; FIX-15 7210; FIX-28 7220; FIX-22 7230; FIX-14 7240; EXPLORE-05 7250; SHARED-05 7260; SHARED-07 7270; ADS-01 7280;
SCHOOLS-10 7290; WALLET-09 7300; BILLS-04 7310; WALLET-02 7320; EXPLORE-02 and EVENTS-11 7330; FIX-34 7340; FIX-35 7350; FIX-36/37 7360
(to 7369); GATES-01 verifier 7370; FIX-41 7380; FIX-40/42 7390; INBOX-16 7400; EVENTS-07 7410; SCHOOLS-07 7420; TIER-06 7430;
WALLET-39 7440; HOME-16 7450; KYC-06 7460; TIER-07 7470; WALLET-37 7480; ADS-07 7490; EXPLORE-06 7500; KYC-07 7510; FIX-45 7520;
REF-02 7530; WALLET-38 7540; EVENTS-10 and EVENTS-13 7560; TIER-05 builder 7570; SHARED-06 7580; HOME-17 7590; WALLET-40 7600 (it once
slipped to 7608-7615); TIER-05 verifier 7610; DV2-COMP 7620; DV2-06 7630; merge preparers 7900-7907 (busy: 7920-7927). Older 4-port blocks
5961 to 6538 are finished. **Next free ports: 7640-7647, then 7650 and so on.** Check `ss -ltn` before giving a range.
Migrations: backend main's last is still 20261024020000_school_enrolments (SCHOOLS-07). On `wmt/MERGE-6`: 20261024010000 EVENTS-07,
060000 TIER-06 plan_settings, 060100 wallet_payment_terms, 070000 WALLET-39, 080000 HOME-16, 090000 TIER-07. On `wmt/MERGE-7`: 110000
ADS-07, 150000 to 180000 SETTINGS-06 (renamed), 190000 REF-02 (renamed), 220000 HOME-17. TIER-05 holds 210000 plan_transfer_orders (not
in a batch yet). Unused: 100000, 120000, 200000, 230000, 20261025000000. EXPLORE-02's 20261023240000 sorts before main's last: rename at merge.
**Next free stamp: 20261025010000.** Next free G- id: after G-826. Next free task order: after 296. wawu-id's last on main:
20261011120000_phone_verified_for.

## 9. Spend and the plan-week
Measure with `LEAD_SCRATCH=<scratch> python3 tools/since.py <UTC time>` (it reads this session's transcripts, API list prices, one line).
From 10 Oct 00:00 it reads $4,882 (lead Opus $703, agents Sonnet $4,179). The 01:30 figure on the first version of this file ($2,895) came
from an earlier count, so compare only since.py's own numbers. Since 17 Oct 01:19: $370 (lead $74, agents $296). Plan-week (Max 20x)
about $2,300 measured; about $650 was used at 01:19, so about $1,020 (44%) now. Capacity guard: stop new builders near 80%.
Budget page (16 Oct): WMT 146 tasks, about 740 runs, about $4,070; total expected about $5,900; two Max 20x plans (N560k); the heavy case
slips WMT about two days instead of buying a third plan.
