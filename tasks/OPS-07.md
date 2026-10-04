---
id: OPS-07
title: List the web features the app doesn't have, for the web team
owner: YOU
area: OPS
order: 183
priority: after-launch
repo: wawu-wmt-mobile
type: ops
status: verifying
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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
