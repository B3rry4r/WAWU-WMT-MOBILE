# Texting the PIN reset code (MONEY-14)

Task MONEY-14, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
10:47:37 to 10:47:38 UTC. No other Fintava host was called (a fetch guard in
the script refused any other host). Two calls, both `POST /sms/send`, the
route AUTH-03 uses for sign-up codes and MONEY-14 uses for the PIN reset
code. The key was read from a file with `sed` into the command's
environment, never printed; the output was checked for it (none).

The number is the reference page's own example, `+2349036652198`
(`reference/send-sms.md`). The text was a neutral line with no code in it:
"Who Made This sandbox check, task MONEY-14. No action needed."

## The calls

| # | How | Request body | HTTP | Answer |
|---|---|---|---|---|
| 1 | wawu-backend `FintavaClient.sendSms` (branch `wmt/MONEY-14`, built), the real code path | `{"to":"+2349036652198","sms":"..."}` | **400** | `{"status":400,"timestamp":"2026-10-03T10:47:38.186Z","message":["amount must be greater than or equal to 1"],"path":"/api/dev/sms/send"}` |
| 2 | raw `fetch`, the same number **without** its country code | `{"to":"09036652198","sms":"..."}` | **400** | `{"status":400,"timestamp":"2026-10-03T10:47:38.411Z","message":{"statusCode":400,"message":["to must be a valid phone number"],"error":"Bad Request"},"path":"/api/dev/sms/send"}` |

Both answered `content-type: application/json; charset=utf-8`.

## What they taught us

1. **No text leaves the sandbox for this merchant.** A well-formed request
   (call 1: the documented number with `+234`) passes Fintava's validation
   and is refused with a business error, `"amount must be greater than or
   equal to 1"`. The request has no amount (the reference page lists only
   `to` and `sms`), so the amount is Fintava's own: most likely the price of
   a text for WAWU's sandbox merchant is 0 or unset, and the charge is
   refused before anything is sent. Nothing says whether a text went out:
   the client reads it as a refusal (`refused`, nothing sent), the reset
   answers `503 provider_unreachable`, the code never works and the text is
   not counted. **Unblocked when** Fintava sets the text price for WAWU's
   sandbox merchant (or says what `amount` means here): one `POST /sms/send`
   to the example number then answers 2xx. Mobile BACKEND_GAPS G-42.
2. **The number must carry its country code** (call 2): a local `0...`
   number is refused by validation, in the nested shape
   (`message.message`). The client always sends `+234` and the national
   number, so this cannot happen from WAWU.
3. **The documented `200 {}` was not seen.** The client accepts any 2xx as
   sent unless its body carries an error status (`status` or `statusCode`
   400 or more), the way Fintava answers some refusals with a 2xx
   (`21-bills-cable.md`).
4. Not seen and not asked: the charge per text (`fees.md` lists 7 naira on
   the dashboard), and whether a refused text is charged. The merchant
   balance was not read before or after.
