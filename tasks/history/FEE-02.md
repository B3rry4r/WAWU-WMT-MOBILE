# FEE-02 · round history

## Builder report (11 Nov 2026)

- Files (dashboard): `src/lib/api/contract/fees.ts` (types, routes, roles), `src/lib/api/admin-fees.ts` (hooks), `src/components/fees/` (`FeesScreen`, `FeeEditor`, `FeePreview`, `FeeHistory`, `VatPanel`, `ProviderRates`, `feeText.ts`), pages `src/app/(app)/finance/fees` and `finance/provider-rates`; edited additively: `contract/index.ts` (route tables), `layout/nav.ts` (two entries, optional `roles`), `layout/Sidebar.tsx` (filters on `roles`), `finance/FinanceNav.tsx` (two tabs, the locked one hidden by role).
- Checks: typecheck 0, lint 0 (one old warning), `npm test` 0, `check:invariants` 0, `check:contrast` 0, `npm run build` 0. `check:contract` NOT RUN to a result (needs the Hub source; fails the same on main).
- Not run: the real FEE-01 Hub; a phone is not involved.
- No `SHARED-CHANGES.md` row, no `BACKEND_GAPS.md` row.
