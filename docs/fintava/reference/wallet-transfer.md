---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Wallet Transfer

This endpoints allows transfers between two Fintava wallets.

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
    "/transaction/wallet-to-wallet": {
      "post": {
        "summary": "Wallet Transfer",
        "description": "This endpoints allows transfers between two Fintava wallets.",
        "operationId": "wallet-transfer",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "senderAccount",
                  "receiverAccount",
                  "amount",
                  "CustomerReference"
                ],
                "properties": {
                  "senderAccount": {
                    "type": "string",
                    "description": "This is the accountno of the customer being debited."
                  },
                  "receiverAccount": {
                    "type": "string",
                    "description": "The receiverAccount is the account number of the recipient or beneficiary"
                  },
                  "narration": {
                    "type": "string",
                    "description": "This is the transaction narration, it is optional"
                  },
                  "amount": {
                    "type": "number",
                    "description": "This is the transaction amount",
                    "format": "double"
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
                    "value": "{\n  \"data\": {\n    \"amount\": 1000,\n    \"reference\": \"Dd0TTif7C2zyKQHKGzePEfqjoKF256aDRiqX\",\n    \"customerReference\": \"0a0f9ca2-5463-4809-8f88-12c9aa4cfbfa\",\n    \"total\": 1000,\n    \"transaction_fee\": 0,\n    \"source_customer_id\": \"f2fcfb20-893e-4c34-9cec-3455eb07620e\",\n    \"source_customer_accname\": \"Procuregrids ltd\",\n    \"source_customer_accno\": \"1133618601\",\n    \"source_customer_wallet\": \"1133618601\",\n    \"source_availableBalance\": 4500,\n    \"source_bookedBalance\": 4500,\n    \"description\": \"Fund transfer between customers\"\n  },\n  \"status\": 200,\n  \"message\": \"successful\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "amount": {
                          "type": "integer",
                          "example": 1000,
                          "default": 0
                        },
                        "reference": {
                          "type": "string",
                          "example": "Dd0TTif7C2zyKQHKGzePEfqjoKF256aDRiqX"
                        },
                        "customerReference": {
                          "type": "string",
                          "example": "0a0f9ca2-5463-4809-8f88-12c9aa4cfbfa"
                        },
                        "total": {
                          "type": "integer",
                          "example": 1000,
                          "default": 0
                        },
                        "transaction_fee": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "source_customer_id": {
                          "type": "string",
                          "example": "f2fcfb20-893e-4c34-9cec-3455eb07620e"
                        },
                        "source_customer_accname": {
                          "type": "string",
                          "example": "Procuregrids ltd"
                        },
                        "source_customer_accno": {
                          "type": "string",
                          "example": "1133618601"
                        },
                        "source_customer_wallet": {
                          "type": "string",
                          "example": "1133618601"
                        },
                        "source_availableBalance": {
                          "type": "integer",
                          "example": 4500,
                          "default": 0
                        },
                        "source_bookedBalance": {
                          "type": "integer",
                          "example": 4500,
                          "default": 0
                        },
                        "description": {
                          "type": "string",
                          "example": "Fund transfer between customers"
                        }
                      }
                    },
                    "status": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "successful"
                    }
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
                    "value": "{\n  \"status\": 400,\n  \"timestamp\": \"2026-09-14T16:17:38.305Z\",\n  \"message\": {\n    \"statusCode\": 400,\n    \"message\": [\n      \"senderAccount should not be empty\",\n      \"receiverAccount must be a number string\",\n      \"receiverAccount should not be empty\",\n      \"amount should not be empty\",\n      \"amount must be a positive number\",\n      \"amount must be a number conforming to the specified constraints\"\n    ],\n    \"error\": \"Bad Request\"\n  },\n  \"path\": \"/api/dev/transaction/wallet-to-wallet\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "integer",
                      "example": 400,
                      "default": 0
                    },
                    "timestamp": {
                      "type": "string",
                      "example": "2026-09-14T16:17:38.305Z"
                    },
                    "message": {
                      "type": "object",
                      "properties": {
                        "statusCode": {
                          "type": "integer",
                          "example": 400,
                          "default": 0
                        },
                        "message": {
                          "type": "array",
                          "items": {
                            "type": "string",
                            "example": "senderAccount should not be empty"
                          }
                        },
                        "error": {
                          "type": "string",
                          "example": "Bad Request"
                        }
                      }
                    },
                    "path": {
                      "type": "string",
                      "example": "/api/dev/transaction/wallet-to-wallet"
                    }
                  }
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
  "_id": "650ef5d3cd3e4d0025380256:657234ce8827ab000fea09ca"
}
```