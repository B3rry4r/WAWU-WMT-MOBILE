# SWEEP-APP · round history

Moved out of [tasks/SWEEP-APP.md](../SWEEP-APP.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Builder report, part 1 (SWEEP-APP-1, 17 Oct 2026)

Branches: mobile `wmt/SWEEP-APP-1`, backend `wmt/SWEEP-APP-1`; heads are in the push line of the hand-back. Rows are handled in table order; each Outcome cell names its commit or its reason.

- **Mobile fixes (with a test that fails before):** row 2 PointsFigure count never cut (overflow visible, preview cases `hug-8-100`, `hug-11-100`); row 3 advert tap reported for the pressed slide (`tapOf`); row 8 fees under a naira are prices (mutant `kobo < 100` now killed by two tests); row 10 `+not-found` and no site map; row 48 theme read given up on after 3 s; row 54 `aria-hidden` on five decorative tiles; row 55 gate tests wired into `npm run gates`. Row 4 and 6 are test hardening; 9, 14, 25, 36, 50 and 56 are wording.
- **Backend fixes:** row 15 timeout floor (shared change `SWEEP-APP-1 #1`); row 17 a data migration for stored refund notices (tried on a test database: rewritten, other dashes left, second run changes nothing); row 21 `settleUpload` answers confirmed when the sweep got there first (new contract case fails with the fix taken out); rows 43 and 44 school link keeps the query as written and refuses credentials; rows 20, 31, 32, 37 are test files.
- **Ruled no (32):** moot or fixed elsewhere (1, 11, 12, 30), a protected route or a design call (13, 16, 22, 23, 24), report wording (5, 7, 29), not code or needs a key (19, 26), Fintava (39, 40), a gate or baseline is not a sweep's to edit (41, 53), owner's or lead's call (42, 46, 47, 51), and the rest with the reason in the cell.
- **Not done:** no web export, so no pictures at 390 px light and dark for rows 2, 10 and 54 (jest proves the props and styles only). Rows 4, 5 and 7 could not be reproduced with a rebuilt delay harness (its mapping is not the verifier's), so row 4 is hardening, not a measured before and after. The `live-hardening` and `nuvion-opening` specs (rows 31 and 37) were typechecked and linted but not run: they open their own ports and are large.
- **Checks:** see the hand-back for the EXIT lines.

