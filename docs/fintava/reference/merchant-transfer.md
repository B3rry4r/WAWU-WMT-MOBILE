---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Merchant Transfer

Transfer from your Merchant Wallet To Banks

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
    "/bank/credit/merchant": {
      "post": {
        "summary": "Merchant Transfer",
        "description": "Transfer from your Merchant Wallet To Banks",
        "operationId": "merchant-transfer",
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
                  "CustomerReference"
                ],
                "properties": {
                  "narration": {
                    "type": "string",
                    "description": "transaction narration"
                  },
                  "accountNumber": {
                    "type": "string",
                    "description": "beneficiary account number, it is usually 10 digits."
                  },
                  "accountName": {
                    "type": "string",
                    "description": "beneficiary account name"
                  },
                  "sortCode": {
                    "type": "string",
                    "description": "beneficiary bank sortcode"
                  },
                  "metadata": {
                    "type": "array"
                  },
                  "amount": {
                    "type": "number",
                    "format": "float"
                  },
                  "CustomerReference": {
                    "type": "string",
                    "description": "Your Transaction reference"
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
  "_id": "650ef5d3cd3e4d0025380256:65f2f52625e1a80050d67b25"
}
```