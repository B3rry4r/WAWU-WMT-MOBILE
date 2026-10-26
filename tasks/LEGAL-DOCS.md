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
- **Status:** review. Parts A and B built (backend, mobile, web, dashboard on `wmt/LEGAL-DOCS`); verified 26 Oct 2026, verdict PASS with lows only (see Verifier report).
- **Next:** the lead adds the ruling for the one-box line (finding 1), then merges backend, mobile, web and dashboard; the migrations need a database backup first (finding 5).
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

Part A, 26 Oct 2026 (Sonnet builder, T2). Backend `wmt/LEGAL-DOCS` `07c6f55` on `origin/main` `c8eba66`; mobile `wmt/LEGAL-DOCS` on `origin/main` `904da284`.
- Backend checks (each with its EXIT line in the builder's logs): `tsc --noEmit` EXIT 0; eslint on the changed source files EXIT 0; the changed specs on a test database, 75 passed
  (about folder with the three new specs, the account purge map, the data export map, the rollback stop line) EXIT 0; `contract:build` EXIT 0 (committed); gates 0 fail EXIT 0;
  `check_baseline.py` EXIT 0; protected route suite 236 of 244 on the branch and the same 8 failures on `origin/main` (verification and professionals routes, environment).
- App checks: `tsc --noEmit` EXIT 0; eslint on the changed files EXIT 0; jest (auth-signup, auth, about, settings, route-guard, route-graph, open-wallet consent, movies, `--maxWorkers=2`) 20 suites, 704 tests, EXIT 0;
  gates 0 fail EXIT 0; `check_baseline.py` EXIT 0; `check_tasks.py` EXIT 0; Android fingerprint `17ffb13d520882bf144982b61d03f3994c6e40e4` (unchanged).
- Pictures at 390 px, light and dark: `audits/LEGAL-DOCS/` (A3's line, the Legal list, one document), from a web export against a local Hub on the Nuvion stand-in and the mock WAWU ID.
- Existing assertions changed, and why: backend `about.contract.spec.ts` used `cookies` as an unknown slug (it is one of the nine now), so it uses `imprint`; mobile `auth-signup.test.tsx` DV2-05 pinned the old two-word line (the label, and the two words opening Terms and Privacy policy), replaced for the owner's one-box line.
- Left for the owner or the lead: the Terms (section 5) say the verification fee is ₦2,000 a year and the Verification and Refund Policy says the minimum is ₦2,999; the documents mention biometric liveness checks; the dashboard's publishing screen is part B.

## Verifier report

26 Oct 2026, Sonnet verifier (T2 lean check, parts A and B together; built none of it). Backend `07c6f55` on `origin/main` `c8eba66`; mobile `f948825e` on `904da284`; web `520f6e7` on `e55daaa`; dashboard `1c87916` on `0ba6d64`. One local stack on the Nuvion stand-in and the mock WAWU ID (ports 9790 to 9799), every migration applied, the app as a web export at 390 px, the web as a production build in join-only mode, the dashboard in dev mode; all against that one Hub. Never a live host, never Fintava. Logs and scripts: the lead's scratchpad `vlgd/`. **Verdict: PASS** (no blocker, high or medium; four lows and three owner flags below).

| Pass | Result | Evidence |
|---|---|---|
| V1 gates | passed | app gates 0 fail, 18 warn, 1437 files, EXIT 0; check_baseline EXIT 0; check_tasks EXIT 0; fingerprint 17ffb13d520882bf144982b61d03f3994c6e40e4 (unchanged); backend gates 0 fail, 139 warn, 88 accepted, 2006 files, EXIT 0; backend check_baseline EXIT 0 |
| tests | passed | backend tsc EXIT 0; the three new specs, `about.contract.spec.ts`, `account-data-map.spec.ts` and `data-export-map.spec.ts` on a separate test database: 6 suites, 72 passed, EXIT 0; `contract:build` EXIT 0 and byte-identical to the committed `contract/openapi.json`; app tsc EXIT 0; jest (auth, route-guard, about, settings, features/auth, `--maxWorkers=2`) 17 suites, 692 passed, EXIT 0; web typecheck EXIT 0, `check:copy` clean EXIT 0, `check:site-mode` 211 passed EXIT 0, `next build` EXIT 0 (`/legal` and `/legal/[slug]` dynamic); dashboard tsc EXIT 0, `npm test` 15 passed EXIT 0, eslint on the changed files EXIT 0 |
| text fidelity | passed | all nine documents served by the Hub (read through the API and the database) equal the owner's text word for word after the three allowed fixes (numbering 1, 2, 3 in order; the Privacy title without the em-dash, now "PRIVACY POLICY: WHO MADE THIS? (WMT)"; "#1000" as "₦1,000"): 0 words changed, dropped or added; the only line-level difference in five documents is the title line, which sits in the `title` field instead of a first section. Effective date 2026-10-26 on all nine; numbering runs 1 to N in order in every document; no em-dash or en-dash anywhere (`vlgd/fidelity.py`, `fidelity.out`) |
| V2 Hub | passed | 62 checks (`api_test.out`): `GET /policies` public, owner order, keys slug, title, effectiveDate; `GET /policies/:slug` keeps `slug, available, title, effectiveDate, sections` for all nine, unknown slug and `accept` are refused; `PUT /admin/policies/:slug` is 401 with no token, 401 with a user token, 403 for a reviewer, 200 for a superadmin on all nine, bad bodies 400, a refused write changes nothing; `POST /policies/accept` is 401 signed out and with an admin token, 400 for a bad body or an extra field (no slug or person can be named), 200 with nine rows for the signed-in person, six parallel repeats keep the first `acceptedAt` and add nothing, a second person gets their own rows, republishing `terms` with a new date adds one row and keeps the old; purge map (OWNED) and export section covered by the map specs and the new spec. Rollbacks on a copy database: the nine-documents rollback refuses and changes nothing once one row has been saved since, removes the seven new rows when none has; the acceptance rollback refuses while any record exists and drops the table when empty. Migration stamps `20261203090000` and `20261203090100` are newer than the newest on every one of the 333 origin refs (`20261202090000`) |
| V3 protected | not run here | `GET /policies/:slug` is not in `.pipeline/protected-registry.json`; its shape is unchanged (only the `slug` enum widens, in the contract). The builder's 236 of 244 (same 8 as main) was not re-run |
| V5 picture | not needed | nothing differs from the claim, so no pictures taken; the builder's are under `audits/LEGAL-DOCS/` |
| V6 states | passed | A3 at 390 px signed out: one checkbox, the line "I agree to the Terms of Service, Privacy Policy and our other policies.", "Read them" opens the Legal list, the old separate "terms" and "privacy policy" words are gone, Continue unticked says "Tick the box to agree before you continue."; the list shows the nine titles in the owner's order with "Updated 26 October 2026" and is readable signed out; each of the nine opens in the reader with every section (21, 18, 6, 11, 6, 4, 7, 4, 4); an unknown slug goes back to the list; Back returns to the list; Settings has a Legal row (opens the same list) and keeps Terms and Privacy policy, which opens the Privacy Policy text (`app_e2e.out`, `app_e2e2.out`) |
| V9 live seam | passed with one gap | a pending agreement was marked for a signed-in mock user, the Hub call blocked at the network: the app stayed signed in and usable, the mark stayed `pending` across three starts, then sent on the next start once the call could pass and settled to `done`. NOT RUN end to end: the sign-up that marks and sends in one go (the mock WAWU ID has no `/auth/signup`); the three jest cases in `auth-signup.test.tsx` cover it |
| web | passed | against this Hub, signed out, join-only: `/legal` lists all nine from the `{items}` list; `/legal/<slug>` returns 200 with the full text in the server-rendered HTML for all nine (every heading, the start and the end of every section, the date, no em-dash); `/legal/nonsense` 404; `/legal/Privacy` and `/sign-in` still go to `/join`; `/terms` works and links to `/legal`; `/privacy/policy` still goes to `/terms#privacy-and-data-protection`; one document emptied on the Hub reads "Not published yet. Check back soon." and the index lists the other eight; no sideways scroll at 390 or 1440 px, light and dark |
| dashboard | passed | the picker offers the nine with their published dates; `verification-refund`, `terms` and `partner-dpa` each edited, dated and published through the confirm dialog: the Hub served the edit and the new date, the other sections untouched (all three restored afterwards) |
| merges | passed | each branch into its `origin/main` in a scratch worktree: clean, fast-forward, nothing pushed |

### Findings, ranked
1. low, unclear: `DECISIONS.md` R-67 still says A3 shows "I agree to the terms and privacy policy", and `docs/designer/BRIEF.md` A3 is not updated. The builder changed the DV2-05 assertions on the owner's 26 Oct words (right), but no ruling records it. The lead adds one (R-xx, owner, 26 Oct 2026: one box for all nine, "Read them" opens the Legal list) and points R-67 at it.
2. low, defect (design): `POST /policies/accept` writes the documents and dates published at the moment of the call, not at the moment the box was ticked. A retry made days later, after the owner republished, records the newer version. The record is still true for what was current when written; say so in the README or accept it.
3. low, test gap: `how: "signup"` is the only value and any signed-in person can write it for themselves, so a row proves a call was made after sign-in, not that the box was shown. Fine for the stores; note it if lawyers read this table.
4. low, pre-existing: the dashboard's `check:contract` is stale (`generated.ts` against the backend) on `origin/main` and on this branch with the same output; the policies live in a hand-kept file the generator does not cover.
5. owner flag, not a defect: the migration REPLACES any Terms or Privacy text the owner saved before (owner ruling 26 Oct); the old text is not kept, so take a database backup before this deploys.
6. owner flag, in the owner's text: Terms section 5 says the verification fee is ₦2,000 a year, the Verification and Refund Policy says the minimum is ₦2,999; the Privacy Policy and Terms speak of biometric liveness checks and the product has none (web CLAUDE.md: no liveness). Wording is the owner's and was not touched.
7. owner flag: the Privacy title had to lose its em-dash; the colon stands in its place.

## Owner sign-off

_Left for the owner._
