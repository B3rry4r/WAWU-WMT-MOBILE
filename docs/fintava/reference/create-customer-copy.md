---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Fetch Customer

This endpoint helps you get the details of a specific customer. The only parameter needed for this operation is the customer ID. You can get the customer ID by running the Get customer list endpoint.

> 📘 Where do you find your customerId?
>
> To find a customerId simply run the [Get customer list endpoint.](https://fintava.readme.io/reference/get-customer-list) In that response, the ID within the userInfo object is the customerId. See an example below. Here's a sample of what you're looking for. ecca57f9-a1be-4463-a719-937ef287fb78.

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
    "/customers/{customerId}": {
      "get": {
        "summary": "Fetch Customer",
        "description": "This endpoint helps you get the details of a specific customer. The only parameter needed for this operation is the customer ID. You can get the customer ID by running the Get customer list endpoint.",
        "operationId": "create-customer-copy",
        "parameters": [
          {
            "name": "customerId",
            "in": "path",
            "description": "You can get the customer ID by running the Get customer list endpoint. See the information box to learn where to find the customer ID",
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
                    "value": "{\n  \"id\": \"9168665c-5f72-46e8-8ed0-8ddf95d67975\",\n  \"createdAt\": \"2023-09-26T11:13:40.279Z\",\n  \"updatedAt\": \"2023-09-26T11:13:40.279Z\",\n  \"firstName\": \"Boluwatife\",\n  \"lastName\": \"Abiodun\",\n  \"phoneNumber\": \"+2349165913234\",\n  \"bvn\": \"22167941234\",\n  \"dateOfBirth\": \"1992-12-25\",\n  \"address\": \"58N Gary Ave\",\n  \"roles\": [\n    \"USER\"\n  ],\n  \"userType\": \"CUSTOMER\",\n  \"auth\": null\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "example": "9168665c-5f72-46e8-8ed0-8ddf95d67975"
                    },
                    "createdAt": {
                      "type": "string",
                      "example": "2023-09-26T11:13:40.279Z"
                    },
                    "updatedAt": {
                      "type": "string",
                      "example": "2023-09-26T11:13:40.279Z"
                    },
                    "firstName": {
                      "type": "string",
                      "example": "Boluwatife"
                    },
                    "lastName": {
                      "type": "string",
                      "example": "Abiodun"
                    },
                    "phoneNumber": {
                      "type": "string",
                      "example": "+2349165913234"
                    },
                    "bvn": {
                      "type": "string",
                      "example": "22167941234"
                    },
                    "dateOfBirth": {
                      "type": "string",
                      "example": "1992-12-25"
                    },
                    "address": {
                      "type": "string",
                      "example": "58N Gary Ave"
                    },
                    "roles": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "example": "USER"
                      }
                    },
                    "userType": {
                      "type": "string",
                      "example": "CUSTOMER"
                    },
                    "auth": {}
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
  "_id": "650ef5d3cd3e4d0025380256:650f2c734ccd0500512602fd"
}
```