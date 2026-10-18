# EVENTS-12 · round history

Moved out of [tasks/EVENTS-12.md](../EVENTS-12.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 18 Oct 2026 (Sonnet agent, bundle S9). Backend `wmt/S9` `50066b9`, mobile `wmt/S9` (records).
- **Files (backend):** `src/event/event.service.ts` (`assertMayHost`), `src/plans/host-tier-error.ts`, `host-tier-offers.interceptor.ts` (`@GatesHosting()`), `dto/host-tier-error.dto.ts`, `plans.module.ts`, the event and ticketing modules and controllers, `docs/contract/PLANS.md` section 13, `contract/openapi.json` (+140 lines, none removed or retyped).
- **Gate order:** live tick (no extra read) then a running tier (`MakerTierService`, the publishing gate's own test) then refuse; creator or professional gets `tier_required`, any other account `account_type_required` as before. Any tier of the plan is enough; the tier reads the same for every account type.
- **Capability 1** (tier and no tick creates; neither is refused naming the tier and its price): `event-host-tier.contract.spec.ts`, 19 tests on the stack (create, edit, price change, `ending`, any tier, a second person, the sentence, the lowest tier equals `GET /plans`).
- **Capability 2** (live tick and no tier hosts until the tick ends): same spec, four tests (tick only, tick with an ended tier, ended tick refused, ended tick with a running tier).
- **Capability 3** (price changes still go back to review): same spec, a tier-only host reprices an approved event: `pending`, a stranger gets 404.
- **Lapsed tier:** refused on the three routes with one body, nothing written, the same-tiers resend refused too, the sold-tickets 409 still first; the live event stays public and a free ticket is still bought (`sold` 1, one ticket issued); renewing hosts again.
- **Mutants:** 8 of the gate (ignore tier, ended runs, `ending` not running, tick ignored, PUT without the offer, highest tier, state always `none`, buyer type), each killed. Before the change all 19 fail.
- **Checks:** tsc EXIT 0; eslint EXIT 0 on every changed file except `event.contract.spec.ts` (102 problems before, 100 after, all old unsafe-any lines); `host-tier-coverage.spec.ts` 4/4 (the three routes carry the offer; only the two services call the gate); 21 event, plans and webhook specs (named in `s9-b/specs-batch1.txt`, scratchpad): 321 of 328 pass, the 7 that fail (door staff and holder names, 4 suites) fail identically on `4c52e57`; `route-shadowing` and `publishing-gate-coverage` (AppModule on the Nuvion env) 26/26; protected suite EXIT 0 (253/253); gates EXIT 0 (0 fail, 128 warn, 88 accepted); `check_baseline` EXIT 0; `contract:build` EXIT 0; route table 603 before and after, identical.
- **Spec edits I did not write (R-43 reverses the tick as the gate):** `event.contract.spec.ts` (2 assertions, `steps` and `purchasable` dropped from the first), `event-hosting.contract.spec.ts` (1), `event-tickets-review.contract.spec.ts` (3, two titles): `verification_required` read `tier_required`. The buyer's `account_type_required` assertion is untouched.
- **Gaps:** G-EVENTS-12-1: the app's `hostApi.ts` does not know `tier_required` (DV2-04 builds E21 on it). G-EVENTS-12-2: nothing tells the app before a POST whether a person may host (a live tick hosts with state `none`); `GET /me/tier` could carry it. No SHARED-CHANGES row filed here (records limited to the task files): `contract/openapi.json` is additive.
- **NOT RUN:** CI (the lead watches), the real WAWU ID (the stack's mock; the protected suite on its own mock), Fintava and Flutterwave (not called).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

