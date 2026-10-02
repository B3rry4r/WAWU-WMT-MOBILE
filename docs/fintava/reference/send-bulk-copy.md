---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# SMS list

Get a list of all messages sent via SMS

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
    "/sms/list": {
      "get": {
        "summary": "SMS list",
        "description": "Get a list of all messages sent via SMS",
        "operationId": "send-bulk-copy",
        "parameters": [
          {
            "name": "order",
            "in": "query",
            "description": "The list can appear in ascending and descending order. The values are represented as ASC and DESC",
            "schema": {
              "type": "string",
              "default": "ASC"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Indicate the page you want listed. If you want page 2 for example, input 2 as the value",
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 1
            }
          },
          {
            "name": "take",
            "in": "query",
            "description": "Indicate how many SMS(s) would be displayed per page.",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
            }
          },
          {
            "name": "skip",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "default": "skip"
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
                    "value": "{\n  \"data\": [],\n  \"meta\": {\n    \"take\": \"10\",\n    \"itemCount\": 0,\n    \"pageCount\": 0,\n    \"hasPreviousPage\": false,\n    \"hasNextPage\": false\n  }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {}
                      }
                    },
                    "meta": {
                      "type": "object",
                      "properties": {
                        "take": {
                          "type": "string",
                          "example": "10"
                        },
                        "itemCount": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "pageCount": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "hasPreviousPage": {
                          "type": "boolean",
                          "example": false,
                          "default": true
                        },
                        "hasNextPage": {
                          "type": "boolean",
                          "example": false,
                          "default": true
                        }
                      }
                    }
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
  "_id": "650ef5d3cd3e4d0025380256:651002d081c284004c351005"
}
```