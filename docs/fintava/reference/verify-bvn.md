---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Verify Bvn

This endpoint verifies a customer's bank verification number (BVN

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
    "/compliance/verify/bvn": {
      "get": {
        "summary": "Verify Bvn",
        "description": "This endpoint verifies a customer's bank verification number (BVN",
        "operationId": "verify-bvn",
        "parameters": [
          {
            "name": "bvn",
            "in": "query",
            "description": "The customer's bank verification number.",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"data\": {\n    \"customer\": \"8b619eb6-9909-4727-8258-f7507e20637d\",\n    \"bvn\": \"12345678901\",\n    \"first_name\": \"string\",\n    \"middle_name\": \"string\",\n    \"last_name\": \"string\",\n    \"date_of_birth\": \"1992-10-04\",\n    \"phone_number1\": \"09012345678\",\n    \"gender\": \"Male\",\n    \"image\": \"string\"\n}"
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
                    "value": "{\n  \"statusCode\": 400,\n  \"message\": \"bvn: Invalid bvn supplied, \",\n  \"error\": \"Bad Request\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "statusCode": {
                      "type": "integer",
                      "example": 400,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "bvn: Invalid bvn supplied, "
                    },
                    "error": {
                      "type": "string",
                      "example": "Bad Request"
                    }
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
  "_id": "650ef5d3cd3e4d0025380256:6510079a145a990074d7c464"
}
```