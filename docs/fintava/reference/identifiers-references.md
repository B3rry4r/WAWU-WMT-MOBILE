---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Identifiers & References

Fintava uses different identifiers and references to identify customers, wallets, accounts, and transactions.

Some of these values may look similar, but they are not interchangeable. Use this page to understand where each value comes from and which API operations expect it.

## Identifier overview

| Identifier               | What it identifies                                         | Where you get it                                  | Common use                                                |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| `customerId`             | A customer                                                 | Returned in customer data as `userInfo.id`        | Customer lookup, customer transactions and some transfers |
| `walletId`               | A customer's Fintava wallet                                | Returned in the customer's `wallet.id`            | Wallet balance, freeze and unfreeze operations            |
| Wallet `accountNumber`   | A Fintava wallet account number                            | Returned in the customer's `wallet.accountNumber` | Wallet lookup and wallet-to-wallet transfers              |
| External `accountNumber` | An account at another bank                                 | Supplied by the merchant/user                     | Bank account enquiry and bank transfers                   |
| `CustomerReference`      | A merchant-provided transaction reference                  | Created by the merchant                           | Correlating transfers with records in your own system     |
| `merchantReference`      | A merchant-provided reference for a virtual wallet payment | Created by the merchant                           | Identifying a virtual wallet/payment request              |
| Transaction `reference`  | A reference attached to a Fintava transaction              | Returned in transaction records                   | Looking up and reconciling a transaction                  |
| `transactionId`          | The internal ID of a transaction                           | Returned in transaction records                   | Looking up a transaction by ID                            |