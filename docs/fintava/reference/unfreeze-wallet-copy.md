---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Wallet Balance

This endpoint helps you get the wallet balance of a particular customer. The only parameter needed for this is the walletId. The walletId is created after you run the create customer endpoint successfully.

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
    "/customer/wallet/balance/{walletId}": {
      "get": {
        "summary": "Wallet Balance",
        "description": "This endpoint helps you get the wallet balance of a particular customer. The only parameter needed for this is the walletId. The walletId is created after you run the create customer endpoint successfully.",
        "operationId": "unfreeze-wallet-copy",
        "parameters": [
          {
            "name": "walletId",
            "in": "path",
            "description": "Enter the wallet ID of the customer. See the information box to know where to find the wallet ID",
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
                    "value": "{\n  \"data\": {\n    \"balance\": {\n      \"bookedBalance\": 0,\n      \"availableBalance\": 0\n    }\n  },\n  \"status\": 200,\n  \"message\": \"successful\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "balance": {
                          "type": "object",
                          "properties": {
                            "bookedBalance": {
                              "type": "integer",
                              "example": 0,
                              "default": 0
                            },
                            "availableBalance": {
                              "type": "integer",
                              "example": 0,
                              "default": 0
                            }
                          }
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
          "404": {
            "description": "404",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"statusCode\": 404,\n  \"message\": \"Wallet not found\",\n  \"error\": \"Not Found\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "statusCode": {
                      "type": "integer",
                      "example": 404,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "Wallet not found"
                    },
                    "error": {
                      "type": "string",
                      "example": "Not Found"
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
  "_id": "650ef5d3cd3e4d0025380256:650f8b17e28e3e0052a8b9ea"
}
```