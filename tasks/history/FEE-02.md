# FEE-02 · round history

## Builder report (11 Nov 2026)

- Files (dashboard): `src/lib/api/contract/fees.ts` (types, routes, roles), `src/lib/api/admin-fees.ts` (hooks), `src/components/fees/` (`FeesScreen`, `FeeEditor`, `FeePreview`, `FeeHistory`, `VatPanel`, `ProviderRates`, `feeText.ts`), pages `src/app/(app)/finance/fees` and `finance/provider-rates`; edited additively: `contract/index.ts` (route tables), `layout/nav.ts` (two entries, optional `roles`), `layout/Sidebar.tsx` (filters on `roles`), `finance/FinanceNav.tsx` (two tabs, the locked one hidden by role).
- Checks: typecheck 0, lint 0 (one old warning), `npm test` 0, `check:invariants` 0, `check:contrast` 0, `npm run build` 0. `check:contract` NOT RUN to a result (needs the Hub source; fails the same on main).
- Not run: the real FEE-01 Hub; a phone is not involved.
- No `SHARED-CHANGES.md` row, no `BACKEND_GAPS.md` row.

## Builder report, round 1 (11 Nov 2026)

Lined up with the real Hub routes on `wmt/FEE-01` (head 1cff9623), read with `git show`, nothing installed or run. Dashboard head `8e5fcf8`.

**Types.** The hand-copied `contract/fees.ts` is no longer a source of shapes. The repo's own money generator (`scripts/generate-money-contract.mjs`) takes a ref (`HUB_API_REF=origin/wmt/FEE-01`, `HUB_API_PATH`), so `src/money/fees/engine/admin-fees.controller.ts` was added to its controller list (one line) and `money.generated.ts` now carries the five routes, their roles (read off each `@AdminRoles`), the response types and the two request bodies, from the controller and DTO source. `fees.ts` is a thin file of aliases plus the closed lists the Hub documents but types as text (the seven fee kinds, three card kinds). The generator reads source, not `contract/openapi.json`; I compared the generated types to that file's schemas by eye and they match. `check:money-contract` exits 0 against the branch ref. Until FEE-01 merges, the default ref will not carry the fee controller, so run it with `HUB_API_REF` set.

**Differences from round 0, each fixed.**
1. Roles: fees list and preview are superadmin, finance and support; fees write and provider rates are superadmin and finance. Support sees the fees read-only (no Change button, a note, the VAT percentage disabled); the Fees sidebar entry is drawn for all three roles, Provider rates for two.
2. Both POSTs answer 201; the client treats any 2xx as success, so nothing beyond the new types was needed.
3. `changedBy` is the email; shown as is.
4. `startsAt` defaults to now; a start over five minutes back is not blocked in the screen, the Hub's sentence ("startsAt cannot be in the past.") shows in the editor.
5. `on` false for swap and local dollar receiving shows "Off" (picture-checked).
6. Preview sentence from the Hub's numbers only. Outgoing: "NGN 100,000 sent: fee NGN 400 (plus NGN 30 VAT), total NGN 100,430, they receive NGN 100,000." Incoming: "USD 1,000 received: fee USD 30, they receive USD 970." The one thing the screen decides is the word (sent or received), from the Hub's list of incoming kinds (wire in, local dollars in, add money, swap).
7. Pass through: `ngn_add_money` must send `passThrough: true` with no percent or minimum; every other kind must not. The editor has no percentage fields for add money and never offers a pass through elsewhere.

**Found while reading, also fixed.** The currency is fixed per kind by the Hub ("currency must be NGN for ..."), so the editor has no currency picker; it states the currency. `tax.vat_percent` is TEXT on the Hub ("7.5"); the round 0 VAT panel read a number and would have sent one (refused); it reads and sends text now. Provider rates take three more kinds (card issuing, upkeep, decline); the editor lists them.

**Pictures** (`audits/FEE-02/`, 20 files, 1440x900, light and dark, replacing round 0; against a stand-in Hub shaped by the contract, role by token, in scratch): 1 fees list (finance), 2 fees list read-only (support), 3 editor with a refused past start, 4 preview outgoing with VAT on, 4b add money editor (pass through), 5 preview incoming, 6 history, 7 VAT on, 8 provider rates (finance), 9 provider rates refused (support). Each kind looked at in at least one theme.

**Checks (dashboard).** typecheck 0; lint 0 (one old warning, `SHOP_DTO`); `npm test` 0 (35 pass); `npm run build` 0; `check:invariants` 0; `check:contrast` 0; `check:money-contract`, `check:store-contract`, `check:reports-contract` 0 with the branch ref. NOT RUN to a pass: `check:contract` (the generator crashes), `check:ops-contract` and `check:oversight-contract` (stale against that ref; files not touched here). Not run: the real Hub, a real sign-in, a real save.
