---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Send Sms

Merchants can use this endpoint to send SMS(s) to their customers.

> 🚧 All mobile numbers must include a country code
>
> Here's a sample: +2349036652198

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
    "/sms/send": {
      "post": {
        "summary": "Send Sms",
        "description": "Merchants can use this endpoint to send SMS(s) to their customers.",
        "operationId": "send-sms",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "to",
                  "sms"
                ],
                "properties": {
                  "to": {
                    "type": "string",
                    "description": "This the mobile number you want to send an SMS to. The number must include a country code. e.g. +2349036652198"
                  },
                  "sms": {
                    "type": "string",
                    "description": "The body of the message to be sent via sms."
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
  "_id": "650ef5d3cd3e4d0025380256:651000f13d6fc90067988f62"
}
```