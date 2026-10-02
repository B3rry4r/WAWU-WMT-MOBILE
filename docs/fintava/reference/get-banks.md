---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Get Bank List

This endpoint give you a list of all the banks supported by Fintava.

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
    "/banks": {
      "get": {
        "summary": "Get Bank List",
        "description": "This endpoint give you a list of all the banks supported by Fintava.",
        "operationId": "get-banks",
        "parameters": [
          {
            "name": "order",
            "in": "query",
            "description": "This is the order you want the bank list to appear. It can be in ascendingor descending order. The values are represented as ASC and DESC",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "searchTerm",
            "in": "query",
            "description": "You can search for a bank by using the bank name. To search by name, input the bank's name. E.g Access",
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
                    "value": "{\n  \"status\": 200,\n  \"message\": \"bank lists fetched successfully\",\n  \"data\": [\n    {\n      \"id\": \"97ec2202-f3b2-4841-aef2-173f917d18cb\",\n      \"createdAt\": \"2023-10-13T19:00:00.933Z\",\n      \"updatedAt\": \"2023-10-13T19:00:00.933Z\",\n      \"code\": \"000013\",\n      \"name\": \"GTBANK PLC\"\n    }\n  ]\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "bank lists fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string",
                            "example": "97ec2202-f3b2-4841-aef2-173f917d18cb"
                          },
                          "createdAt": {
                            "type": "string",
                            "example": "2023-10-13T19:00:00.933Z"
                          },
                          "updatedAt": {
                            "type": "string",
                            "example": "2023-10-13T19:00:00.933Z"
                          },
                          "code": {
                            "type": "string",
                            "example": "000013"
                          },
                          "name": {
                            "type": "string",
                            "example": "GTBANK PLC"
                          }
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
  "_id": "650ef5d3cd3e4d0025380256:650f7b231da7bb000c6ce75b"
}
```