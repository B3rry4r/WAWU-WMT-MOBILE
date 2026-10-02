---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Get Transaction by id

Use this endpoint to search for a transaction using the transaction id

> 📘 Where to  get your transaction Id
>
> You can get your transaction Id from running the Get merchant transaction endpoint or Get the customer transaction endpoint.

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
    "/transaction/id/{transactionId}": {
      "get": {
        "summary": "Get Transaction by id",
        "description": "Use this endpoint to search for a transaction using the transaction id",
        "operationId": "get-transaction-by-id",
        "parameters": [
          {
            "name": "transactionId",
            "in": "path",
            "description": "Enter the transaction Id. See the info column to know where to get your transaction Id.",
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
  "_id": "650ef5d3cd3e4d0025380256:657cac9580069300161f2910"
}
```