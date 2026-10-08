---
id: OPS-07
title: List the web features the app doesn't have, for the web team
owner: YOU
area: OPS
order: 234
priority: after-launch
repo: wawu-wmt-mobile
type: ops
status: done
depends_on: []
decisions: [R-34]
passes: []
artboards: []
---
# OPS-07 · List the web features the app doesn't have, for the web team

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Web features absent from the canvas are not built in the app (DECISIONS.md, Authority: the canvas decides
the app; the web follows after launch; R-34). This list hands the 89 of them to the web team for its own port
after launch. Nothing here is an owner ruling.

## Scope

`docs/analysis/ANALYSIS-EVIDENCE.md`, "On the web today, absent from the canvas". Mark each row "not in the
app" and name the web-port task that carries it. List separately the rows that hold user money or user data
needing migration.

The list is `docs/WEB-ONLY-FEATURES.md`. The web-port task it names is WEB-01 (`tasks/WEB-01.md`).

## Capability checks

- [ ] Each of the 89 rows is marked "not in the app" and assigned to the web-port task.
- [ ] Rows that hold user money or user data needing migration are listed separately for the web team.

## Builder report

- **Files:** new `docs/WEB-ONLY-FEATURES.md`; this task file; `docs/LOG.md`; `tasks/INDEX.md` and `docs/PROGRESS.md` regenerated. No product code, no web or backend change (both repos read only).
- **Row count: 89**, counted by script (bullets under the evidence heading) and equal to the heading. All 89 are in the document with the evidence wording kept, each marked "not in the app".
- **Check 1 (each row assigned to the web-port task): NOT MET, and cannot be.** There is no web-port task. No file in `tasks/` has `type: web-port`; searched `tasks/`, INDEX, WORKFLOW, PLAN, DECISIONS and BACKEND_GAPS. Only the type name, the rule that the web follows after launch, and gap rows G-31, G-60, G-78 mention it. So 0 rows have a task and **89 are "no task yet"**; no id was invented. Section 4 of the document says what is needed (type, passes, slices). Someone has to create the web-port task or tasks.
- **Check 2 (money and data rows listed separately): done.** Section 2 has 19 groups (M1 to M19) covering 39 rows, each with tables, what it holds, and what the web team must migrate or keep. Read from the backend schema on origin/main (38bbe4c), its account data map, the web files, WAWU ID's `WawuUser`, and WALLET-29, WALLET-30, WALLET-17. Money or money plus data: M1 Flutterwave creator wallet and ledger, M2 held paid questions, M3 sales and tips, M4 credits and host earnings, M12 event referral links, M14 health plans, M15 service applications, M17 legal, M19 shop orders. The other 10 groups are data only.
- **"Not in the app" check:** word search of the canvas text, mobile `src/` and every task file per row, hits read. Six rows may already be in the app (13 email step, built in `src/app/email-code.tsx`; 15 Become a creator via P10; 43 paid-message settings I21 to I23; 58 comment likes in HOME-03; 64 notifications M31; 73 rating shown on H10). They stay marked as asked and are listed in section 3 for the verifier. Not run: the app was not opened.
- **Could not classify:** row 70 (dispute an unanswered DM): no route or table found in the backend. Three questions no document answers (in section 2): old Flutterwave ledger history into the new wallet (M1), typed name versus BVN name (M6), a creator already at disabled_30d (M9). None decided here.
- **Gates:** `npm run check` exit 0 before and after: 36 suites, 666 tests, gates 171 files scanned 0 fail 0 warn, 206 tasks. No em-dashes in the new file. No gaps or shared-change requests filed.

## Builder round 2

Fixes the five defects and the unclear item in the verifier report above (merged `origin/main` 7d0e538 first). Round 1's report above stands for what it says, except that check 1 is now met by WEB-01 and the "6 rows" and "39 rows" counts changed.

- **D1 (row 29):** now "Built in the app": `src/features/profile-edit/EditProfileScreen.tsx` (`choose('cover')`, folder `profile/cover`, saves `coverUrl`) and `PictureHeader.tsx`, ME-06 done. M7 no longer says the app has no cover; row 29 left M7.
- **D2 (search redone for all 89 rows):** against the canvas text (every `design/*.sections.json` and `design/*.dc.html`, tags stripped), `src/` and the task files, every hit read. Misses corrected: row 68 (M31 draws "3 credits left", ME-14 plans it), row 41 (E6, EVENTS-03), row 16 (Me menu M7 and Settings Z2), row 42 (M11 and M18 show the identity check state), row 38 (the wallet Statement screen sends PDF or CSV by email). Close-but-different rows now say so in App check: 5 (W17), 6 (I9), 9 (W39), 59 (W27 Report a problem), 66 (I22, I23), 82 (SC8). Not run: the app, and a screen-by-screen read of the canvas (word search plus reading hits).
- **D3 (three states):** section 1 and the new section 3 separate "Built in the app" (2: rows 13, 29), "Drawn on the canvas, not built" (10: rows 15, 16, 38, 41, 42, 43, 58, 64, 68, 73, each with task, status todo, artboard) and "Not in the app" (77). Nothing todo is called "in the app". Row 43's "treat as in the app" is gone.
- **D4:** the account data map sentence now says 42 of the 50 named tables are in it and names the 8 that are not (`EventSpeaker`, `LearnCourse`, `LearnGuide`, `Playbook`, `PartnerService`, `Mentor` are catalogues; `ShopOrderItem`, `LegalChatMessage` are child rows). The EVG quote is credited to `data-export-sections.ts` line 760.
- **D5:** M1 says the account name is resolved from the bank, not typed. M4 says `CreditsState.trialEndsAt` is a legacy column nothing reads or writes.
- **U1 (lead ruling):** new group M20 "Paid verification ticks" (`VerificationPurchase` and the tick dates on `UserProfile`; rows 16 and 48): a paid tick's remaining time must survive the port. Money groups are now M1 to M4, M12, M14, M15, M17, M19 and M20; 40 rows in 20 groups.
- **WEB-01:** created `tasks/WEB-01.md` (title "Port web-only features after launch", owner YOU, area OPS, order 207, after-launch, type web-port, repo wawuafrica, depends on OPS-07, passes V1 V3 V4 V5 V6 V7 V9, decision R-34). Every row's task column and "At a glance" now say WEB-01. The three open questions (M1 Flutterwave history, M6 typed against BVN name, M9 disabled_30d) stay listed as open and undecided in the document and in WEB-01.
- **Gates:** `npm run check` exit 0 (numbers in the LOG line). No em-dashes in the new text.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

Verifier session: independent of the builder; read-only on the web (`wawuafrica`, branch `claude/creator-filtering-id-validation-odqknu`), backend (`origin/main` 38bbe4c) and mobile `src/` and `tasks/` on origin/main 7d0e538 (only a `web.pid` removal after the branch base `dd1c885`). Docs only: no V5 to V9 pass applies to this task.

| Check | Result | Evidence |
|---|---|---|
| 1 Completeness: every evidence row present, wording kept, none dropped or merged; count | passed | Parsed the 89 bullets under "On the web today, absent from the canvas by name (89)" (ANALYSIS-EVIDENCE.md line 974; next heading is "Agent summaries") and the 89 table rows of section 1: numbered 1 to 89, in order, text identical for 89 of 89 (two rows differ only by the `\|` table escape in rows 13 and 88). Count 89 is right; each says "Not in the app". Section 4 area counts (10, 13, 21, 14, 12, 11, 8) add to 89. |
| 2a Money and data groups: tables exist and hold what is said | passed with 3 minor defects | All 19 groups (M1 to M19, 39 rows, row sets disjoint and equal to the "39") checked, including M1 to M4, M12, M14, M15, M17, M19. About 50 named models read in `prisma/schema.prisma` on origin/main (106 models): every one exists with the named fields (for example `DirectMessage` refund fields, `Purchase.commissionRate`, `CreditSpendEarning.hostShareKobo`, `HealthSubscription.dateOfBirth/policyNumber`, `LegalRequest` contract fields, `ShopOrder.fulfilment/trackingNote`, `EventReferral.code`, `PenaltyState` values). Defects D4 and D5 below. |
| 2b Advice consistent with DECISIONS and tasks | passed | M1 matches WALLET-29 ("pay out or move each Flutterwave balance", "matching ledger entry") and WALLET-30 ("two weeks" of zero calls, one path at a time). M4 matches WALLET-17 (host share computed, not paid; credits a count, R-5; backend now uses 17/20 = 85%). M5 matches R-6 and R-36, M9 matches R-13 and INBOX-09 (only `disabled_7d` is produced, `paid-dm-pause.service.ts:332`), M17 matches R-14, M19 matches R-2 and OPS-08. The three open questions (M1, M6, M9) are recorded as open, not decided. |
| 2c Sample of the 50 "checked, nothing to migrate" rows | passed for 13, 1 wrong | Verified true: 8 and 24 (nothing writes `EvgScore`; only `prisma/seed.ts` does), 18, 45, 47, 51 (`localStorage` in `lib/sound.ts`, `lib/tgif-preference.ts`), 21 (web posts no `acceptedTerms`: `lib/api/auth.ts` signUp body has none), 23 (WAWU ID), 40 (`SavedItem` is content, which the app reads), 60, 61, 62 (existing `Community` tables), 70 (only in web `docs/01_SPEC.md` line 63; no backend route or table). Row 68 holds nothing, but it is drawn on the canvas: D2. Row count 50 and the 50 plus 39 cover all 89 with no overlap (script). |
| 3 Section 3 "rows the app may already have", against mobile origin/main code and task status | failed | D1, D2, D3 below. Row 13 is correct (`src/app/email-code.tsx` exists; AUTH-04 done). |
| 4 No invented task ids; every cited id exists | passed | 54 distinct ids cited in the new document and this file, scripted: 0 missing from `tasks/`. G-31, G-60, G-78 exist in BACKEND_GAPS.md and name the web port. No `type: web-port` in `tasks/` except the template line in TEMPLATE.md. |
| 5 Plain English, no em-dashes; `npm run check` exit 0 | passed | 0 em-dashes in `docs/WEB-ONLY-FEATURES.md`, `tasks/OPS-07.md`, and the added lines of LOG, PROGRESS, INDEX. `npm run check` exit 0 on 298e24c: 36 suites, 666 tests, gates 171 files scanned 0 fail 0 warn, 206 tasks. |
| 6 Note for the lead: capability check 1 cannot be met | noted, not a defect | No web-port task exists in `tasks/` (searched; the builder says the same). The lead creates one at merge; then the "no task yet" column and the "At a glance" table need the id. |

### Findings

- **D1 defect (row 29 is in the app, and M7 says it is not).** Row 29 "Cover image upload on profile and edit" is marked "Not in the app", with an empty App check and no place in section 3. The app has it: `src/features/profile-edit/EditProfileScreen.tsx` (`choose('cover')`, folder `profile/cover`, `coverUrl` saved), `PictureHeader.tsx` (110 high cover, "design/_gen/me.js line 36 (M8)"), `form.ts` (`coverUrl`); ME-06 is done and its report lists the cover. M7 in section 2 says the app "has no cover, WhatsApp or website field": the cover part is false (WhatsApp and website are right). Row 29 should go in section 3 as built, and M7 corrected.
- **D2 defect (row 68 is drawn on the canvas).** Row 68 "credits_low warning notification" has an empty App check and is not in section 3. The canvas M31 draws "3 credits left, Top up to keep posting in communities" (`design/Me Flow.sections.json`), and ME-14 plans it ("M31: credits shown as a count ('3 credits left')", line 77). It belongs in section 3, so the count of 6 is 8 at least (with row 29). Row 41 is also close (tickets E6, EVENTS-03) and has an App check, but is not counted in section 3 either.
- **D3 defect (section 3 does not say built or only planned).** Only row 13 is built. The rest rest on tasks that are `todo` on origin/main and have no code in `src/`: row 15 "Partly in the app: the creator-needed screen (P10) has a 'Become a creator' button" (PROS-03 todo, AUTH-06 todo; no P10 screen); row 43 "In the app: I21 to I23 ... Treat as in the app" (INBOX-12 todo; no paid-message settings screen), which is the clearest overstatement; row 58 "Probably in the app" (HOME-03 todo); row 64 "Partly in the app: Notifications is screen M31" (ME-14 todo; no notifications screen); row 73 "Partly in the app: the professional card (H10)" (HOME-07 is the card's screen task; HOME-05 is backend only; `src/` has no feed). `src/app` has only auth, tabs placeholders, open-wallet, edit-profile, payout-account. Each of these rows should say "drawn on the canvas, task X, status todo, not built" in place of "in the app".
- **D4 defect, minor (false sentence).** Section 2 intro: "Every table named is also in the backend's own account data map (`src/account-purge/account-data-map.ts`)". Eight named models are not in it: `EventSpeaker`, `LearnCourse`, `LearnGuide`, `Playbook`, `PartnerService`, `Mentor` (catalogues) and `ShopOrderItem`, `LegalChatMessage` (children of owned rows, so they go with the parent, but not listed). Also "Nothing writes `EvgScore`; the backend's data map calls it 'derived score, not data the person gave'" quotes `data-export-sections.ts:760` (the data export), not the account data map.
- **D5 defect, minor (wrong field detail).** M1 says `WalletWithdrawal` holds "the bank code, account number and account name typed for each withdrawal". The schema comment says the account name is "Resolved from the bank before sending, never typed by the creator". Also M4 lists `CreditsState.trialEndsAt` as held data without saying it is a legacy column that nothing writes or reads (schema comment).
- **U1 unclear (possible omission in section 2).** `VerificationPurchase` (paid ticks through Flutterwave: `flutterwaveTxRef`, `status`, `grantedUntil`; in the account data map as OWNED) is money the web holds, and row 16 (Settings row "Verification ticks (/profile/verification)") and row 48 (verification prompt) are filed as "none". They are only an entry row and a banner, so it may be right; the web team should still see this table next to WALLET-30. Builder or lead to decide.

Not run: nothing in the task's own checks was skipped. Not done on purpose: the app was not opened (docs only), the builder's "not in the app" word search was not repeated for all 83 other rows; rows were sampled (13, 15, 16, 29, 40, 41, 43, 58, 64, 68, 73 against canvas text, src and tasks).

Verdict: not ready. Five defects (D1 to D3 change what the web team is told; D4 and D5 are small), one unclear (U1). Back to building.

## Verifier report, round 2

Fresh detached worktree at e9dfc82 (origin/main 7d0e538 merged; `src/` and task status read on origin/main). Docs only, so no V5 to V9.

| Check | Result | Evidence |
|---|---|---|
| 1 D1 to D5 and U1 closed as defined in round 1 | passed (two small leftovers, D6 and D7 below) | D1: row 29 is "Built in the app", with `EditProfileScreen.tsx` (`choose('cover')`, `profile/cover`) and `PictureHeader.tsx` named, both present on origin/main; M7 no longer says the app has no cover. D2: rows 68, 41, 16, 42, 38 now carry an App check; row 68 is drawn (M31 "3 credits left", ME-14). D3: three states in sections 1 and 3, nothing todo called "in the app", row 43's "treat as in the app" gone. D4: the 8 tables not in the account data map are named exactly (verified: `EventSpeaker`, `LearnCourse`, `LearnGuide`, `Playbook`, `PartnerService`, `Mentor`, `ShopOrderItem`, `LegalChatMessage`) and the EVG quote is credited to `data-export-sections.ts`; the "42 of 50" total is not exactly reproducible by my own count (39 of 47 by a stricter match) but the 8 names are right and only the total depends on the counting rule. D5: M1 says the account name is resolved from the bank; M4 says `trialEndsAt` is legacy. U1: M20 added. |
| 2a The three states, all 12 non-"not in the app" rows | passed | Built (2): row 13, `src/app/email-code.tsx`, `signupFlow.ts`, AUTH-04 and AUTH-05 done; row 29, as above, ME-06 done. Drawn, not built (10): rows 15, 16, 38, 41, 42, 43, 58, 64, 68, 73. Every cited task is `todo` on origin/main (PROS-03, AUTH-06, ME-03, SETTINGS-01, WALLET-35, EVENTS-03, ME-12, ME-07, INBOX-12, HOME-03, ME-14, HOME-07) and `src/` has no P10, I21 to I23, M31, E6 or H10 screen (`src/app` holds only auth, tab placeholders, open-wallet, edit-profile, payout-account). Backend notes check out: WALLET-27 done, INBOX-09 done, HOME-05 done and backend only. Counts 2 + 10 + 77 = 89; table column matches (script). |
| 2b Re-search sample: 64 of the 77 "not in the app" rows against the canvas text | passed with 2 notes | Searched all 29 `*.sections.json` and `*.dc.html` files (tags stripped) for distinctive words of rows 1, 2, 3, 4, 7, 8, 10, 11, 12, 17, 18, 20, 21, 22, 24, 25, 26, 27, 28, 31, 32, 33, 35, 36, 37, 39, 44, 45, 46, 49, 50, 51, 52, 53, 54, 55, 56, 57, 59, 60, 61, 62, 63, 65, 66, 67, 69, 70, 71, 72, 74, 75, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 88, 89 and read every hit. No row was found to be drawn that the document calls absent. Two rows have a close drawing with no "close, not the same" note, unlike rows 5, 6, 9, 59, 66 and 82: row 10 (Wallet board shows a failed transfer "Reversed to your wallet", a different thing from the web's ledger label) and row 11 (A5 "Confirm your details" draws name, gender, state and occupation from the BVN, and `ConfirmDetailsScreen.tsx` is in `src/`, KYC-03 done; the web's by-hand typing and country picker are still absent). Both stay correctly "not in the app"; the note is missing (see N1). |
| 2c Wording for the partial matches (rows 16, 38, 42, 64, 73) | passed, with D6 for row 58 | The state column says "Drawn on the canvas, not built" for all of them, but each App check starts "Partly drawn" and says what is missing (mark-all-read, writing a review, the wallet not the dashboard), and the At a glance table says "at least in part". That is clear enough for a reader who reads the App check; a reader who scans only the state column or the count of 10 would think five rows are drawn in full. Suggest "Partly drawn" in the state column. Row 58 is the odd one: its own text says the canvas does not draw a like control, so it does not meet section 3's own definition of "drawn". |
| 3 M20 against the schema | passed with D7 | `VerificationPurchase` exists with `kind` (creator or professional), `priceNgn`, `flutterwaveTxRef`, `flutterwaveTxId`, `status`, `grantedUntil`, `settledAt`; `UserProfile` has `creatorVerifiedAt`, `creatorVerifiedUntil`, `professionalVerifiedAt`, `professionalVerifiedUntil`; the account data map lists `VerificationPurchase` as OWNED. Advice (keep `grantedUntil`, keep the purchase row, keep Flutterwave references) is consistent with WALLET-30 and with ME-12 and ME-18 existing. Rows 16 and 48 added to M20 (the groups now cover 40 distinct rows with the 49 "nothing to migrate" rows: 40 + 49 = 89, no overlap, none missing). |
| 4 WEB-01 | passed | `tasks/WEB-01.md`: owner YOU, area OPS, order 207, priority after-launch, repo wawuafrica, type web-port, depends_on [OPS-07], decisions [R-34], passes V1 V3 V4 V5 V6 V7 V9, status todo. All 89 rows have "WEB-01" in the task column (script). Section 4 and "At a glance" say WEB-01. `check_tasks.py`: 207 tasks, 279 artboards. 63 distinct task ids in the document, OPS-07 and WEB-01, none missing from `tasks/`. |
| 5 Open questions and row 70 | passed | M1, M6 and M9 are listed as open and undecided in section 2, in section 4 and in WEB-01, with no answer given. Row 70 stays unclassified and the document says why (no backend route or table; only the web spec line, `docs/01_SPEC.md` line 63). |
| 6 Style and gates | passed | 0 em-dashes in `docs/WEB-ONLY-FEATURES.md`, `tasks/OPS-07.md`, `tasks/WEB-01.md` and the added lines of LOG, PROGRESS and INDEX. `npm run check` exit 0 on e9dfc82: 36 suites, 666 tests, gates 171 files scanned 0 fail 0 warn, 207 tasks. |

### Findings

- **D6 defect, minor.** Row 58 (comment like) is in "Drawn on the canvas, not built", but its App check says "Planned, not drawn as a control ... The canvas draws comment counts only". Section 3 defines "drawn" as "the artboard draws it". Either move row 58 to "Not in the app" with the HOME-03 note, as rows 5, 6, 9, 59, 66 and 82 are handled, or change the definition. This also changes the counts (9 drawn, 78 not in the app).
- **D7 defect, minor.** M20 says "The app sells ticks from the wallet (ME-12, ME-18)". Both tasks are `todo` (ME-12 is the screen, ME-18 the backend), so nothing is sold yet. Say "will sell (ME-12 and ME-18, todo)".
- **N1 note, not a defect.** Rows 10 and 11 would read better with a "close, not the same" App check (see 2b). Also, for rows 16, 38, 42, 64 and 73, putting "Partly drawn" in the state column would remove the only way the count of 10 can mislead.

Not run: the app was not opened; the canvas text was word-searched (64 rows sampled by me, every hit read), not walked screen by screen; the other 13 "not in the app" rows were not re-searched by me.

Verdict: not ready only for D6 and D7, both one-line fixes. D1 to D5 and U1 are closed, WEB-01 and M20 are right, and the 12 states are correct.

## Lead merge note (4 Oct 2026)

Merged to main by the lead. The round 2 verifier's two minor defects were
fixed by the lead at merge, in `docs/WEB-ONLY-FEATURES.md`: D6, row 58 (comment
like) moved to "Not in the app" (planned in HOME-03, not drawn), so the counts
are 2 built, 9 drawn and not built, 78 not in the app; D7, M20 now says the
app "will sell" ticks (ME-12 and ME-18, todo). Also from the verifier's notes:
the five partial rows (16, 38, 42, 64, 73) read "Partly drawn on the canvas,
not built" in the state column, and rows 10 and 11 carry a "close, not the
same" note. WEB-01 (`tasks/WEB-01.md`) carries all 89 rows. The three open
owner questions (M1 Flutterwave history, M6 typed vs BVN name, M9
`disabled_30d`) are on the owner's list on the progress page.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
