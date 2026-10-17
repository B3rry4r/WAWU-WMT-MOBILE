# SETTINGS-05 · round history

Moved out of [tasks/SETTINGS-05.md](../SETTINGS-05.md) word for word, oldest first. The current state is in that file.

## Builder report

Mobile: `src/features/delete-account/` (api, model, WalletNotice, DeleteAccountScreen, ConfirmDeletionScreen, ReasonSheet, ScheduledScreen, two test files), routes `src/app/settings/delete-account/{index,confirm,scheduled}.tsx`, the row in `src/features/settings/SettingsScreen.tsx` and `src/app/settings/index.tsx`, the contract copy. Backend: `src/account/{account.controller,account.service}.ts`, `dto/delete-account.dto.ts`, schema column and migration `20261025181000`, one spec, regenerated contract. Each capability check and how it was tested is in Current state above (jest cases are written as "a user can ..."; the stack run drove the built screens against the real Hub and wawu-id). Not run: V10, the gate count before the change.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

