---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Send bulk

This endpoint allows a merchants send SMS(s) to several customers at once.

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
    "/sms/send/bulk": {
      "post": {
        "summary": "Send bulk",
        "description": "This endpoint allows a merchants send SMS(s) to several customers at once.",
        "operationId": "send-copy",
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
                    "type": "array",
                    "description": "These are the mobile numbers the SMS(s) will be sent to. They must include the country code. Example, +2349036652198",
                    "items": {
                      "type": "string"
                    }
                  },
                  "sms": {
                    "type": "string",
                    "description": "This is the body of the message that'll be sent vi SMS."
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
  "_id": "650ef5d3cd3e4d0025380256:651001032c31c8001ecf373c"
}
```