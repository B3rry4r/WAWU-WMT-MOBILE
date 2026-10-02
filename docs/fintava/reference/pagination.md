---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Pagination

Fintava list endpoints use pagination to return large collections of records in smaller pages.

Paginated endpoints generally use page to specify the page to retrieve and take to specify the number of records to return per page.

Page numbering starts from 1. The default value of take may vary by endpoint, so always check the individual endpoint documentation for its supported pagination parameters and defaults.

A maximum of 100 records can be requested at once.

| Parameter | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `page`    | The page number to retrieve. Page numbering starts from `1`.                |
| `take`    | The number of records to return per page. The default may vary by endpoint. |

```Text javascript
{
data:  [
{ ......... }
{ ......... }
{ ......... }
  ],
  "meta": {
    "page": "1",
    "take": "10",
    "itemCount": 363,
    "pageCount": 37,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}

```