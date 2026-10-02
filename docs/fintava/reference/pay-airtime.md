---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Buy airtime

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
    "/billing/airtime": {
      "post": {
        "summary": "Buy airtime",
        "description": "",
        "operationId": "pay-airtime",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "vtu_network",
                  "vtu_amount",
                  "vtu_number"
                ],
                "properties": {
                  "vtu_network": {
                    "type": "string",
                    "description": "select network provider GLO, MTN, AIRTEL,9MOBILE"
                  },
                  "vtu_amount": {
                    "type": "integer",
                    "description": "How much is the airtime",
                    "format": "int32"
                  },
                  "vtu_number": {
                    "type": "string",
                    "description": "The mobile number the airtime will be paid to. Please, enter the 11 digit phone number. Example, 09036652198."
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
  "_id": "650ef5d3cd3e4d0025380256:651dda19feaf22000c7ee2ea"
}
```