---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Generate Virtual Wallet

Generate Virtual wallets to receive one time payments from your customers

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
    "/virtual-wallet/generate": {
      "post": {
        "summary": "Generate Virtual Wallet",
        "description": "Generate Virtual wallets to receive one time payments from your customers",
        "operationId": "generate-virtual-wallet",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "customerName",
                  "expireTimeInMin",
                  "merchantReference",
                  "amount",
                  "phone",
                  "email"
                ],
                "properties": {
                  "customerName": {
                    "type": "string",
                    "description": "The customer's full name. Example is John Doe"
                  },
                  "expireTimeInMin": {
                    "type": "integer",
                    "description": "How long will the virtual wallet stay active. The duration can only be in minutes.",
                    "format": "int32"
                  },
                  "merchantReference": {
                    "type": "string",
                    "description": "This is the reference attached to the transaction."
                  },
                  "description": {
                    "type": "string",
                    "description": "The transaction description could be the purpose of the transaction. An example is airtime purchase."
                  },
                  "amount": {
                    "type": "number",
                    "description": "This is the amount to be paid into the virtual wallet generated. Format example, 1000.00",
                    "format": "float"
                  },
                  "phone": {
                    "type": "string",
                    "description": "The customer's phone number"
                  },
                  "email": {
                    "type": "string",
                    "description": "Customer's email address"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "201",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}{\n  \"data\": {\n    \"customerName\": \"John Doe\",\n    \"merchantReference\": \"T1234T56\",\n    \"expireTimeInMin\": 20,\n    \"description\": \"School fees\",\n    \"amount\": 100,\n    \"phone\": \"09036652198\",\n    \"email\": \"abiodunbolutobi@gmail.com\",\n    \"virtualAcctName\": \"Google_Inc_/Fintava\",\n    \"virtualAcctNo\": \"1195695605\",\n    \"merchant\": {\n      \"id\": \"50719eea-35d6-4016-8128-47ba3bae3d49\"\n    },\n    \"jobId\": \"211\",\n    \"metadata\": null,\n    \"webhookUrl\": null,\n    \"bank\": \"Iyin Ekiti Microfinance Bank Limited (Loma Bank)\",\n    \"redirectUrl\": null,\n    \"id\": \"12ea77b9-6447-49da-a57a-ae86a87dc5ef\",\n    \"createdAt\": \"2023-12-15T19:17:09.382Z\",\n    \"updatedAt\": \"2023-12-15T19:17:09.382Z\",\n    \"requestTime\": \"2023-12-15T19:17:09.382Z\",\n    \"status\": \"ONGOING\",\n    \"paymentStatus\": \"NO_PAYMENT\"\n  },\n  \"status\": 200,\n  \"message\": \"successful\"\n}"
                  }
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
  "_id": "650ef5d3cd3e4d0025380256:657c7665c1a1760034e01291"
}
```