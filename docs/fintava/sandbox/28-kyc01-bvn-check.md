# The BVN check route against the sandbox (KYC-01)

Task KYC-01, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026,
19:35:53 to 19:37:05 UTC. No other Fintava host was called.

The backend was built from the `wmt/KYC-01` branch and run locally
(`node dist/src/main.js` on :4742) against a local database
(`k01_contract_test`) and the mock WAWU ID (:4741), with the sandbox key read
from a file into the process environment and never printed. The driver
scripts were not committed.

Masking: as in the other files here. Every 11-digit number shows its last 4
digits only. No real person's BVN, NIN or phone was sent: the only BVN used is
the example Fintava's own reference pages print in the create-customer,
freeze, unfreeze, single-transfer and bank-credit examples (last 4 `0003`), a
synthetic test-style value, not a person. The key appears nowhere below.

Limits kept: at most 3 BVN lookups, only with a BVN Fintava's docs give.
**2 were made.** The third was not: the other documented example (last 4
`8901`, `04-bvn-check.md`) is already known to be refused, so it would teach
nothing.

## Call 1: the MONEY-06 client, direct

`FintavaClient.verifyBvn('*******0003')`, sent 19:35:53.107 UTC.

- Answer: **HTTP 400** after 2.08 s, `["Invalid BVN or BVN does not exist"]`,
  read by the client as `identity_refused`.
- So this example is not a sandbox test identity either. **No BVN the sandbox
  knows has been found** (question 11 in `README.md` stands).

## Call 2: the route, end to end

`POST /api/hub/money/identity/bvn` with `{ bvn: *******0003, nin: *******0003 }`
and a token for a new person whose account phone is `+234 803 *** 4412`, sent
19:37:02.488 UTC.

```json
{
  "statusCode": 422,
  "message": "We could not confirm that BVN. Check the number and try again.",
  "data": null,
  "reason": {
    "code": "bvn_not_confirmed",
    "message": "We could not confirm that BVN. Check the number and try again.",
    "checksLeft": 2
  }
}
```

- HTTP 422 after 3.07 s, `Cache-Control: no-store`. Fintava's own text did not
  reach the answer.
- WAWU's merchant wallet went down by **500 kobo (₦5)** across the call (read
  before and after with `GET /merchant/balance`): a refused BVN check is
  charged, as `04-bvn-check.md` found.
- `GET /api/hub/money/identity` for the same person then answered
  `{ bvn: null, ninLast4: null, occupation: null, checksLeft: 2 }`: nothing
  stored, one of today's three checks used.
- The server's log has one line for it, `verify BVN: identity_refused HTTP 400
  "Invalid BVN or BVN does not exist"`, and the full BVN appears **0 times**
  in the whole server log.

## NOT RUN

- **A BVN that passes (A5's prefill from a real answer) and A14 against a real
  BVN record.** Unblocked when Fintava names a BVN the sandbox accepts
  (question 11). Until then the success shape is Fintava's documented one,
  which the backend's contract tests answer with (`BVN_200` in
  `test/fintava/fintava-double.ts`).
