---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Freeze Wallet

This endpoint freezes a customer's wallet, disabling all financial transactions.

> 📘 WalletId is different from customerID
>
> Please note that the WalletId is different from the customerID. To get the WalletId, run the [Get customer list endpoint](https://fintava.readme.io/reference/get-customer-list). The id within the wallet object is the walletId.

Below is a sample response of the Get customer list endpoint. The walletId is within the wallet object

```
{
    "data": {
      "userInfo": {
        "firstName": "john",
        "lastName": "ugochukwu",
        "phoneNumber": "08030135863",
        "roles": [
          "USER"
        ],
        "userType": "CUSTOMER",
        "address": "lugbe,abuja",
        "bvn": "21000000003",
        "dateOfBirth": "1992-05-17",
        "id": "ecca57f9-a1be-4463-a719-937ef287fb78",
        "createdAt": "2023-10-08T15:51:30.312Z",
        "updatedAt": "2023-10-08T15:51:30.312Z"
      },
      "wallet": {
        "id": "0b134510-c981-40f9-a0a9-983ab22544e1",
        "accountNumber": "1109854154",
        "accountName": "john ugochukwu",
        "isFrozen": false,
        "status": "active",
        "fundMethod": "STATIC_FUND"
      }
    },
    "status": 200,
    "message": "successful"
  }
```

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Customer",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://dev.fintavapay.com/api/dev"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "Authorization",
        "x-bearer-format": "bearer"
      }
    }
  },
  "security": [
    {
      "sec0": []
    }
  ],
  "paths": {
    "/customer/wallet/{walletId}/freeze": {
      "patch": {
        "summary": "Freeze Wallet",
        "description": "This endpoint freezes a customer's wallet, disabling all financial transactions.",
        "operationId": "freeze-customer-wallet",
        "parameters": [
          {
            "name": "walletId",
            "in": "path",
            "description": "Enter the wallet ID of the customer whose account you want to freeze. See the information box to know where to find the wallet ID",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "reason"
                ],
                "properties": {
                  "reason": {
                    "type": "string",
                    "description": "Enter the reason why you want the customer's account frozen. E.g Fraudulent transactions."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true,
  "_id": "650ef5d3cd3e4d0025380256:650f8a4f62028f0056407e4c"
}
```