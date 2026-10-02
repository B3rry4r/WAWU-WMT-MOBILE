---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Buy electricity

Use this endpoint to purchase electricity.

> 📘 How do you find disco codes
>
> Electricity distribution companies are represented as codes. You can find this code when you run the [List dicos endpoint](https://fintava.readme.io/reference/list-discos)

In the example below, we're looking for the disco code for IKEDC. Using the[ List discos endpoint](https://fintava.readme.io/reference/list-discos) we identified it as "Ikeja\_Electric\_Bill\_Payment", See the response example below.

```
{
      "id": "dd8ebf39-853e-4bae-96ed-338f4c1fd08d",
      "createdAt": "2023-09-07T00:00:00.718Z",
      "updatedAt": "2023-09-07T00:00:00.718Z",
      "code": "Ikeja_Electric_Bill_Payment",
      "description": "Ikeja Electric Bill Payment",
      "minimum_value": "500",
      "maximum_value": "500000",
      "is_available": "Yes"
    },
```

> ❗️ The electricity amount should not go below ₦500

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
    "/billing/electricity": {
      "post": {
        "summary": "Buy electricity",
        "description": "Use this endpoint to purchase electricity.",
        "operationId": "pay-electricity",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "meternumber",
                  "disco",
                  "amount",
                  "planType"
                ],
                "properties": {
                  "meternumber": {
                    "type": "string",
                    "description": "The meter number"
                  },
                  "disco": {
                    "type": "string",
                    "description": "The code that represents the electricity distribution company. See information box to learn how to disco codes."
                  },
                  "amount": {
                    "type": "number",
                    "description": "The amount (how much money) of electricity units to be purchased. Note this cannot be below 500",
                    "format": "float"
                  },
                  "planType": {
                    "type": "string",
                    "description": "Indicate if its a pre-paid or post-paid meter. The values are represented as prepaid or postpaid. Note that Fintava only supports pre-paid for now.",
                    "default": "prepaid"
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
  "_id": "650ef5d3cd3e4d0025380256:651ddd2ab1c64d001e4a44f8"
}
```