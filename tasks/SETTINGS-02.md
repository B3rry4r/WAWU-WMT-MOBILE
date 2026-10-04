---
id: SETTINGS-02
title: About, terms and privacy policy
owner: DEV
area: SETTINGS
order: 93
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [SHELL-01, UI-02]
decisions: [R-1, R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [Z9, Z10, Z11]
---
# SETTINGS-02 · About, terms and privacy policy

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py Z9 Z10 Z11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for Z9, Z10 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The bank name and licence line come from config, filled in by the owner (R-1). Terms and Privacy text are the owner's legal text, served by the backend with their date; the canvas text is layout only (owner input).

## Artboards

- **Z9 · About**: About WAWU: Version 2.4.0; description '...get paid for what they know, with a real bank account built in.'; 'Banking by' and the bank name, then the licence line, both from config filled in by the owner (R-1, BRIEF Z9); Contact support support@wawuafrica.com; Rate the app.
- **Z10 · Terms**: Terms, Updated 1 September 2026: Using WAWU (18 or over, true details, one account per person); Money (payments move through your WAWU wallet, held at the bank named by config (Loma Bank, BRIEF Z10); fees shown before you pay); What you sell (you own your work; WAWU may show it to buyers).
- **Z11 · Privacy policy**: Privacy policy, Updated 1 September 2026: What we collect (details, BVN check result, in-app activity); What we never do (sell data, show BVN/NIN/balance); Your choices (download or delete from Privacy).

## Brief changes (build these, not the canvas)

- **Z9**: "Banking by" + the bank name slot (sample "Loma Bank"), and the licence line as a slot filled from config by the owner (rule 7). (Why: R-1.)
- **Z10**: "held at Loma Bank" (bank name slot). The terms text itself is the owner's legal text and will be replaced; keep the layout. (Why: R-1.)

## Capability checks

- [ ] **Z9**: a user can contact support; rate the app; open Terms (-> Z10).
- [ ] **Z10**: a user can read; go to Privacy policy.
- [ ] **Z11**: a user can read.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **Z9**: n/a.
- **Z10**: served. Missing: Content itself is a legal matter; the board text is a placeholder summary.
- **Z11**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z9: 'Version 2.4.0'
- Z9: 'Banking by Fintava MFB'
- Z9: 'Licensed by the CBN'
- Z9: 'a real bank account built in'
- Z9: support@wawuafrica.com (bundle rule says emails stay @wawu.africa)
- Z10: 'Updated 1 September 2026'
- Z10: 'You need to be 18 or over'
- Z10: 'One account per person'
- Z10: 'held at Fintava MFB'
- Z10: 'Fees are shown before you pay'
- Z11: 'Updated 1 September 2026'
- Z11: 'your BVN check result' is collected
- Z11: never show 'your BVN, NIN or balance'

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Files.** Mobile: `src/features/about/` (`api.ts`, `AboutFrame.tsx`, `AboutScreen.tsx`, `PolicyScreen.tsx`, `format.ts`, `links.ts`, tests), routes `src/app/about.tsx`, `terms.tsx`, `privacy-policy.tsx`, regenerated contract and types, `BACKEND_GAPS.md` G-140 to G-143, `SHARED-CHANGES.md` (SETTINGS-02 #1 to #3, R1), `docs/LOG.md`. Backend, branch `wmt/SETTINGS-02` (worktree `/home/user/lanes/s02/wawu-backend`, uncommitted): `LegalDocument` table and migration, `src/about/` (public `GET /about`, `GET /policies/:slug`), `src/admin/legal-documents/` (superadmin `PUT /admin/policies/:slug`), `app.module.ts` (two imports), `.env.example`, `contract/openapi.json`.

**Capability checks.** Z9 contact support, rate, open Terms and Privacy policy; Z10 read and go to Privacy policy; Z11 read: jest `src/features/about/__tests__` (22 tests, real fetch seam, mail and store links through a stubbed `openLink`), plus a web build against a local Hub (own DB `s02_dev`, Hub :3802, mock WAWU ID :4802, web :8802) with screenshots light and dark beside `render_design.py Z9 Z10 Z11` in `build/s02_compare/`. Values on screen: version from `expo-constants`, bank, licence line, support address and legal text from the Hub; nothing typed in a screen. States captured in `build/s02_shots/state-*`: loading, not available yet, offline, server error, long text scrolled, no licence line, no support address, long licence line wrapping whole. Backend: `src/about/tests/about.contract.spec.ts` (7 tests: nothing served until filled in, 404 on an unknown slug, superadmin only, validation, round trip with date, config read).

**Counts.** Mobile `npm run check` after: exit 0, tsc 0, lint 0 errors, 38 suites / 688 tests, gates 9 / 182 files / 0 fail, task check 206 tasks. Backend after: tsc 0; contract 7/7 new; protected and route-shadowing 312/313 (the one failure, `POST /payments/hosted-link`, is identical on a clean main worktree); gates 16 fail / 24 warn / 76 accepted, identical on main (none in my files); baseline check passes. Before-counts for mobile were not recorded before editing (NOT RUN).

**Defaults (agent), owner may override.**
1. Description reads "Who Made This helps African creators and professionals get paid for what they know." The canvas's "with a real bank account built in" is a claim about the system and is listed as not-a-fact, so it is left out.
2. Z9 and Z10 draw no way to Terms and Privacy policy, but the checks need them: Z9 has a second card (Terms, Privacy policy) and Z10 a "Read the privacy policy" button. Settings (SETTINGS-01) still adds its own rows as Z2 draws them. Both extras are the only differences from the render besides R-37 (mark, title), the version value and the Hub's values.
3. The Banking row is read-only (no chevron: it opens nothing); the licence line wraps whole; local `BankRow` until SHARED-CHANGES #2.
4. Support address has no default and no invented one: the row says "Not available yet" and opens nothing until `SUPPORT_EMAIL` is set. Rate the app: Play URL from the Android package; no row on iPhone (G-142).
5. Bank name reuses the existing wallet config (`WALLET_BANK_NAME`, default "Loma Bank", already PROVISIONAL); the owner writes the bank into the Terms text, so there is no bank placeholder inside legal text.
6. Terms, Privacy and About are public routes, so a person can read the Terms before sign-up; `available: false` is a 200, not an error.
7. Local screenshots used the canvas's wording as fixtures in the local `s02_dev` database only; nothing from the canvas is in the repo or seeded.

**Owner inputs (NOT RUN until given; rule 9).** Terms and Privacy text with dates (G-140); support address (G-141); Play listing live and App Store id (G-142); licence wording and confirmation of the bank name (G-143). Each is a one-time config or one `PUT`.

**NOT RUN.** V10 on a device (mail app, Play page, font scaling and safe areas on a phone); the web has no Rate row (no Android package on web); iPhone behaviour; the Settings rows that open these screens (SETTINGS-01, not built); `npm run api` against merged backend main (SHARED-CHANGES #3); the live deploy (V9 against the droplet).


## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
