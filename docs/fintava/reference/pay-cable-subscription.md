---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Buy cable subscription

This endpoint helps you purchase cable subscription from your preferred cable service provider.

> 📘 List cable service providers and get service\_code
>
> You can get a list of cable service providers and get their service\_code by running the [List cable subscriptions endpoint](https://fintava.readme.io/reference/get-cable-subscription-plans-by-name)

When we search for DSTV subscription plans, for example, here's the sample response. the service\_code is represented as code. The first code in this sample response is "48"

```
{
  "data": [
    {
      "id": "80d76af9-5856-4a06-b2fa-b2519172e135",
      "createdAt": "2023-09-21T13:13:05.166Z",
      "updatedAt": "2023-09-21T13:13:05.166Z",
      "title": "DStv Compact + Asia +Xtraview",
      "network": "DSTV",
      "price": "22300",
      "code": "48",
      "available": "Yes",
      "allowance": "COMPE36+ ASIADDE36 + HDPVRE36"
    },
    {
      "id": "5b4c87c1-cc1e-40dd-a174-183ebf6ba545",
      "createdAt": "2023-09-21T13:13:06.864Z",
      "updatedAt": "2023-09-21T13:13:06.864Z",
      "title": "DStv Compact French Plus  (for Premium compact)",
      "network": "DSTV",
      "price": "22200",
      "code": "51",
      "available": "Yes",
      "allowance": "FRN15E36,COMPE36"
    },
    {
      
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
    "/billing/cable-subscription": {
      "post": {
        "summary": "Buy cable subscription",
        "description": "This endpoint helps you purchase cable subscription from your preferred cable service provider.",
        "operationId": "pay-cable-subscription",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "smartcard_number",
                  "tv_network",
                  "service_code"
                ],
                "properties": {
                  "smartcard_number": {
                    "type": "string",
                    "description": "The smartcard number. This is the number linked to a decoder."
                  },
                  "tv_network": {
                    "type": "string",
                    "description": "This is the cable service provider. Examples are DSTV and GOTV. See the information box to learn how to get a list of cable service providers."
                  },
                  "service_code": {
                    "type": "string",
                    "description": "Every cable service provider has a service code. See the information box to learn where to get it."
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
  "_id": "650ef5d3cd3e4d0025380256:651dde45720e7b000c43464c"
}
```