---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Buy data bundle

Use this endpoint to purchase data bundles from your preferred mobile network provider.

> 📘 Where's the data\_code?
>
> There's a data code for every data bundle. For example, the code for Airtel's 40 MB for 1 day is "55" To get this code, simply run the [List data bundles endpoint. ](https://fintava.readme.io/reference/list-data-bundles)

See a sample of the List data bundles endpoint. We searched for Airtel data bundles and the code for 40 MB for 1 day is "55"

```
  "data": [
    {
      "id": "4e7a1d2e-5cfe-4a4d-9016-abf82b6aaaf6",
      "createdAt": "2023-09-21T13:20:48.925Z",
      "updatedAt": "2023-09-21T13:20:48.925Z",
      "code": "55",
      "title": "Airtel D-MFIN-1-40MB for 1 day",
      "price": "50",
      "validity": "1 day"
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
    "/billing/data-bundle": {
      "post": {
        "summary": "Buy data bundle",
        "description": "Use this endpoint to purchase data bundles from your preferred mobile network provider.",
        "operationId": "pay-data-bundle",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "vtu_network",
                  "data_code",
                  "vtu_number"
                ],
                "properties": {
                  "vtu_network": {
                    "type": "string",
                    "description": "select network provider GLO, MTN, AIRTEL,9MOBILE"
                  },
                  "data_code": {
                    "type": "string",
                    "description": "This is the code of the data bundle you want to purchase. See the information box to learn how to get data_codes"
                  },
                  "vtu_number": {
                    "type": "string",
                    "description": "The mobile number purchasing the data bundle."
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
  "_id": "650ef5d3cd3e4d0025380256:651ddc2a15dd2f0012cef8bb"
}
```