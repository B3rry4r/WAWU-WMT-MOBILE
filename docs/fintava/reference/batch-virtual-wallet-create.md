---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Batch Virtual Wallet Create

Batch Virtual Wallet Create

```json json
 sample batch requests
{
"data":[
   {
  "customerName": "MTN Nigeria Limited",
  "expireTimeInMin":15,
  "merchantReference": "91000011HDG6HS383T39SJ2288",
  "description": "Pytmnet for bags of cement",
  "amount": 200,
  "phone": "08178222000",
  "email": "too@yahoo.com"
},
   {
  "customerName": "MTN Nigeria Limited",
  "expireTimeInMin":15,
  "merchantReference": "8000HD00000G5556HS383T39SJ22",
  "description": "Payment collection",
  "amount": 260,
  "phone": "08178222200",
  "email": "too@yahoo.com"
}, 
]        
}
```

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
    "/virtual-wallet/generate/batch": {
      "post": {
        "summary": "Batch Virtual Wallet Create",
        "description": "Batch Virtual Wallet Create",
        "operationId": "batch-virtual-wallet-create",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "data"
                ],
                "properties": {
                  "data": {
                    "type": "array"
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
  "_id": "650ef5d3cd3e4d0025380256:66ae5ad32f64cd001194df97"
}
```