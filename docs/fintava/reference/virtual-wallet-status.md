---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Virtual Wallet Details

Get the details of a virtual wallet you've generated. Details include, payment status, and wallet's status (active/disabled).

> 📘 Where to find wallet id
>
> A wallet is created after you generate a virtual wallet. Please not that the wallet id is the second id under the data object. Here's an example of what it looks like. "id": "12ea77b9-6447-49da-a57a-ae86a87dc5ef", See the result below and find the id that corresponds with this example.

```
{
  "data": {
    "customerName": "John Doe",
    "merchantReference": "T1234T56",
    "expireTimeInMin": 20,
    "description": "School fees",
    "amount": 100,
    "phone": "09036652198",
    "email": "abiodunbolutobi@gmail.com",
    "virtualAcctName": "Google_Inc_/Fintava",
    "virtualAcctNo": "1195695605",
    "merchant": {
      "id": "50719eea-35d6-4016-8128-47ba3bae3d49"
    },
    "jobId": "211",
    "metadata": null,
    "webhookUrl": null,
    "bank": "Iyin Ekiti Microfinance Bank Limited (Loma Bank)",
    "redirectUrl": null,
    "id": "12ea77b9-6447-49da-a57a-ae86a87dc5ef",
    "createdAt": "2023-12-15T19:17:09.382Z",
    "updatedAt": "2023-12-15T19:17:09.382Z",
    "requestTime": "2023-12-15T19:17:09.382Z",
    "status": "ONGOING",
    "paymentStatus": "NO_PAYMENT"
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
    "/virtual-wallet/{id}": {
      "get": {
        "summary": "Virtual Wallet Details",
        "description": "Get the details of a virtual wallet you've generated. Details include, payment status, and wallet's status (active/disabled).",
        "operationId": "virtual-wallet-status",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Enter the wallet id. See info column on where to find a wallet id",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
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
  "_id": "650ef5d3cd3e4d0025380256:657c79ae104b740050526e51"
}
```