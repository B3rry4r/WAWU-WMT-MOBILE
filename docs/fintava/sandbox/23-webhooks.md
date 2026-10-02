# Webhooks

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 13 (money received, wallet transfer, bank transfer, reversal).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **NOT RUN**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **NOT RUN** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- **Still not run.** This session has no public URL and no access to the
  Fintava dashboard where the webhook URL and secret are set. Events did
  fire this time: four wallet-to-wallet transfers (`13-`), so a configured
  URL would have received `wallet_to_wallet_transfer_v2` deliveries.
- They matter more than planned: the history lists show only debits
  (`09-`, `10-`), so "money received" in the app depends on these
  deliveries.
- What the run needs is unchanged (see below), plus: bank sends must work
  first for `customer_bank_transfer` and `debit_transfer_reversal`
  (`14-bank-transfer.md`).

### Requests and responses

None in the re-run.

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- **Not run, for two reasons.** This session has no public URL, and Fintava
  cannot deliver to `localhost` (its own webhooks page says so). And no
  event could have fired: every call that moves money was refused with
  `403 Merchant is not active` (README.md, "The blocker").
- What the run needs (wawu-backend `docs/LOCAL.md`, sections 7 and 8):
  1. The backend running locally with the webhook route (MONEY-07).
  2. A tunnel to port 3001: `cloudflared tunnel --url http://localhost:3001`
     (prints `https://<random>.trycloudflare.com`) or `ngrok http 3001`.
  3. In the Fintava sandbox dashboard, the webhook URL set to the tunnel's
     `https://` address plus the webhook route under `/api/hub/`, and the
     dashboard's webhook secret copied into the backend `.env` as
     `FINTAVA_WEBHOOK_SECRET`.
  4. Then fire each event: fund a customer's account number from another
     bank (`account_funded`), a wallet-to-wallet send
     (`wallet_to_wallet_transfer_v2`), a bank send
     (`customer_bank_transfer`) and a failed bank send
     (`debit_transfer_reversal`). Save each delivery's headers
     (`x-fintava-signature`) and raw body here, and check the HMAC-SHA512.
- Still unknown: whether the type field is `event` or `type`, the exact
  payloads, and how many retries the sandbox makes in practice.
