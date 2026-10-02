---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Authentication

Fintava API uses API keys to authenticate requests. You can view and manage your API keys from the Fintava Dashboard.

> 📘 Keep your API keys safe
>
> Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.

All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.

## Authentication header

Include your API key in the `Authorization` header of every authenticated request using the Bearer scheme.

```http
Authorization: Bearer YOUR_API_KEY

 
```