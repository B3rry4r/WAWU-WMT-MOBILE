---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Transfer between wallets

This endpoints allows transfers between two Fintava wallets. N.B: endpoint is deprecated, use the Wallet Transfer endpoint.

> 📘 Where do you find your sourceId and destination?
>
> The sourceId and destination are the same thing as the customerId. To find the customerId, simply run the [Get customer list endpoint.](https://fintava.readme.io/reference/get-customer-list) In that response, the ID within the userInfo object is the customerId. See an example below. Here's a sample of what you're looking for — ecca57f9-a1be-4463-a719-937ef287fb78.

Below is an example of the response you'll get when you run the Get customer list endpoint

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
    "/single/transfer": {
      "post": {
        "summary": "Transfer between wallets",
        "description": "This endpoints allows transfers between two Fintava wallets. N.B: endpoint is deprecated, use the Wallet Transfer endpoint.",
        "operationId": "single-transfer",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "sourceId",
                  "destination",
                  "amount"
                ],
                "properties": {
                  "sourceId": {
                    "type": "string",
                    "description": "This is the customerId of the customer being debited. Please, see the information box above to learn where to find the customerId."
                  },
                  "destination": {
                    "type": "string",
                    "description": "This is the customerId of the customer being credited. Please, see the information box above to learn where to find the customerId."
                  },
                  "amount": {
                    "type": "number",
                    "description": "This is the amount of money transferred from the source to the destination.",
                    "format": "double"
                  },
                  "metadata": {
                    "type": "string"
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
  "_id": "650ef5d3cd3e4d0025380256:650f80dd45af27002dab3906"
}
```