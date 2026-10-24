# INBOX-18 · round history

Moved out of [tasks/INBOX-18.md](../INBOX-18.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: backend `src/direct-message/` (view types, service, controller, hooks, wallet resolver, spec), `scripts/enrich-contract.js` (one path), `contract/openapi.json`; mobile `src/features/paid-answers/*`, `src/app/paid-questions/[wawuId].tsx`, edits to `inbox/{chips,rows,InboxScreen}`, `notifications/{model,NotificationFeedScreen}`, `inbox/__tests__/unread.test.tsx` (SHARED-CHANGES INBOX-18 #1 to #4), contract and generated types. Checks and stack runs are in Current state; gate counts: mobile 0 fail before and after (15 warn), backend 0 fail (128 warn, 88 accepted) before and after. Gaps: G-INBOX-18-1 to -7. Not done: the pictures of every board beside every state are in the scratch folder, not committed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

