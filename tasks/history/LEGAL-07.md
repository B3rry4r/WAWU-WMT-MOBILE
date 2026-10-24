# LEGAL-07 · round history

Moved out of [tasks/LEGAL-07.md](../LEGAL-07.md) word for word, oldest first. The current state is in that file.

## Builder report

Built by a Sonnet builder, bundle B13, 24 Oct 2026. Dashboard `wmt/ADS-02` `0d16895`; mobile `wmt/ADS-02` (this file, `BACKEND_GAPS.md` G-1725, `SHARED-CHANGES.md` B13 #1, `docs/LOG.md`). **No backend change.**
- **Files (dashboard):** new `src/app/(app)/legal/prices/page.tsx`, `src/components/legal/LegalPriceModals.tsx`, `src/lib/api/legal-prices.ts` (and its barrel exports); `src/components/layout/nav.ts` ("Legal prices"); `src/app/(app)/legal/page.tsx` and `src/components/legal/LegalRequestDetail.tsx` (the code-constant fees removed); `scripts/generate-contract-types.mjs` (the prices controller, views, DTOs, `MIN_CONSULTATION_MINUTES`, `MAX_CONSULTATION_MINUTES`, `DEFAULT_MERCHANT_MAX_PER_TXN_KOBO`) and `scripts/generate-ops-contract.mjs`. No response shape is written by hand.
- **Behaviour:** a price is typed in whole naira and sent as kobo (the only factor of 100 is `nairaToKobo`); the bounds are the server's (₦1 up to the per-transaction ceiling, 5 to 480 minutes); an empty price or length is sent as null, which leaves a call not offered, and the screen says so before saving; Save is held when nothing changed; Clear price sends null so the service is quoted. Roles are `ROUTE_ROLES`: superadmin and finance edit; support reads with no controls; reviewer sees "Not your screen".
- **Defaults (agent), owner may override:** the price screen is its own page and not a tab on the legal queue; an in-person kind may be saved with no price and no length ("On request"), as the server allows; the labels are the app's (Video call, Phone call, In person, Chat).
- **Dashboard checks:** `npm run check` exit 0 (contract and ops contract at `8fca5dd`, `tsc` 0, eslint 0 errors and the one existing `SHOP_DTO` warning, invariants clean, contrast 58 pairs); `npm run build` exit 0 (adds `/legal/prices`, `/schools`, `/schools/new`, `/schools/[id]`); `python3 scripts/gates/run.py` 1 fail, 0 warn, 6 accepted, the same `finance/payouts/page.tsx:39` deferral as before this bundle. The contract check needs `HUB_API_PATH=/home/user/wawu-backend HUB_API_REF=8fca5dd WAWU_WEB_PATH=/home/user/wawuafrica`.
- **Not done:** the per-route tests (the dashboard has no test runner for components; the behaviour above was driven in the browser and over HTTP). Role pages for support and finance on the price screen were checked over HTTP and in code, not pictured.

## Verifier report

Verifier (Sonnet, T1, bundle B13, 24 Oct 2026): **PASS (merge).** dashboard `0d16895` (wmt/ADS-02) against dashboard main `c1dfca6`; backend main `b69aa7f` for the stack (the contract is pinned to `8fca5dd`); mobile `7b0b1590`. I built none of it.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` EXIT 0 pinned (EXIT 1 only on the pin header, N1), build EXIT 0, test 6 of 6, gates 1 fail identical to main |
| V6 | partly run | empty, not offered, role views pictured; Hub-down and server-error states NOT RUN (step budget) |
| V7 | passed | superadmin, finance, support, reviewer each signed in at /login and opened /legal/prices: `legal-8-*` |
| V9 | passed | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13-v/legal-1` to `legal-8`, `matrix.txt` |

Capability checks, each driven in the browser and read back over HTTP on the stack:
- Set price and length: Video call set to ₦50,000 and 45 minutes in the modal; a user token's `GET /legal/consultation/options` went from `zoom 3000000 / 40` to `zoom 5000000 / 45` (the next quote). Phone with a price only: still not offered (the modal says "After saving, the app does not offer it"); with a length of 30: offered at `2000000 / 30`. CAC registration set to ₦35,000 in the modal: the web catalogue returned `priceNaira 35000`; Clear price returned it to quoted (null).
- User token refused: `GET legal/ops/prices` and every `PUT` return 401 for no token and for a user token. Roles over HTTP: GET reviewer 403, support 200, finance 200, superadmin 200; PUT consultation reviewer 403, support 403, finance 200, superadmin 200. The UI agrees: support sees the tables and no controls, finance and superadmin see Edit, reviewer sees "Not your screen" (`matrix.txt`).
- Pictures at 1440 px light and dark (`legal-1-list-light`, `-dark`, `legal-2-modal`, `legal-3-after-save`, `legal-4-phone-price-only`, `legal-5-service-modal`, `legal-6-after-service-save`, `legal-7-queue`, `legal-8-support`, `-finance`, `-reviewer`). Compared with the builder's `legal-1` to `legal-6`: the same layout, columns, copy and toast; only the data differs.

Findings:
- **F1 (low, defect):** `src/app/(app)/legal/prices/page.tsx:102` heads a column "In the app" and line 139 shows Chat as "Offered", but the app never offers chat: `GET /legal/consultation/options` lists only video, phone and in person (backend `src/legal/legal-consultation.service.ts:22`, `APP_MEDIA`). Chat's price feeds the web's `GET /legal/catalogue` (it returned chat 60 minutes, ₦25,000 beside video). Repro: superadmin opens /legal/prices (Chat "Offered") then a user token calls the options route (no chat). Fix: name where each kind is offered, or do not claim "in the app" for Chat. Goes to the sweep list.
- **N1 (note, not a defect):** the generated contract is pinned to `8fca5dd`, so `npm run check` against a newer backend main exits 1 on the header line alone; re-pin with `npm run gen:contract` and `npm run gen:ops-contract` at the merge ref. The content already equals `b69aa7f`.
- NOT RUN: Hub stopped and 5xx states of this screen; the 400 on a price above the ceiling was not driven (the field says the ceiling).

Checks I ran (dashboard worktree on `0d16895`, `npm ci` first; logs in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13-v/`):
- `npm run check` with `HUB_API_REF=b69aa7f` (backend main): EXIT 1, "contract types are STALE", for both generators. I regenerated in a scratch copy at `b69aa7f`: the only difference in `generated.ts` and `ops.generated.ts` is the header line "Source of truth ... @ 8fca5dd", so the content equals backend main (see finding N1). With `HUB_API_REF=8fca5dd`: EXIT 0 (contract 71 files, ops contract 14 files, tsc 0, eslint 0 errors and 1 warning, invariants clean on 155 files, contrast 58 pairs).
- `npm run build`: EXIT 0 (routes `/ads`, `/ads/new`, `/ads/[id]`, `/legal/prices`, `/schools`, `/schools/new`, `/schools/[id]`).
- `npm test`: EXIT 0, 6 of 6.
- `python3 scripts/gates/run.py`: EXIT 1, 1 fail, 0 warn, 6 accepted, 155 files. On dashboard main `c1dfca6` the same command: EXIT 1, 1 fail, 0 warn, 6 accepted, 128 files, and the FAIL block is identical: `src/app/(app)/finance/payouts/page.tsx:39` "known dead code left as prose". That file is not in the branch diff, so the failure is inherited, not new.
- `CONSULTATION_FEES` and `CONSULTATION_FEE_OPTIONS`: no match anywhere on the branch, in backend main, the web or mobile; the generator's `extractConsultationFees` and its output block are gone and nothing imports `ConsultationFeeOption`. The legal queue footer reads "Consultation and service prices are set on the Legal prices screen." (no 25,000 or 45,000).
- Diff against the report: `git diff --stat c1dfca6 0d16895` is 42 files, each in a builder list; nothing extra or missing. No stand-in copies of main's components found.
Stack: the brief's ports 8280-8287 were blocked (8284 held by another session's next-server), so the stack ran on 7920-7927 (name `v13dash`, own database, Hub on the Nuvion stand-in, mock WAWU ID). The stack's Hub allows only its own origin, so I restarted my Hub once with `CORS_ORIGIN` adding the dashboard's origin (my process only). The dashboard was the production build on :7921. The four admin roles were signed in through `/login` in the browser; reviewer, support and finance rows were inserted by SQL with the superadmin's password hash. A user token came from the mock WAWU ID.

