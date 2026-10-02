---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# List cable subscriptions

This endpoint will list the various cable subscription plans by the cable subscription services supported by Fintava.

> 📘 Which cable service providers are supported by Fintava
>
> To get a list of cable service providers supported by Fintava, simply run the [List cable service provider endpoint](https://fintava.readme.io/reference/cable-service-names-list)

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
    "/cable-service-name/{network}": {
      "get": {
        "summary": "List cable subscriptions",
        "description": "This endpoint will list the various cable subscription plans by the cable subscription services supported by Fintava.",
        "operationId": "get-cable-subscription-plans-by-name",
        "parameters": [
          {
            "name": "network",
            "in": "path",
            "description": "Enter the cable service provider whose plans you wish to see. You can get a list of cable service providers by running the \"List cable service provider endpoint. See info box to learn more.",
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
  "_id": "650ef5d3cd3e4d0025380256:651ddb9195615b0013e6780c"
}
```