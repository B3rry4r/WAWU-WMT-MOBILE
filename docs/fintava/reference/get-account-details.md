---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Get Account Details

Get the account information of external account number from other banks

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
    "/name/enquiry": {
      "get": {
        "summary": "Get Account Details",
        "description": "Get the account information of external account number from other banks",
        "operationId": "get-account-details",
        "parameters": [
          {
            "name": "accountNumber",
            "in": "query",
            "description": "The account number you wish to fetch the details",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "sortCode",
            "in": "query",
            "description": "sortCode of the bank , can be gotten from the get bank lists endpoint",
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
  "_id": "650ef5d3cd3e4d0025380256:657242b96cc5e9003f9fe8a3"
}
```