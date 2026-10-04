---
id: OPS-07
title: List the web features the app doesn't have, for the web team
owner: YOU
area: OPS
order: 183
priority: after-launch
repo: wawu-wmt-mobile
type: ops
status: building
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

The list is `docs/WEB-ONLY-FEATURES.md`.

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
