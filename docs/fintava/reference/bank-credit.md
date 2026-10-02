---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Transfer to bank

This endpoint enables funds transfer from a customer's wallet to a bank.

> 📘 Where to find the sortcode parameter
>
> When you run the [Get Banks Lists](https://fintava.readme.io/reference/get-banks) endpoint, you'll find the sortcode for individual banks

> 📘 Where do you find your sourceId?
>
> The sourceId is the same thing as the customerId for this endpoint. To find the customerId, simply run the [Get customer list endpoint.](https://fintava.readme.io/reference/get-customer-list) In that response, the ID within the userInfo object is the customerId. See an example below. Here's a sample of what you're looking for. ecca57f9-a1be-4463-a719-937ef287fb78.

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
    "/bank/credit": {
      "post": {
        "summary": "Transfer to bank",
        "description": "This endpoint enables funds transfer from a customer's wallet to a bank.",
        "operationId": "bank-credit",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "accountNumber",
                  "accountName",
                  "sortCode",
                  "amount",
                  "sourceId"
                ],
                "properties": {
                  "narration": {
                    "type": "string",
                    "description": "This is the transactions narration. It can be what the transaction is for. Example, school fees."
                  },
                  "accountNumber": {
                    "type": "string",
                    "description": "The recipient's account number."
                  },
                  "accountName": {
                    "type": "string",
                    "description": "The recipient's name."
                  },
                  "sortCode": {
                    "type": "string",
                    "description": "This is a unique code that represents a commercial bank. See the info box above this endpoint to learn how to find a sortCode"
                  },
                  "amount": {
                    "type": "number",
                    "description": "This is the amount to be transferred. eg. 2000",
                    "format": "double"
                  },
                  "sourceId": {
                    "type": "string",
                    "description": "This is the account that'll be debited to facilitate the transfer. The source is the customerId. Please, see the information boxes to learn where to find the customerID"
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
                    "value": "{\n\nmessage: \"successful\"\nstatus: 200\ndata: {\n  \"amount\": 100,\n  \"reference\": \"pJWh8Wu8vXxKEyjFBi5gw2LIj9zlquT5s8oP\",\n  \"customerReference\": \"84ebna98-7b1e-4e7d-8655-e76357102d1a\",\n  \"total\": 100,\n  \"transaction_fee\": 0,\n  \"source_customer_id\": \"65a00d25-678d-4acd-901c-ea99a32158f0\",\n  \"source_customer_accname\": \"Example Business\",\n  \"source_customer_accno\": \"1000778995\",\n  \"source_customer_wallet\": \"1000778995\",\n  \"source_availableBalance\": 2.75,\n  \"source_bookedBalance\": 2.75,\n  \"description\": \"Fund transfer between customers\",\n  \"id\": \"0b4cd671-6ea7-42ee-8bbc-d08baf41b019\",\n  \"lomaCharge\": 7.5\n}\n\n}"
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
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl -X POST \"https://dev.fintavapay.com/api/txn/bank/credit\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"accountName\": \"SIMI MICHELLE\",\n    \"accountNumber\": \"0021234567\",\n    \"narration\": \"trf\",\n    \"sortCode\": \"000013\",\n    \"amount\": 100,\n    \"sourceId\": \"0abc52b3-8204-4ed2-a0bf-7c2e401bd8de\"\n  }'\n"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true,
  "_id": "650ef5d3cd3e4d0025380256:650f849de28e3e0052a8944c"
}
```