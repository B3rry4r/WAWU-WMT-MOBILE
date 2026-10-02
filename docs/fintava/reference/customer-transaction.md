---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Get Customer Transaction

Get all the transactions that occurred on a specified customer's wallet

> 📘 How to get customer Id
>
> There are a couple of ways you can get customer Id. One way running the Get customer by phone endpoint or Get list endpoint. Both endpoints will give the customer Id you're looking for.

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
    "/txn": {
      "get": {
        "summary": "Get Customer Transaction",
        "description": "Get all the transactions that occurred on a specified customer's wallet",
        "operationId": "customer-transaction",
        "parameters": [
          {
            "name": "customerId",
            "in": "query",
            "description": "Enter the customer Id. See the info column on how to get a customer Id",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "take",
            "in": "query",
            "schema": {
              "type": "string",
              "default": "50"
            }
          },
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "string",
              "default": "1"
            }
          },
          {
            "name": "order",
            "in": "query",
            "schema": {
              "type": "string",
              "default": "DESC"
            }
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
  "_id": "650ef5d3cd3e4d0025380256:6574f44546831d005551cf95"
}
```