---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Webhook Events

Fintava sends webhook events to your configured webhook URL when supported payment and transaction activities occur.

Use the `event` field in the webhook payload to determine what happened, and use the `data` object to identify and reconcile the affected transaction.

## Available Events

| Event                          | Direction    | Description                                                                  |
| ------------------------------ | ------------ | ---------------------------------------------------------------------------- |
| `account_funded`               | Inflow       | A Fintava customer receives money from an external bank.                     |
| `virtual_wallet_payment`       | Inflow       | Payment is received into a dynamic virtual wallet generated through Fintava. |
| `customer_bank_transfer`       | Outflow      | A Fintava customer sends money to an account at another bank.                |
| `wallet_to_wallet_transfer_v2` | Outflow      | A Fintava customer sends money to another Fintava customer.                  |
| `debit_transfer_reversal`      | Reversal     | A previous debit on a customer's Fintava wallet is reversed.                 |
| `card_payment`                 | Card payment | Fintava receives acknowledgement of a standard card debit payment.           |
| `dynamic_card_payment`         | Card payment | Fintava receives acknowledgement of a dynamic card payment.                  |

***

## `account_funded`

Triggered when a Fintava customer's account receives an incoming transfer from another bank.

### When this event is sent

Use this event to detect and reconcile incoming bank transfers made to a customer's Fintava account.

### Direction

`Inflow`

### Example

```json
{
  "event": "account_funded",
  "data": {
    "userId": "bf61c3cf-4894-4a01-91b1-e4c5e2fa2b08",
    "amount": "100.00",
    "reference": "000014231211154211281900319598",
    "senderBankSortcode": "000014",
    "sessionID": "000914231311144221237185422093",
    "channelCode": "3",
    "status": "success",
    "accountName": "John Doe",
    "beneficiaryAccountName": "Joe Services Limited",
    "beneficiaryAccountNumber": "0094886003",
    "accountNumber": "0865231291"
  }
}
```

***

## `virtual_wallet_payment`

Triggered when money is received into a dynamic virtual wallet generated through Fintava.

### When this event is sent

Use this event when your application generates a dynamic virtual wallet for a payment and you need to know when payment has been received.

For example:

1. Your application generates a dynamic virtual wallet for a payment.
2. The customer transfers money to the generated account.
3. Fintava confirms the payment.
4. Fintava sends the `virtual_wallet_payment` webhook.
5. Your application reconciles the payment using the transaction reference.

### Direction

`Inflow`

### Example

```json
{
  "event": "virtual_wallet_payment",
  "data": {
    "id": "6117ef41-a058-4f16-0000-14f4561ec35b",
    "customerName": "John Doe",
    "merchantReference": "9TTEER288282882818",
    "expireTimeInMin": 30,
    "description": "Payment",
    "metadata": null,
    "amount": "650.00",
    "phone": "09070729756",
    "email": "customer@example.com",
    "bank": "Loma Bank",
    "virtualAcctName": "Google Inc Limited/Fintava",
    "virtualAcctNo": "1164658900",
    "requestTime": "2024-03-15T14:06:07.473Z",
    "status": "PAID",
    "paymentStatus": "PAID"
  }
}
```

> Confirm the exact event value sent by the API before publishing. Existing implementations may use `VIRTUAL_WALLET_PAYMENT`.

***

## `customer_bank_transfer`

Triggered when a Fintava customer sends money from their Fintava wallet to an account at another bank.

### When this event is sent

Use this event to track and reconcile outward bank transfers initiated by your customers.

This event represents money leaving the customer's Fintava wallet for an external bank account.

### Direction

`Outflow`

### Example

```json
{
  "event": "customer_bank_transfer",
  "data": {
    "amount": 100,
    "vat": 0,
    "reference": "2e076e1-019a-4a3c-b1a6-65b0d98",
    "customerId": "e17402-0d82-4774-a020-716d819d0",
    "availableBalance": 109.52,
    "bookedBalance": 109.52,
    "status": "SUCCESS",
    "total": 130.75,
    "description": "Payment",
    "destination": "81450/100004",
    "sessionID": "1106110503777587020112",
    "customerReference": "FIO241106308911000370001675",
    "senderName": "ADF Limited",
    "senderAccountNumber": "0000037726",
    "charges": 30.75
  }
}
```

***

## `wallet_to_wallet_transfer_v2`

Triggered when a Fintava customer sends money to another Fintava customer.

Both the sender and recipient are customers within the Fintava ecosystem.

### When this event is sent

Use this event to track and reconcile transfers between Fintava customer wallets.

### Direction

`Outflow`

### Example

```json
{
  "event": "wallet_to_wallet_transfer_v2",
  "data": {
    "amount": 10,
    "reference": "48VYIuIAZTSVQlZ8O900JdcUJ0imoVZ1L",
    "total": 10,
    "transaction_fee": 0,
    "target_customer_id": "dc4d9318-e145-000c-00a8-c251997345c0",
    "source_customer_id": "b2ce958b-2b3c-4004-0089-c064f346b9f7",
    "target_customer_accname": "ArewaPay/John Doe",
    "source_customer_accname": "John Services Limited",
    "target_customer_accno": "0040497763",
    "source_customer_accno": "0020886993",
    "source_customer_wallet": "0031886994",
    "target_customer_wallet": "0032497867",
    "target_availableBalance": 22,
    "target_bookedBalance": 22,
    "source_availableBalance": 187,
    "source_bookedBalance": 187,
    "description": "Fund transfer between customers",
    "customer_id": "ba67c2cl-4894-0001-91b1-e7c5e3fa2b08"
  }
}
```

***

## `debit_transfer_reversal`

Triggered when a previous debit on a Fintava customer's wallet is reversed and the affected amount is returned to the wallet.

This event **does not initiate a reversal**. It notifies your application that a reversal has already occurred.

### When this event is sent

Use this event to reconcile a previously debited transaction that was subsequently reversed.

For example:

1. A customer's wallet is debited for a transfer.
2. The transaction fails or is reversed.
3. Fintava returns the applicable amount to the customer's wallet.
4. Fintava sends the `debit_transfer_reversal` webhook.
5. Your application updates the original transaction.

### Direction

`Reversal`

### Example

```json
{
  "event": "debit_transfer_reversal",
  "data": {
    "amount": 100000,
    "charges": 15,
    "vat": 0,
    "accountName": "ABC Nigeria Ltd",
    "accountNumber": "00126",
    "customerId": "dd3d6-72d-48b9-bb45-29d78b52a",
    "customerReference": "f93fc-f4ef-473c-9817-4e2c3",
    "type": "CREDIT",
    "status": "success",
    "total": 100015,
    "transactionReference": "ref/0906205451400533/tyqwA0xLFhqDX9BWSgzGb0C",
    "description": "Transfer reversal",
    "destination": "5509704/090405",
    "reversalRef": "r-tyqwA0xLFh2ifNhDX9BWSgzGb0C"
  }
}
```

***

## `card_payment`

Triggered when Fintava receives acknowledgement of a card debit payment.

### When this event is sent

Use this event to track the result of a standard card payment processed through Fintava.

### Type

`Card payment`

### Example

```json
{
  "event": "card_payment",
  "data": {
    "...":
  }
}
```

> Replace the example above with an actual `card_payment` webhook payload confirmed by the backend team before publishing.

***

## `dynamic_card_payment`

Triggered when Fintava receives acknowledgement of a payment made through the dynamic card payment flow.

### When this event is sent

Use this event to track and reconcile payments processed through Fintava's dynamic card payment flow.

### Type

`Card payment`

### Example

```json
{
  "event": "dynamic_card_payment",
  "data": {
    "...":
  }
}
```

> Replace the example above with an actual `dynamic_card_payment` webhook payload confirmed by the backend team before publishing.