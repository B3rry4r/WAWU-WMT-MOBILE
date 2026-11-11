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

## Verifier report, round 1 (11 Nov 2026)

Verdict: MERGE (nothing medium or worse; lows below). Dashboard `wmt/FEE-02` at 8e5fcf8 against Hub `origin/wmt/FEE-01` at e5474cbe (read with `git show`, nothing installed or run). Verified in a worktree with a stand-in Hub I wrote (roles and validation copied from the controller, DTOs and services), real Chromium at 1440x900, production build with the stand-in's address baked in.

| Pass | Result | Evidence |
|------|--------|----------|
| 1 Calls match the Hub | pass | Paths, methods, bodies, 201s, roles read off `admin-fees.controller.ts` and `fee-engine.dto.ts` at e5474cbe; the 1cff9623..e5474cbe diff touches no admin fee route or DTO. Wire log: `POST admin/money/fees` sends `{kind,currency,startsAt,percent,minMinor,maxMinor[,note]}`; add money sends `{kind,currency,startsAt,passThrough:true}`; provider rate sends `maxMinor:null` and `fixedMinor` (the DTO needs both); VAT sends `PATCH admin/plan-settings {settings:{"tax.vat_percent":"7.55"}}` as text. Hub sentences shown: "startsAt cannot be in the past.", provider name regex message. |
| 2 Roles in the browser | pass | support: 0 Change buttons, note shown, VAT percentage disabled, no Turn on/off, no Provider rates in sidebar or tabs; typed `/finance/provider-rates` shows the refusal and the Hub log holds only `auth/me` (no provider-rates request); the stand-in's secret note never in the DOM. superadmin and finance: 7 Change buttons, both links, add a rate works. No refusal flash for finance on a hard load of the locked page (sampled 4 s). |
| 3 Nuvion's rates outside the locked area | pass | Rates arrive only from `GET admin/money/provider-rates`, called only by `ProviderRates.tsx`; `NAV` is read only by the sidebar; no static figure in `.next` (the word "nuvion" appears in older pages and as the editor's default provider text, no numbers); Fees page makes no provider-rates request for any role. |
| 4 Preview and editor | pass | Outgoing: "NGN 100,000 sent: fee NGN 500 (plus NGN 37.50 VAT), total NGN 100,537.50, they receive NGN 100,000." Incoming (wire in, add money): "received: fee ..., they receive ...". `INCOMING_KINDS` equals the Hub's `TAKEN_OFF_KINDS`. All numbers from the Hub. `passThrough:true` sent only for `ngn_add_money` (no percent fields); swap, wallet and withdrawal send none. Start defaults to now (Lagos: 20:26 local sent as 19:26Z). A 2020 start is refused by the Hub and its sentence shows. A new row appears in history and as "In force". |
| 5 Generator | pass | `git diff` of the script is one added line (the controller path). `check:money-contract` 0 with `HUB_API_PATH=/home/user/WAWU-Backend HUB_API_REF=origin/wmt/FEE-01`; store and reports contracts 0 too. `check:contract`, `check:ops-contract`, `check:oversight-contract` exit 1 on the branch and exit 1 on a fresh `origin/main` worktree, with the same messages (no web checkout found; stale ops types; stale oversight types). Not caused by this task. |
| 6 Pictures | pass | All 20 opened. They show what the report says: list (finance), list read-only (support, note, VAT disabled, no Change), editor with the refused past start, outgoing preview with VAT on, add money editor, incoming preview, history with In force mark, VAT on, locked area with confidential banner, support refusal. Light and dark both fine, no clipping. Off marks on swap and local dollar receiving. |
| 7 Gates | pass | typecheck 0, eslint 0 (1 old warning), `npm test` 0 (35 pass), `npm run build` 0, `check:invariants` 0, `check:contrast` 0. No em-dash or `style={{}}` added. |

Findings (all low, to the area sweep):
1. LOW, merge order. `check:money-contract` fails against Hub `origin/main` (`src/money/fees/engine/admin-fees.controller.ts` does not exist there), and it is part of `npm run check`. Merge this branch only after FEE-01 is on the Hub's main. Test that kills it: the same check against Hub main after FEE-01 merges.
2. LOW, `FeeEditor.tsx:22` (`useState(nowLocal())`). The default start is the time the dialog opened; a form left open over five minutes is refused with "startsAt cannot be in the past." (the Hub's own words, field name included). Probe: open, wait 6 minutes, save. Test: refresh the default at submit when the field is untouched.
3. LOW, `feeText.ts` `previewSentence`. Swap reads "received" and the try-an-amount default is 100000 whole units, so a dollar preview reads "USD 100,000". Wording only. Test: a swap preview asserts the sentence.
4. LOW, `ProviderRates.tsx:36-37` and `FinanceNav.tsx`. The refusal page for a role without access still carries the Provider rates header sentence ("What the wallet provider charges WAWU ... superadmin and finance only"); no figure, no request. Also a reviewer sees the Fees tab and then a refusal. Test: a role matrix spec on `routeAllowsRole`.
5. LOW, tests. No automated test covers the new screens or `previewSentence`/`toMinor`/`validPercent`; all checking here was by hand in a browser. Test: a node test on `feeText.ts` (incoming vs outgoing sentence, `toMinor("1,000.50")`, `validPercent("100.0001")`).

Exit codes: typecheck 0, lint 0, test 0, build 0, check:invariants 0, check:contrast 0, check:money-contract 0 (with ref), check:store-contract 0, check:reports-contract 0; check:contract 1, check:ops-contract 1, check:oversight-contract 1 (all three also 1 on main).

NOT RUN: the real Hub (and so a real sign-in and real save), a phone, a real superadmin/finance/support account, token refresh mid-session, `check:contract` to a result (needs the web checkout).
