---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Change Card PIN

Update Card PIN

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
    "/cards/update-pin": {
      "patch": {
        "summary": "Change Card PIN",
        "description": "Update Card PIN",
        "operationId": "change-card-pin",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "cardMapId": {
                    "type": "string",
                    "default": "2fa1d74d-adfd-43e2-aba6-f3df2c021e1c"
                  },
                  "expiryDate": {
                    "type": "string",
                    "default": "2601"
                  },
                  "cvv": {
                    "type": "string",
                    "default": "123"
                  },
                  "oldPin": {
                    "type": "string",
                    "default": "1234"
                  },
                  "newPin": {
                    "type": "string",
                    "default": "1290"
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
                    "value": "{statusCode: 200,\n message: \"Card Pin updated Succesfully\"}"
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
  "_id": "650ef5d3cd3e4d0025380256:697b39a674603a7d1ae9e18a"
}
```