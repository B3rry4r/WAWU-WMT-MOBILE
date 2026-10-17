# EVENTS-08 · round history

Moved out of [tasks/EVENTS-08.md](../EVENTS-08.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

- Files: `src/features/events/organiser/` (api, format, parts, My events, dashboard, cancel sheet, shared links, 20 tests), routes `mine`, `dashboard/[id]`, `links/[id]`; `chrome.tsx` (My events tab, NavBar subtitle), `EventsScreen`, `HostScreen`, `HostEnds` (My events tab and button), `TicketScreen`, `ticketFormat.ts`, `ticketsApi.ts` (E11); contract and generated types; backend `event-running.service.ts`, `event-running.controller.ts` and the spec.
- Capability checks: E17 open live and sent-back (tested), E18 At the door and shared links (tested), E25 reason, cancel and keep (tested, including the Hub's 409), E11 amount from the Hub (tested). Edit event and ticket types: not built (G-833).
- Checks: see tasks/history/EVENTS-08.md for the run logs.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

