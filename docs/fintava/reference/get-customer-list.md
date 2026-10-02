---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Get customer list

This endpoint will get you the list of all the customers that belong to a merchant

> 📘 startDate and endDate
>
> This parameters allow you to indicate the information you want to see within a certain time period. For example, if your your **startDate is 2022-10-15 **and your \***\*endDate is 2023-03-05** Then you'll see information between October 15, 2022 and March 5, 20203.

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
    "/customers/list": {
      "get": {
        "summary": "Get customer list",
        "description": "This endpoint will get you the list of all the customers that belong to a merchant",
        "operationId": "get-customer-list",
        "parameters": [
          {
            "name": "order",
            "in": "query",
            "description": "The list can come in two orders. Latest to oldest (ASC) or oldest to latest (DESC))",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "searchTerm",
            "in": "query",
            "description": "You can search for customers with particular name. Example, all customers that bear John",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "description": "Search customers that were created at the beginning of a certain date. It should follow format — YYYY-MM-DD",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "description": "Search customers that were created at the end of a certain date. It should follow format — YYYY-MM-DD",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Specify which page of the customer list you want displayed.",
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 1
            }
          },
          {
            "name": "take",
            "in": "query",
            "description": "How many customers should be displayed in a page. For example, you can request for 100 customers to be displayed in a page.",
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
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
  "_id": "650ef5d3cd3e4d0025380256:650f353bcd3e4d00253a50ec"
}
```