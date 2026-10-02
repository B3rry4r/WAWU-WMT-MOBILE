---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Reissue Card

reissue card to customer

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
    "/cards/reissue": {
      "post": {
        "summary": "Reissue Card",
        "description": "reissue card to customer",
        "operationId": "reissue-card",
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
                    "default": "VERVE"
                  },
                  "cardName": {
                    "type": "string",
                    "default": "JOHN DOE"
                  },
                  "cardType": {
                    "type": "string",
                    "default": "DYNAMIC_CARD"
                  },
                  "accountNumber": {
                    "type": "string"
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
  "_id": "650ef5d3cd3e4d0025380256:674034958b93d800768fcc75"
}
```