# Webhooks

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 13 (money received, wallet transfer, bank transfer, reversal). Result: **NOT RUN**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

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
