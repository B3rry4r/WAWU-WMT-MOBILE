---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Response codes

Here are status code you can encounter on Fintava and what they mean.

Fintava uses conventional HTTP response codes to indicate the success or failure of an API request. In general: Codes in the 2xx range indicate success. Codes in the 4xx range indicate an error that failed given the information provided (e.g., a required parameter was omitted, a charge failed, etc.). Codes in the 5xx range indicate an error with Finatava's servers, which rarely happen.

| Code                                    | Description                                                                       |
| :-------------------------------------- | :-------------------------------------------------------------------------------- |
| **200 - OK**                            | The endpoint worked as expected                                                   |
| **400 - Bad request**                   | The request was not acceptable. This could be due to a missing required parameter |
| **401 - Unauthorised**                  | The API key provided is wrong or invalid                                          |
| **402 - Unauthorized**                  | No valid API key was provided.                                                    |
| **403 - Forbidden**                     | The parameters were valid but the request failed.                                 |
| **404 - Not Found**                     | The requested resource doesn't exist.                                             |
| **429 - Too Many Requests**             | Too many requests hit the API too quickly.                                        |
| **500, 502, 503, 504 - Server Errors.** | This indicates something went wrong on Fintava's end.                             |