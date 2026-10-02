---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Create Customer

This endpoint helps you create new customers. The parameters needed are the customer's personal data and the funding method. See the information section in this endpoint to get more insight on what that means

> 📘 What does funding method mean?
>
> Funding method can either be Static or Dynamic (STATIC\_FUND) (DYNAMIC\_FUND)
>
> Static: This is similar to a bank account. Once the account is funded, the funds stay in the account until it is moved.
>
> Dynamic: This is a temporary method of receiving funds. Once credited, the funds are moved to the merchant's account.

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
    "/create/customer": {
      "post": {
        "summary": "Create Customer",
        "description": "This endpoint helps you create new customers. The parameters needed are the customer's personal data and the funding method. See the information section in this endpoint to get more insight on what that means",
        "operationId": "create",
        "parameters": [
          {
            "name": "Authorization",
            "in": "header",
            "description": "The Authorization header takes Your Merchant ApiKey, Live Or Sandbox Apikey, depending on the environment you are working on. E.g \"Authorization: Bearer {{ApiKey}} \"",
            "schema": {
              "type": "string",
              "default": "Bearer Apikey"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "firstName",
                  "lastName",
                  "phoneNumber",
                  "email",
                  "fundingMethod",
                  "address",
                  "dateOfBirth",
                  "bvn",
                  "nin"
                ],
                "properties": {
                  "firstName": {
                    "type": "string",
                    "description": "Customer's first name"
                  },
                  "lastName": {
                    "type": "string",
                    "description": "Custromer's last name"
                  },
                  "phoneNumber": {
                    "type": "string",
                    "description": "Customer's phone number"
                  },
                  "email": {
                    "type": "string",
                    "description": "Customer's email"
                  },
                  "fundingMethod": {
                    "type": "string",
                    "description": "The funding method can be STATIC_FUND or  DYNAMIC_FUND. See the information box above this endpoint to learn more about funding methods"
                  },
                  "address": {
                    "type": "string",
                    "description": "Customer's address"
                  },
                  "dateOfBirth": {
                    "type": "string",
                    "description": "Customer's date of birth, it should follow this date format YYYY-MM-DD.",
                    "format": "date"
                  },
                  "bvn": {
                    "type": "string",
                    "description": "Customer's bank verification number"
                  },
                  "nin": {
                    "type": "string",
                    "description": "Customer's National Identification Number"
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
                    "value": "{\n  \"data\": {\n    \"userInfo\": {\n      \"firstName\": \"john\",\n      \"lastName\": \"doe\",\n      \"phoneNumber\": \"\",\n      \"roles\": [\n        \"USER\"\n      ],\n      \"userType\": \"CUSTOMER\",\n      \"address\": \"\",\n      \"bvn\": \"\",\n      \"dateOfBirth\": \"\",\n      \"id\": \"\",\n      \"createdAt\": \"\",\n      \"updatedAt\": \"\"\n    },\n    \"wallet\": {\n      \"id\": \"\",\n      \"accountNumber\": \"\",\n      \"accountName\": \"\",\n      \"isFrozen\": false,\n      \"status\": \"active\",\n      \"fundMethod\": \"\"\n    }\n  },\n  \"status\": 200,\n  \"message\": \"successful\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "userInfo": {
                          "type": "object",
                          "properties": {
                            "firstName": {
                              "type": "string",
                              "example": "john"
                            },
                            "lastName": {
                              "type": "string",
                              "example": "doe"
                            },
                            "phoneNumber": {
                              "type": "string",
                              "example": ""
                            },
                            "roles": {
                              "type": "array",
                              "items": {
                                "type": "string",
                                "example": "USER"
                              }
                            },
                            "userType": {
                              "type": "string",
                              "example": "CUSTOMER"
                            },
                            "address": {
                              "type": "string",
                              "example": ""
                            },
                            "bvn": {
                              "type": "string",
                              "example": ""
                            },
                            "dateOfBirth": {
                              "type": "string",
                              "example": ""
                            },
                            "id": {
                              "type": "string",
                              "example": ""
                            },
                            "createdAt": {
                              "type": "string",
                              "example": ""
                            },
                            "updatedAt": {
                              "type": "string",
                              "example": ""
                            }
                          }
                        },
                        "wallet": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "example": ""
                            },
                            "accountNumber": {
                              "type": "string",
                              "example": ""
                            },
                            "accountName": {
                              "type": "string",
                              "example": ""
                            },
                            "isFrozen": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            },
                            "status": {
                              "type": "string",
                              "example": "active"
                            },
                            "fundMethod": {
                              "type": "string",
                              "example": ""
                            }
                          }
                        }
                      }
                    },
                    "status": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "successful"
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
                    "value": "{\n    \"statusCode\": 400,\n    \"message\": [\n        \"firstName should not be empty\",\n        \"lastName should not be empty\",\n        \"phoneNumber must be a valid phone number\",\n        \"email must be an email\",\n        \"Invalid funding method\",\n        \"bvn must be longer than or equal to 11 characters\",\n        \"bvn must be a number string\",\n        \"dateOfBirth must be a valid ISO 8601 date string\",\n        \"address should not be empty\"\n    ],\n    \"error\": \"Bad Request\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "statusCode": {
                      "type": "integer",
                      "example": 400,
                      "default": 0
                    },
                    "message": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "example": "firstName should not be empty"
                      }
                    },
                    "error": {
                      "type": "string",
                      "example": "Bad Request"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "401",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"statusCode\": 401,\n  \"message\": \"Invalid API Key\",\n  \"error\": \"Unauthorized\"\n}"
                  }
                },
                "schema": {
                  "oneOf": [
                    {
                      "type": "object",
                      "properties": {
                        "statusCode": {
                          "type": "integer",
                          "example": 401,
                          "default": 0
                        },
                        "message": {
                          "type": "string",
                          "example": "API Key is required"
                        },
                        "error": {
                          "type": "string",
                          "example": "Unauthorized"
                        }
                      }
                    },
                    {
                      "type": "object",
                      "properties": {
                        "statusCode": {
                          "type": "integer",
                          "example": 401,
                          "default": 0
                        },
                        "message": {
                          "type": "string",
                          "example": "Invalid API Key"
                        },
                        "error": {
                          "type": "string",
                          "example": "Unauthorized"
                        }
                      }
                    }
                  ]
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
  "_id": "650ef5d3cd3e4d0025380256:650f03854d3a49002455b055"
}
```