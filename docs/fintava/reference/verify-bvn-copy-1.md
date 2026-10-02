---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Verify BVN Selfie

This endpoint verifies a customer BVN with a selfie.

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
    "/compliance/verify/bvn/selfie": {
      "post": {
        "summary": "Verify BVN Selfie",
        "description": "This endpoint verifies a customer BVN with a selfie.",
        "operationId": "verify-bvn-copy-1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "image",
                  "bvn"
                ],
                "properties": {
                  "image": {
                    "type": "string",
                    "description": "Enter the base64 string of the image to be verified. Encode the image and pass the string."
                  },
                  "bvn": {
                    "type": "string",
                    "description": "The bank verification number (BVN)"
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
  "_id": "650ef5d3cd3e4d0025380256:65100a55571ad90062edd616"
}
```