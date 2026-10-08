---
id: FIX-24
title: A delivered legal document can only be the client's own file or one the legal team uploaded
owner: YOU
area: FIX
order: 232
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [LEGAL-03]
decisions: [R-14]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-24 · A delivered legal document can only be the client's own file or one the legal team uploaded

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/LEGAL-03.md`, "Verifier report, independent round 4 (lead)" (defect N2 and its reproduction, `h/n1.mjs` last block) and the N1 ruling it builds on
- wawu-backend: the LEGAL-03 delivery code (the key rule `deliverable-key`), `POST /legal/ops/requests/:id/deliverables`, the older protected `POST /legal/ops/requests/:id/deliver`, the deliverables list that signs links, and `StorageObject` (one row per uploaded key, with the uploader's `wawuUserId`)

## Goal

LEGAL-03 (merged, live) accepts any key under `legal/document/` on our bucket. That folder also holds what clients attach to their own legal matters, and support sees those keys in `GET /legal/ops/requests`. So support can deliver client B's own document to client A, and A's list hands A a fresh link to B's file (reproduced live: 132 of 132 bytes). The older `/deliver` route is a second way in, because the new list re-signs whatever it stored. A key nobody uploaded is also accepted and signed.

## Scope

- **Lead ruling (8 Oct 2026).** A delivered key is accepted only when all hold:
  - it passes LEGAL-03's N1 rule;
  - a `StorageObject` row exists for that exact key, so a key nobody uploaded is refused;
  - that row's uploader (`wawuUserId`) is the request's owner (a client's own file given back) or one of the legal team's accounts in a new setting, `LEGAL_DELIVERY_UPLOADER_IDS`.
- **The setting.** `LEGAL_DELIVERY_UPLOADER_IDS` is a comma-separated list of WAWU ids. Boot refuses a malformed value, naming the setting. It is empty by default and marked `PROVISIONAL`; the owner supplies the legal team's account ids. Until then, only a client's own files can be delivered back to them.
- **Refusals.** Anything else answers 400 naming `files.N.url` with a plain message (no em-dashes) saying the file must be one the legal team uploaded, and nothing is stored.
- **Both write routes.** Apply this to the new deliverables route and the older `/deliver`. `/deliver` is protected: if the lock captures a request this changes, stop and say so (it needs the owner's relock label).
- **Reads.** Signing applies the same rule. A stored key that fails it, a legacy `deliverableUrl` included, is shown without a link and logged once at warn level. It is never signed.
- **Stored rows.** Change no stored row without a lead ruling. Count stored deliveries whose key fails the rule and put the count in the report.
- **When LEGAL-07 lands.** Its admin upload route gives ops its own folder; the rule then also accepts that folder for that request. Leave a note in SHARED-CHANGES LEGAL-03 #2.

## Capability checks

- [ ] The verifier's N2 reproduction is refused on both write routes (400 `files.N.url`, nothing stored, no link anywhere), and A's list never returns a link to B's file, even for a row written by hand.
- [ ] A key with no `StorageObject` row is refused.
- [ ] A client's own file can be delivered back to them, and a file uploaded by a listed legal-team account is delivered and downloads with identical bytes (V9, real WAWU ID sign-in).
- [ ] Protected routes 253/253 with the lock unchanged; every protected `/legal` answer for clean input is byte-identical to main.

## Builder report

Backend `wmt/FIX-24`: cc6bcff (the fix) and a1beb10 (contract regenerated), on backend main 657a152 (main has not moved). No migration, no new model, no schema change. Mobile `wmt/FIX-24`: this report, SHARED-CHANGES, the contract copy. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bf24/` (scripts in `h/`, mutants in `mut/`).

**Built, as ruled.** `LegalDeliveryRule` (`src/legal/legal-delivery-rule.ts`): a delivered key is accepted only when it passes LEGAL-03's N1 rule (`deliverableKeyFrom`), a `StorageObject` row exists for exactly that key (one query for all keys), and that row's `wawuUserId` is the request's owner or an account in `LEGAL_DELIVERY_UPLOADER_IDS` (ids compared without case). `POST /legal/ops/requests/:id/deliverables` refuses anything else with 400 `files.N.url must be a document the legal team uploaded to WAWU storage, or one the client uploaded themselves.` (the first bad file in order; one message for every reason, so it never says whose file a key is) before anything is written. `GET /legal/requests/:id/deliverables` (and the operator's own answer) run every stored value through the same rule, rows and the legacy `deliverableUrl` alike: a value that fails is listed by name with `url: null`, never signed, and logged once per file at warn level (`LegalDeliveryRule`, naming the request, the file id and the reason, never the stored value, which can be a signed link). Setting: `src/legal/legal-delivery-settings.ts`, read once at boot like NUV-07's limits (an injectable reading `ConfigService`, provided in `LegalModule`); comma-separated WAWU ids, empty by default, `PROVISIONAL(LEGAL-DELIVERY-UPLOADERS, owner=YOU, why=...)`; a malformed value stops the server naming the setting (live: exit 1, `LegalDeliveryConfigError: LEGAL_DELIVERY_UPLOADER_IDS must be WAWU ids separated by commas. "nope" is not a WAWU id.`). `.env.example` has it empty with a comment. Files: `src/legal/legal-delivery-rule.ts`, `src/legal/legal-delivery-settings.ts` (new), `src/legal/legal-deliverables.service.ts`, `src/legal/legal.service.ts` (`deliver`), `src/legal/legal.module.ts`, `src/legal/dto/legal-consultation.dto.ts` (doc of `url` only), `src/storage/storage.service.ts` (`linkNamesStorage`, new pure function), `.env.example`, `contract/openapi.json` (one description).

**The protected `/deliver`: a real stop for part of the rule, recorded here.** The lock's probe for `POST /legal/ops/requests/:id/deliver` delivers `https://cdn.wawu.test/deliverable.pdf` (a link on another host) and locks 200. The full rule refuses any link that is not on our bucket, so it changes that locked answer: applied in full (experiment, working tree, then `git restore`) the protected suite is 252 of 253, 243 of 244 required, the failure being exactly `POST /legal/ops/requests/:id/deliver ... locked status 200, now ... 400` (`protected-fullrule.txt`). Changing that needs the owner's relock label, so it is not done. Built instead: `/deliver` applies the whole rule to every link that names our storage (the bucket's host, the storage endpoint's host, or a host under either, after URL normalisation: case, trailing dot, IP forms, userinfo), with 400 `deliverableUrl must be a document ...` and nothing stored; a link on any other host is taken exactly as before (it cannot read one of our objects, and the app's list never signs it). This closes N2 on `/deliver` (B's presigned link, B's unsigned link, a ghost key on our bucket, all 400) with the lock unchanged. **Owner item:** to refuse foreign links on `/deliver` too, relock that probe (unblocked by the owner's relock label on the PR; the change is to drop the `namesOurStorage` condition in `LegalRequestsService.deliver`).

| Capability check | Result | How it was proved |
|---|---|---|
| N2 refused on both write routes (400 naming the field, nothing stored, no link anywhere); A's list never links B's file, even for a row written by hand | passed | Spec `legal-delivery-uploaders.contract.spec.ts` (16 tests): B presigns through the real `POST /uploads/presign` and files a matter with it (support's queue shows the key); on A's paid request B's file as presigned link, bare key and unsigned link on our bucket is 400 `files.0.url`, no deliverable, chat, audit row, status or `deliverableUrl` change, no key or `X-Amz` in the answer; a good file then B's is 400 `files.1.url` and neither is delivered; `/deliver` for superadmin and support 400 `deliverableUrl`; rows written by hand (B's key bare, as its link, unsigned, a ghost) and a legacy `deliverableUrl` holding B's link are listed with `url: null` and `signedReadUrl` is never called. Live (`h/walk.mjs`, real HTTP, real WAWU ID, S3 stand-in): **main 657a152 reproduces N2** (11 of 11: new route presigned and bare, ghost, `/deliver` plus web read, hand rows: A downloads 132 of 132 bytes of B's file); **branch cc6bcff 13 of 13**: every one of those is 400 or `url: null`, nothing stored, each withheld file logged exactly once over two reads (`walk-main.txt`, `walk-branch.txt`). The branch build reading the rows main wrote (`h/cross.mjs`): 10 requests, 11 items withheld, 3 signed (only A's own and C's files), equal to the SQL count below. |
| A key with no `StorageObject` row is refused | passed | Spec: a ghost key bare and as a link on our bucket, new route 400 `files.0.url`, `/deliver` 400 `deliverableUrl`; a ghost row written by hand is never signed. Live on the branch: 400 on both routes. |
| A client's own file is delivered back; a listed legal-team file is delivered and downloads identical bytes (V9, real WAWU ID) | passed | Live, WAWU ID built from wawu-id `origin/main` fb8717e (own database, RS256 keys, `POST /auth/login` for A, B, C), real `POST /admin/auth/login`: A's own upload delivered back, A downloads 78 of 78 bytes; C (listed) presigns two PDFs, support delivers one through `/deliver` and one through the new route, A lists both with 900 s links and downloads 330 and 140 bytes, identical; B gets 404. With the setting empty (live, `empty.txt`): C's file 400 on both routes, A's own 200. Spec: the same, plus an unlisted rule instance refusing C's file and ids compared without case. |
| Protected routes 253/253, lock unchanged; protected `/legal` answers for clean input byte-identical to main | passed | `run.sh --fresh HEAD` in a private network namespace: before (657a152) 253 of 253, 244 of 244 required; after (cc6bcff, lock origin/main 657a152) 253 of 253, 244 of 244 required. Byte compare (`h/v3.mjs`, the LEGAL-03 verifier's 61 requests over the 22 registry `/legal` routes, main and branch builds on fresh copies of one seeded database): **61 of 61 identical** in status and text, 0 differ in key order or type; raw bytes identical for `GET /legal/catalogue` (5,385), `/legal/availability` (7,414), `/legal/intake/matters` (748). |

**Checks.** `npx tsc --noEmit` 0. eslint (no `--fix`): the 7 changed non-test files 0 problems; the 3 new spec files 0 errors, 1 warning (`app.getHttpServer()` as `any`, the class every legal spec has); the 4 edited specs 0 problems on added lines. Specs of every module touched (`src/legal`, `src/storage`, `src/legal-intake`, `src/payment-webhook`), one jest run in a private network namespace with its own mock WAWU ID on its own :4001, on a copy of a migrated and seeded template: **22 suites, 595 passed, 3 skipped, 0 failed**. Gates: main 974 files 16 fail, 66 warn, 76 accepted; branch 979 files 16 fail, 67 warn, 76 accepted; the fail sets are identical, the one new warn is the deliberate `PROVISIONAL(LEGAL-DELIVERY-UPLOADERS)` with `owner=` and `why=`; `check_baseline.py` clean (108). Tripwire on added lines: 0. `npm run contract:build`: one description changes (`DeliveredFileDto.url`), a second build leaves the file unchanged; mobile `npm run api -- --backend /home/user/wt/b-FIX-24` (main's contract) changed nothing, then the branch head's contract was copied (`SOURCE_COMMIT` `wmt/FIX-24@a1beb10`) and `sync_contract.py` regenerated one comment in `schema.generated.ts`. Secret scan of both diffs (long hex or base64 runs, `sk_`, `FLWSECK`, bearer tokens, private-key headers): none. Mobile `npm run check` exit 0 as one command (typecheck and lint 0, 76 suites, 1,377 of 1,377 tests, gates 9 run, 346 files, 0 findings, 260 tasks); again after merging mobile main d85492b into the branch: exit 0, 76 suites, 1,377 tests, 0 gate findings, 261 tasks.

**Mutants** (`h/mutate.py`, one edit at a time in the worktree, the three FIX-24 spec files, 62 tests, fresh database each, `git restore` after each and the tree checked clean): **10 applied, 10 killed.** M1 a missing upload row accepted (2 fail); M2 any uploader accepted (11); M3 the legal team ignored (2); M4 the owner not recognised (3); M5 reads signed by folder only, as before FIX-24 (3); M6 `/deliver` skips the rule (4); M7 only the exact host counts as ours (5); M8 a withheld file logged on every read (1); M9 a malformed setting accepted (14); M10 ids compared with case (1). `mut/run.log`, `mut/results.json`.

**Existing specs (fixtures only, no assertion changed).** `legal-consultations`, `-round2`, `-round3`, `-round5` deliver keys nobody uploaded, which the ruling now refuses. Each now lists `LEGAL_DELIVERY_UPLOADER_IDS` and records the keys it delivers as uploaded by that account (upsert in `beforeAll`, deleted in `afterAll`). Without it some tests would still pass for the wrong reason (round 2's "audit row in the same step" expects any 400, and would stop at the new rule before reaching the transaction), so the fixtures keep each test reaching the branch it was written for.

**Stored rows.** No row is changed. On my seeded database (fresh `migrate deploy` and `db:seed`) there are **0** stored deliveries, so 0 fail. On the database where main's build ran the N2 walk: 11 fail (rows: 5 uploaded by someone else in 3 requests, 2 with no upload record; legacy `deliverableUrl`: 3 uploaded by someone else, 1 not a legal document on our storage), 3 pass, the same 11 and 3 the branch build withholds and signs there. In production the owner (or the lead) counts them with this read-only query, setting `base` to what every link the Hub signs starts with (`https://<bucket>.<storage host>/` for a virtual-hosted bucket, `https://<storage host>/<bucket>/` path style) and `team` to `LEGAL_DELIVERY_UPLOADER_IDS` as an array (`'{}'` while it is empty, which today makes every operator-uploaded delivery count as failing):

```sql
-- psql -v base='https://<bucket>.<storage host>/' -v team='{}' -f count-failing.sql   (SELECT only)
-- FIX-24: stored legal deliveries whose key fails the delivery rule. READ-ONLY (SELECT only).
-- psql -v base='<bucket origin and path prefix>' -v team='{<legal team ids>}' -f count-failing.sql
--   base: what every link the Hub signs starts with, e.g. 'https://<bucket>.<storage host>/' (virtual-hosted)
--         or 'https://<storage host>/<bucket>/' (path style): STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_FORCE_PATH_STYLE.
--   team: LEGAL_DELIVERY_UPLOADER_IDS as a Postgres array, '{}' while it is empty.
-- One line per kind (a LegalDeliverable row, or a request's legacy deliverableUrl the list shows) and refusal.
WITH stored AS (
  SELECT 'row' AS kind, d.id::text AS id, d."legalRequestId" AS request_id, r."wawuUserId" AS owner, d.url AS value
  FROM "LegalDeliverable" d JOIN "LegalRequest" r ON r.id = d."legalRequestId"
  UNION ALL
  SELECT 'legacy deliverableUrl', r.id, r.id, r."wawuUserId", r."deliverableUrl"
  FROM "LegalRequest" r
  WHERE r."deliverableUrl" IS NOT NULL AND r."deliverableUrl" <> ''
),
keyed AS (
  SELECT s.*,
    CASE
      WHEN length(s.value) > 2048 OR s.value !~ '^[!-~]+$' OR position(E'\\' IN s.value) > 0 THEN NULL
      WHEN s.value ~* '^[a-z][a-z0-9+.-]*:' OR s.value LIKE '//%' THEN
        CASE WHEN left(s.value, length(:'base')) = :'base'
             THEN split_part(split_part(substr(s.value, length(:'base') + 1), '?', 1), '#', 1)
        END
      ELSE s.value
    END AS key
  FROM stored s
),
judged AS (
  SELECT k.kind, k.request_id,
    CASE
      WHEN k.key IS NULL
        OR k.key !~ '^legal/document/[A-Za-z0-9._~-]+/[A-Za-z0-9._~-]+$'
        OR k.key ~ '/\.+(/|$)' THEN 'not_a_legal_document'
      WHEN o.key IS NULL THEN 'no_upload_record'
      WHEN lower(o."wawuUserId") <> lower(k.owner)
        AND lower(o."wawuUserId") <> ALL (SELECT lower(x) FROM unnest(:'team'::text[]) x)
        THEN 'uploaded_by_someone_else'
    END AS refusal
  FROM keyed k
  LEFT JOIN "StorageObject" o ON o.key = k.key
  -- The list shows a legacy deliverableUrl only when no row carries the same file.
  WHERE NOT (k.kind = 'legacy deliverableUrl' AND EXISTS (
    SELECT 1 FROM keyed k2
    WHERE k2.kind = 'row' AND k2.request_id = k.request_id
      AND coalesce(k2.key, k2.value) = coalesce(k.key, k.value)))
)
SELECT kind, coalesce(refusal, 'passes') AS outcome, count(*) AS n, count(DISTINCT request_id) AS requests
FROM judged GROUP BY 1, 2 ORDER BY 1, 2;
```

**Decisions** (each "Default (agent), owner may override"). (1) `/deliver` judges every link that names our storage and takes a link on any other host as before, until the relock above. (2) Hosts under the storage endpoint (another bucket on the same provider) count as ours for `/deliver`, so they are judged (refused), not passed through. (3) One refusal message for every reason. (4) An upload row in any status (`pending`, `confirmed`, `abandoned`) counts, because the ruling names only the row; a pending or abandoned object's link answers 404 from the bucket, as a missing object always did. (5) The setting: WAWU ids (UUIDs) separated by commas, spaces around a comma ignored, case ignored, a repeated id accepted, an empty entry refused. (6) "Logged once": once per file per running process (kept in memory, at most 10,000 entries, then cleared). (7) A legacy item keeps the name LEGAL-03 gave it, the last segment of the stored link (for B's link that is B's object's random file name, never the key or a link).

**Shared changes and gaps.** SHARED-CHANGES `LEGAL-03 #2` gains the FIX-24 note (when LEGAL-07 lands: its ops folder joins `DELIVERABLE_KEY_FOLDERS` and `LegalDeliveryRule.check` accepts a key there only for the request it was uploaded for); new row `FIX-24 #1` (contract regenerated and copied). No BACKEND_GAPS row.

**NOT RUN.** A real bucket: the S3 stand-in checks expiry, not signatures (unblocked by a non-production bucket key in a local `.env`). The count on production: I never touch production (unblocked by the owner or lead running the query above with production's `base` and `team`). Refusing foreign links on `/deliver` (unblocked by the owner's relock label for the `POST /legal/ops/requests/:id/deliver` probe). The full backend suite (not in this brief's checks; unblocked by a run in its own network namespace, common rules). Dashboard lint, typecheck, build and screenshots: this task changes no dashboard file; its deliver form shows the server's message (`serverMessageOf` in `LegalRequestDetail.tsx`, code read, not run) (unblocked by LEGAL-07's delivery screen, which owns that UI). WAWU ID note: its `origin/main` needs `@nestjs/swagger`, which the shared `/home/user/wawu-id/node_modules` lacks; four packages were hard-linked from `shared-be` into my export to build it (nothing shared was written).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
