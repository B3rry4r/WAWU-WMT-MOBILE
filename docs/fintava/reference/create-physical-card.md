---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Create card

create new card request

> 📘 What does cardType mean?
>
> CardType can either be STATIC\_WITH\_ACCOUNT or STATIC\_NO\_ACCOUNT or DYNAMIC\_CARD
>
> STATIC\_WITH\_ACCOUNT: Card request should be accompanied with accountNumber.
>
> STATIC\_NO\_ACCOUNT or DYNAMIC\_CARD: Account number is not required for this card request.

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
    "/cards/physical/request": {
      "post": {
        "summary": "Create card",
        "description": "create new card request",
        "operationId": "create-physical-card",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "cardBrand",
                  "cardName",
                  "cardType"
                ],
                "properties": {
                  "cardBrand": {
                    "type": "string",
                    "description": "VERVE, VISA, MASTERCARD"
                  },
                  "cardName": {
                    "type": "string",
                    "description": "John Doe"
                  },
                  "accountNumber": {
                    "type": "string",
                    "description": "Customer wallet number created by Merchant"
                  },
                  "cardType": {
                    "type": "string",
                    "description": "STATIC_WITH_ACCOUNT, STATIC_NO_ACCOUNT, DYNAMIC_CARD"
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
  "_id": "650ef5d3cd3e4d0025380256:6740139c5bfbd1003688f996"
}
```