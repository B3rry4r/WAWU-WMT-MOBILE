---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Get merchant transactions

This endpoint returns all the transactions that have been made by a merchant

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
    "/txn/merchant": {
      "get": {
        "summary": "Get merchant transactions",
        "description": "This endpoint returns all the transactions that have been made by a merchant",
        "operationId": "banks-copy",
        "parameters": [
          {
            "name": "order",
            "in": "query",
            "description": "This is the order you want the transaction to appear. It can be in ASC or DESC",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "description": "Indicate the start period of all the transactions you want to see. The format is YYY-MM-DD",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "description": "Indicate the end period of all the transactions you want to see. The format is YYYY-MM-DD",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "The list of transactions could come in many pages. Indicate the page you want to see.",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 1
            }
          },
          {
            "name": "take",
            "in": "query",
            "description": "How many transactions should be displayed per page.",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
            }
          },
          {
            "name": "type",
            "in": "query",
            "description": "Indicate the type of transactions you want to view. They can be DEBIT or CREDIT",
            "schema": {
              "type": "string",
              "default": "CREDIT"
            }
          },
          {
            "name": "status",
            "in": "query",
            "description": "Indicate whether you want failed or successful displayed. The values are indicated as success or failed",
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
                    "value": "{\n  \"data\": [\n    {\n      \"id\": \"dc2cd509-fdbb-4d37-ab18-c55edfbef8f3\",\n      \"createdAt\": \"2023-09-22T14:10:31.718Z\",\n      \"updatedAt\": \"2023-09-22T14:10:31.718Z\",\n      \"amount\": \"55.00\",\n      \"transType\": \"AIRTIME\",\n      \"entry\": \"DEBIT\",\n      \"reference\": \"bbc938a4-0d2f-4571-a532-8cce058fe87d\",\n      \"source\": \"\",\n      \"destination\": \"\",\n      \"narration\": \"AIRTIME\",\n      \"tagapayTransRef\": null,\n      \"TransRef\": null,\n      \"status\": \"SUCCESS\"\n    },\n    {\n      \"id\": \"9c20be90-d9f6-4e90-a619-049f55cc4cf6\",\n      \"createdAt\": \"2023-09-22T14:15:14.674Z\",\n      \"updatedAt\": \"2023-09-22T14:15:14.674Z\",\n      \"amount\": \"55.00\",\n      \"transType\": \"AIRTIME\",\n      \"entry\": \"DEBIT\",\n      \"reference\": \"7218a409-5e6a-4ac0-bce0-ad8900861a88\",\n      \"source\": \"\",\n      \"destination\": \"\",\n      \"narration\": \"AIRTIME\",\n      \"tagapayTransRef\": null,\n      \"TransRef\": null,\n      \"status\": \"SUCCESS\"\n    }\n  ],\n  \"meta\": {\n    \"page\": \"1\",\n    \"take\": \"10\",\n    \"itemCount\": 2,\n    \"pageCount\": 1,\n    \"hasPreviousPage\": false,\n    \"hasNextPage\": false\n  }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string",
                            "example": "dc2cd509-fdbb-4d37-ab18-c55edfbef8f3"
                          },
                          "createdAt": {
                            "type": "string",
                            "example": "2023-09-22T14:10:31.718Z"
                          },
                          "updatedAt": {
                            "type": "string",
                            "example": "2023-09-22T14:10:31.718Z"
                          },
                          "amount": {
                            "type": "string",
                            "example": "55.00"
                          },
                          "transType": {
                            "type": "string",
                            "example": "AIRTIME"
                          },
                          "entry": {
                            "type": "string",
                            "example": "DEBIT"
                          },
                          "reference": {
                            "type": "string",
                            "example": "bbc938a4-0d2f-4571-a532-8cce058fe87d"
                          },
                          "source": {
                            "type": "string",
                            "example": ""
                          },
                          "destination": {
                            "type": "string",
                            "example": ""
                          },
                          "narration": {
                            "type": "string",
                            "example": "AIRTIME"
                          },
                          "tagapayTransRef": {},
                          "TransRef": {},
                          "status": {
                            "type": "string",
                            "example": "SUCCESS"
                          }
                        }
                      }
                    },
                    "meta": {
                      "type": "object",
                      "properties": {
                        "page": {
                          "type": "string",
                          "example": "1"
                        },
                        "take": {
                          "type": "string",
                          "example": "10"
                        },
                        "itemCount": {
                          "type": "integer",
                          "example": 2,
                          "default": 0
                        },
                        "pageCount": {
                          "type": "integer",
                          "example": 1,
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
  "_id": "650ef5d3cd3e4d0025380256:650f7d101da7bb000c6cf111"
}
```