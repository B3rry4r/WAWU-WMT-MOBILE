# The selfie match route against the sandbox (KYC-02)

Task KYC-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026,
20:59:29 to 20:59:47 UTC. No other Fintava host was called.

The backend was built from the `wmt/KYC-02` branch and run locally
(`node dist/src/main.js` on :4802) against a local database
(`k02_live_test`) and the mock WAWU ID (:4801), with the sandbox key read
from a file into the process environment and never printed. The driver
scripts were not committed.

Masking: as in the other files here. Every 11-digit number shows its last 4
digits only. The only BVN sent is the example Fintava's own BVN check page
prints (`reference/verify-bvn.md`, last 4 `8901`, the one `05-bvn-selfie.md`
used), not a person's. The only image sent is a synthetic one generated for
this run: a cartoon face drawn from shapes (an oval, two circles, a triangle,
an arc) on a gradient, 480 x 640 JPEG, 11,691 bytes, never a photo of anyone.
The key appears nowhere below.

Limits kept: at most 2 selfie matches. **2 were made.**

## Call 1: the MONEY-06 client, direct

`FintavaClient.verifyBvnSelfie({ bvn: *******8901, imageBase64: <synthetic JPEG> })`,
sent 20:59:29.600 UTC.

- Answer: **HTTP 400** after 5.43 s, `["Request failed with status code 404"]`,
  read by the client as `identity_refused`.
- WAWU's merchant wallet went down by **1,000 kobo (₦10)** across the call
  (`GET /merchant/balance` before and after: 4,963,500 then 4,962,500 kobo).
  A failed match is charged, as `05-bvn-selfie.md` found.
- So this example BVN still has no record the face match can use. **No BVN
  the sandbox knows has been found** (question 11 in `README.md` stands), and
  the success body is still unseen (question 6).

## Call 2: the route, end to end

`POST /api/hub/money/identity/selfie` with `{ bvn: *******8901, image:
<the same synthetic JPEG> }` and a token for a new person, sent 20:59:41.329
UTC. The BVN check cannot pass in the sandbox (question 11), so the person's
passed-check row was written directly into `WalletIdentity`, under the app's
own keyed hash of that BVN, as KYC-01 writes it.

```json
{
  "statusCode": 422,
  "message": "We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.",
  "data": null,
  "reason": {
    "code": "selfie_not_matched",
    "message": "We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.",
    "checksLeft": 2
  }
}
```

- HTTP 422 after 6.13 s, `Cache-Control: no-store`. Fintava's own text did not
  reach the answer; the answer carries neither the BVN nor any part of the
  image.
- Merchant wallet down **1,000 kobo (₦10)** across the call (4,962,500 then
  4,961,500 kobo).
- `GET /api/hub/money/identity/selfie` for the same person then answered
  `{ matchedAt: null, checksLeft: 2 }`. The one `SelfieMatchAttempt` row:
  `outcome not_matched`, `confidence null`, settled.
- The server's log has one line for it, `verify BVN selfie: identity_refused
  HTTP 400 "Request failed with status code 404"`. Scanned with a script that
  never prints what it looks for: the full BVN 0 times, 0 of the image's 389
  40-character windows, 0 of the 58 8-character windows of the Fintava key,
  0 of the 57 of the identity hash key, in the server log and both driver
  outputs. Every text, JSON, bytea and array column of every table in
  `k02_live_test` (502 columns): 0 hits for the BVN or the image.

## Also seen (free, nothing sent to Fintava)

- A body over the server's global JSON limit (100 KB) is refused by the body
  parser before the route runs, as on every route: today the global error
  filter answers it `500` (no body echoed, no image in the log line). The
  route's own cap (100,000 base64 characters) sits below it.

## NOT RUN

- **A selfie that matches, on a real record.** Unblocked when Fintava names a
  BVN the sandbox accepts and the success body can be seen (questions 6 and
  11). Until then a pass is tested against the local stand-in in the
  backend's contract tests: Fintava's 2xx envelope around its documented
  example (`SELFIE_200`), and a richer answer that echoes the BVN, a photo
  and the selfie back (`selfieAnswer`).
