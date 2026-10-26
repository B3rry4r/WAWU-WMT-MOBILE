---
id: LEGAL-DOCS
title: The owner's nine legal documents: one box at sign-up, a Legal list, one reader
owner: YOU
area: LEGAL
order: -142
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-67, R-37, R-47, R-6]
passes: [V1, V2, V3, V4, V5, V6, V9]
artboards: []
---
# LEGAL-DOCS · The owner's nine legal documents

## Current state

As of 26 Oct 2026.
- **Status:** review. Builder part A done: backend `wmt/LEGAL-DOCS` and mobile `wmt/LEGAL-DOCS`, both from their `origin/main`; no verifier yet.
- **Next:** a fresh verifier (never the builder) runs the passes. Part B (the dashboard's publishing screen for the other seven documents) is not part of this task.
- **History:** reports go to tasks/history/LEGAL-DOCS.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-67 (A3's line), R-37 (no brand name on A3), R-47 (draw only what is built), R-6
- This task changes `wawu-backend` too. Start the session with that repo and `wawu-wmt-mobile` both attached.

## Goal

Owner, 26 Oct 2026: "users signing up agree to all these in one button, in simple language; when they click to read, they see and can read
them all individually." The text is the owner's, nine documents (Privacy Policy, Terms of Service, Cookie Policy, Creator Monetization
Agreement, Verification and Refund Policy, Acceptable Use Policy, Data Processing Agreement for Partners, Community Guidelines,
Disclaimer), received 26 Oct 2026. Nothing in the app or the Hub invents wording.

## Scope

- Backend: the slug list grows from `terms`/`privacy` to the nine; `GET /policies/:slug` keeps its exact shape; new public `GET /policies`
  (published documents in the owner's order: slug, title, effectiveDate); data migration `20261203090100_legal_documents_nine` writes the nine
  documents word for word (the owner's only allowed fixes: sections numbered 1, 2, 3, the Privacy Policy title without the em-dash,
  "#1000" as "₦1,000"), upsert, rollback refuses once any of the nine has been saved since; new table `LegalAcceptance` (migration
  `20261203090000_legal_acceptance`) and `POST /policies/accept`, which the app calls once after sign-up; owned in the purge map, part of the
  data export.
- App: A3 draws one tick box, "I agree to the Terms of Service, Privacy Policy and our other policies." with "Read them" opening the Legal list
  (`/legal-documents`, public); each row opens the existing policy reader by slug (`/legal-documents/<slug>`); Settings gets a Legal row
  (Terms and Privacy policy rows stay); after sign-up the app records the acceptance (mark, send, retry on the next start).

## Capability checks

- [ ] A person on A3 ticks one box, taps "Read them", sees all nine documents by title, opens any one and reads it before they have an account.
- [ ] Continue stays refused until the box is ticked; ticking it sends nothing to WAWU ID.
- [ ] After sign-up the Hub holds, for that person, each published document's slug and effective date with the time; a retry adds nothing; a republished document adds one row.
- [ ] Settings has a Legal row opening the same list, and the Privacy policy row still opens the Privacy Policy.
- [ ] The nine documents the Hub serves match the owner's text, line for line, with only the three allowed changes.
- [ ] `GET /policies/terms` and `/privacy` answer the shape the web has always had; the protected route suite is unchanged.
- [ ] The migration replaces a Terms or Privacy row the owner already saved, a second run changes nothing, and the rollback refuses once any of the nine has been saved since.

## Builder report

Filled in by the builder at hand-back (heads, checks with EXIT lines, pictures under audits/LEGAL-DOCS/).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Left for the owner._
