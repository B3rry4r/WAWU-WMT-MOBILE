# INBOX-12 · round history

Moved out of [tasks/INBOX-12.md](../INBOX-12.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder (Sonnet), 16 Oct 2026. Backend `wmt/INBOX-12` `15ee7e9` (from main `56f94d0`), mobile `wmt/INBOX-12` (from `2f0ca33`, merged main since). Migration: none.
- **Backend files:** `src/direct-message/{paid-dm-settings.config,paid-dm-settings.service}.ts`, `dto/paid-dm-settings.dto.ts`, `paid-dm-view.type.ts`, `paid-dm.controller.ts`, `direct-message.module.ts`, `tests/paid-dm-settings.contract.spec.ts`, `contract/openapi.json` (+156 lines, none removed).
- **Mobile files:** `src/features/paid-messages/*` (+3 test files), `src/app/paid-message-settings.tsx`; entries in `InboxScreen`, `ServicesTab`, `MeScreen`, `ListingsScreen` and the three routes; contract and generated types (+105 lines, additions only).
- **I21 toggle, price (preset or typed), reply time, Save:** screen tests press each and read the PUT body in kobo; in a real browser against the Hub the saved row read back `true|2000|48`.
- **I22 Raise:** test and picture: Raise fills the field, Save sends 250000; the button and its sentence go when the Hub has no higher price.
- **I23:** switch, field, presets, reply times and Save are locked from the Hub's standing; a save refused with `paid_messages_paused` locks an open screen.
- **Figures:** nothing literal. Presets, reply times, bounds, share, lines, counts and dates come from the Hub; "You earn" follows a typed price from the Hub's share with the Hub's rounding down (the Hub also sends it for the saved price). Gaps: G-722, G-723, G-724.
- **Checks:** see Current state. Gate counts: backend gates 16 FAIL before and after (+1 warn); mobile `npm run gates` in the final check log.
- **Not done:** the web's `PATCH` still allows a paused creator to switch on (G-723). No picture of the P8 link (it needs an approved professional listing); it is tested by pressing it.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The ME-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

