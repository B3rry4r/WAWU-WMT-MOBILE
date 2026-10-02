---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Link Card

Link card

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
    "/cards/link": {
      "patch": {
        "summary": "Link Card",
        "description": "Link card",
        "operationId": "link-card",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "cardMapId",
                  "cardPan"
                ],
                "properties": {
                  "cardMapId": {
                    "type": "string"
                  },
                  "cardPan": {
                    "type": "string"
                  },
                  "customerAccountNo": {
                    "type": "string",
                    "description": "Customer wallet number created by Merchant"
                  },
                  "userId": {
                    "type": "string",
                    "description": "Applicable when card type is STATIC_NO_ACCOUNT"
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
                    "value": "{ \n  statusCode: 200,\n  message: \"Card Linked Succesfully\"\n}"
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
  "_id": "650ef5d3cd3e4d0025380256:675b1933daf9a40018b09f12"
}
```