---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# List data bundles

This endpoint returns the data bundles offered by mobile network provider.

> 📘 List data bundles of which mobile network provider?
>
> There are many mobile network providers that offer data bundles with varying prices and size. To get a list of mobile network providers supported by Fintava, simply run the List network provider API.

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
    "/billing/data-bundles/{name}": {
      "get": {
        "summary": "List data bundles",
        "description": "This endpoint returns the data bundles offered by mobile network provider.",
        "operationId": "list-data-bundles",
        "parameters": [
          {
            "name": "name",
            "in": "path",
            "description": "The name of the mobile network you want to purchase the data bundle from. Example, Airtel, Mtn. See the information box above to learn how to get a list of mobile networks supported by Fintava.",
            "schema": {
              "type": "string"
            },
            "required": true
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
  "_id": "650ef5d3cd3e4d0025380256:651de010fcdacd000bcb175f"
}
```