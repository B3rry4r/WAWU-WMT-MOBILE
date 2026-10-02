# Cable TV: providers, plans, purchase

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 11 (bills; cable listed in the OPS-02 prompt). Result: **lists ran (HTTP 200); purchase NOT RUN (HTTP 403)**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Providers: **only `GOTV` and `DSTV`** (`name` field). No StarTimes.
- Plans: GOTV 7, DSTV 35. Fields: `id`, `createdAt`, `updatedAt`, `title`,
  `network`, `price` (**string**), `code` (the `service_code`), `available`
  (`"Yes"`/`"No"`), `allowance`. The cheapest are DStv Box Office ₦900 and
  GOtv Lite ₦1,200.
- The plan path is **case-sensitive**: `gotv` is a 404, `GOTV` works. Use the
  `name` exactly as the provider list returns it.
- Purchase: Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited. Tried DStv Box Office (₦900) to a made-up smartcard.
  There is no amount in the request: the plan code sets the price. Whether a
  smartcard is validated before payment, and how, is unknown (no preview
  endpoint is documented for cable).

## Requests and responses

### GET /cable-service-name

Sent 2026-10-02 08:28:48 UTC, answered in 0.22 s.

```http
GET /api/dev/cable-service-name
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:49 GMT
content-type: application/json; charset=utf-8
content-length: 322
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"142-pLYrSZlJIlw4A01+e5mtZkJD37c"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "06f3e9a5-cfd0-4bae-8210-02a97e8b5ae6",
      "createdAt": "2023-10-10T11:43:03.796Z",
      "updatedAt": "2023-10-10T11:43:03.796Z",
      "name": "GOTV"
    },
    {
      "id": "e34e8d3e-8df7-4e53-9582-67529ba82632",
      "createdAt": "2023-10-10T11:43:03.796Z",
      "updatedAt": "2023-10-10T11:43:03.796Z",
      "name": "DSTV"
    }
  ],
  "status": 200,
  "message": "successful"
}
```

### GET /cable-service-name/GOTV

Sent 2026-10-02 08:29:34 UTC, answered in 0.58 s.

```http
GET /api/dev/cable-service-name/GOTV
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:29:34 GMT
content-type: application/json; charset=utf-8
content-length: 1694
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"69e-SJfFyjnniq8bh8TOIktWvRm1p4I"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "39685b1c-66c7-4016-9796-7eb05dadce23",
      "createdAt": "2023-10-10T20:00:00.861Z",
      "updatedAt": "2023-10-10T20:00:00.861Z",
      "title": "GOtv Max",
      "network": "GOTV",
      "price": "4950",
      "code": "78",
      "available": "Yes",
      "allowance": "GOTVMAX"
    },
    {
      "id": "b7c9dd51-4084-4698-86b2-a85c0894e1c8",
      "createdAt": "2023-10-10T20:00:00.868Z",
      "updatedAt": "2023-10-10T20:00:00.868Z",
      "title": "GOtv Lite Quarterly",
      "network": "GOTV",
      "price": "3000",
      "code": "88",
      "available": "Yes",
      "allowance": "GOLITE"
    },
    {
      "id": "d457b852-ae75-4e26-94d0-b24f3b8134ad",
      "createdAt": "2023-10-10T20:00:00.873Z",
      "updatedAt": "2023-10-10T20:00:00.873Z",
      "title": "GOtv Jinja Bouquet",
      "network": "GOTV",
      "price": "2350",
      "code": "89",
      "available": "Yes",
      "allowance": "GOTVNJ1"
    },
    {
      "id": "125ea9b7-8079-4037-b805-b885123e543c",
      "createdAt": "2023-10-10T20:00:00.879Z",
      "updatedAt": "2023-10-10T20:00:00.879Z",
      "title": "GOtv Jolli Bouquet",
      "network": "GOTV",
      "price": "3400",
      "code": "90",
      "available": "Yes",
      "allowance": "GOTVNJ2"
    },
    {
      "id": "3abe32d7-2733-4542-b4f1-b6a34aabb319",
      "createdAt": "2023-10-10T20:00:00.883Z",
      "updatedAt": "2023-10-10T20:00:00.883Z",
      "title": "GOtv Lite",
      "network": "GOTV",
      "price": "1200",
      "code": "91",
      "available": "Yes",
      "allowance": "GOLITE"
    },
    {
      "id": "5bac499f-53b2-4b43-bb2e-6d80404845e8",
      "createdAt": "2023-10-10T20:00:00.889Z",
      "updatedAt": "2023-10-10T20:00:00.889Z",
      "title": "GOtv Lite (Annual)",
      "network": "GOTV",
      "price": "8700",
      "code": "98",
      "available": "Yes",
      "allowance": "GOLITE"
    },
    {
      "id": "2c17efe2-6746-4e5f-ad09-52501e04557d",
      "createdAt": "2023-10-10T20:00:00.897Z",
      "updatedAt": "2023-10-10T20:00:00.897Z",
      "title": "GOTV Supa",
      "network": "GOTV",
      "price": "6500",
      "code": "110",
      "available": "Yes",
      "allowance": "GOTVSUPA"
    }
  ],
  "status": 200,
  "message": "Cable subscriptions fetched"
}
```

### GET /cable-service-name/DSTV

Sent 2026-10-02 08:29:34 UTC, answered in 0.50 s.

```http
GET /api/dev/cable-service-name/DSTV
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:29:35 GMT
content-type: application/json; charset=utf-8
content-length: 8874
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"22aa-zGgT/2zJOca3uWnLIcXvK1O2hgU"
cf-cache-status: DYNAMIC
```

`data` holds 35 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Cable subscriptions fetched"
}
```

<details><summary>All 35 entries</summary>

```json
{"id": "ac43a9a5-09b1-4628-bcf3-c1290774e7f3", "createdAt": "2023-10-10T20:00:00.817Z", "updatedAt": "2023-10-10T20:00:00.817Z", "title": "DStv Compact + Asia +Xtraview", "network": "DSTV", "price": "22300", "code": "48", "available": "Yes", "allowance": "COMPE36+ ASIADDE36 + HDPVRE36"}
{"id": "b98ceeac-f5bc-412b-870a-d7e208cfa256", "createdAt": "2023-10-10T20:00:00.823Z", "updatedAt": "2023-10-10T20:00:00.823Z", "title": "DStv Compact French Plus  (for Premium compact)", "network": "DSTV", "price": "22200", "code": "51", "available": "Yes", "allowance": "FRN15E36,COMPE36"}
{"id": "ae22cdba-ff56-40e7-94ed-3646c107378f", "createdAt": "2023-10-10T20:00:00.833Z", "updatedAt": "2023-10-10T20:00:00.833Z", "title": "DStv Compact French Touch", "network": "DSTV", "price": "13900", "code": "52", "available": "Yes", "allowance": "FRN7E36,COMPE36"}
{"id": "d0132f39-69b5-430b-a1c4-7259a0ce1e90", "createdAt": "2023-10-10T20:00:00.842Z", "updatedAt": "2023-10-10T20:00:00.842Z", "title": "DStv Compact Plus Asian ", "network": "DSTV", "price": "25000", "code": "53", "available": "Yes", "allowance": "ASIADDE36,COMPE36"}
{"id": "a01367dd-ca38-4691-8cdd-8af31611fe01", "createdAt": "2023-10-10T20:00:00.847Z", "updatedAt": "2023-10-10T20:00:00.847Z", "title": "DStv Compact HDPVR/XtraView", "network": "DSTV", "price": "14000", "code": "54", "available": "Yes", "allowance": "HDPVRE36,COMPE36"}
{"id": "01998853-cde0-4886-bf87-fc77f7d3b9e2", "createdAt": "2023-10-10T20:00:00.858Z", "updatedAt": "2023-10-10T20:00:00.858Z", "title": "DStv Compact Plus French Plus(For Premium, Compact+ and Compact only)", "network": "DSTV", "price": "28300", "code": "55", "available": "Yes", "allowance": "FRN15E36,COMPLE36"}
{"id": "c57a341e-14ec-4d2e-854b-1c9e259878ae", "createdAt": "2023-10-10T20:00:00.864Z", "updatedAt": "2023-10-10T20:00:00.864Z", "title": "DStv Compact Plus French Touch", "network": "DSTV", "price": "20000", "code": "56", "available": "Yes", "allowance": "FRN7E36,COMPLE36"}
{"id": "d5542d1d-1ce0-400e-b654-39e843c32f96", "createdAt": "2023-10-10T20:00:00.870Z", "updatedAt": "2023-10-10T20:00:00.870Z", "title": "DStv Premium French Plus Extraview.", "network": "DSTV", "price": "40100", "code": "59", "available": "Yes", "allowance": "FRN15E36,PRWE36"}
{"id": "d8fdc5c0-5e61-4542-825e-5fd05ff8cb8f", "createdAt": "2023-10-10T20:00:00.877Z", "updatedAt": "2023-10-10T20:00:00.877Z", "title": "DSTV CompactPlus French +Xtraview", "network": "DSTV", "price": "26550", "code": "60", "available": "Yes", "allowance": "COMPLE36 + FRN15E36 + HDPVRE36"}
{"id": "6c10a240-e2a6-46f5-af24-d60ad31fe087", "createdAt": "2023-10-10T20:00:00.880Z", "updatedAt": "2023-10-10T20:00:00.880Z", "title": "DStv Premium Asian Add-on", "network": "DSTV", "price": "23600", "code": "61", "available": "Yes", "allowance": "ASIADDE36,PRWE36"}
{"id": "c5b48e4f-ef12-4aef-a726-059bb3d5c524", "createdAt": "2023-10-10T20:00:00.892Z", "updatedAt": "2023-10-10T20:00:00.892Z", "title": "DStv Premium HDPVR/XtraView", "network": "DSTV", "price": "28000", "code": "62", "available": "Yes", "allowance": "HDPVRE36,PRWE36"}
{"id": "6a64f8b9-e89e-433d-8079-ac734795bcda", "createdAt": "2023-10-10T20:00:00.895Z", "updatedAt": "2023-10-10T20:00:00.895Z", "title": "DStv Compact + French Touch +Xtraview", "network": "DSTV", "price": "17300", "code": "64", "available": "Yes", "allowance": "COMPE36 + FRN7E36 + HDPVRE36"}
{"id": "619fabeb-da29-4c53-b09e-9dbc13be499b", "createdAt": "2023-10-10T20:00:00.899Z", "updatedAt": "2023-10-10T20:00:00.899Z", "title": "DStv Premium Asia HDPVR/XtraView", "network": "DSTV", "price": "36300", "code": "65", "available": "Yes", "allowance": "PRWASIE36,HDPVRE36"}
{"id": "da43f776-88b5-4706-b15f-6986f45f0455", "createdAt": "2023-10-10T20:00:00.903Z", "updatedAt": "2023-10-10T20:00:00.903Z", "title": "Asian Bouqet HDPVR/XtraView", "network": "DSTV", "price": "8800", "code": "66", "available": "Yes", "allowance": "HDPVRE36,ASIAE36"}
{"id": "d473d9b0-ff7b-47a2-80a4-6bdb0115ee54", "createdAt": "2023-10-10T20:00:00.906Z", "updatedAt": "2023-10-10T20:00:00.906Z", "title": "DStv Compact", "network": "DSTV", "price": "10600", "code": "72", "available": "Yes", "allowance": "COMPE36"}
{"id": "533c24ba-8c89-447d-a582-dad8e4b8c402", "createdAt": "2023-10-10T20:00:00.908Z", "updatedAt": "2023-10-10T20:00:00.908Z", "title": "DStv Compact Plus", "network": "DSTV", "price": "16700", "code": "73", "available": "Yes", "allowance": "COMPLE36"}
{"id": "e63ecc8c-a3a7-4c0e-870e-51426686a02b", "createdAt": "2023-10-10T20:00:00.909Z", "updatedAt": "2023-10-10T20:00:00.909Z", "title": "DStv Premium", "network": "DSTV", "price": "24600", "code": "74", "available": "Yes", "allowance": "PRWE36"}
{"id": "d13be1a2-9ca2-4cd4-8512-9a967d2b1fda", "createdAt": "2023-10-10T20:00:00.911Z", "updatedAt": "2023-10-10T20:00:00.911Z", "title": "DStv Premium Asia", "network": "DSTV", "price": "27600", "code": "75", "available": "Yes", "allowance": "PRWASIE36"}
{"id": "8a46d6a8-226f-405e-b52c-d09c841aab94", "createdAt": "2023-10-10T20:00:00.913Z", "updatedAt": "2023-10-10T20:00:00.913Z", "title": "Asian Bouqet Add on", "network": "DSTV", "price": "8400", "code": "84", "available": "Yes", "allowance": "ASIAE36"}
{"id": "c7ff203a-c338-4909-b40a-44995177a9cc", "createdAt": "2023-10-10T20:00:00.915Z", "updatedAt": "2023-10-10T20:00:00.915Z", "title": "DStv Yanga Bouquet E36", "network": "DSTV", "price": "3600", "code": "85", "available": "Yes", "allowance": "NNJ1E36"}
{"id": "cad6c07a-c83a-416a-a555-25f97e1a85ce", "createdAt": "2023-10-10T20:00:00.917Z", "updatedAt": "2023-10-10T20:00:00.917Z", "title": "DStv Confam Bouquet E36", "network": "DSTV", "price": "6300", "code": "86", "available": "Yes", "allowance": "NNJ2E36"}
{"id": "c367f4eb-954f-47ef-afba-16bb621e3be9", "createdAt": "2023-10-10T20:00:00.919Z", "updatedAt": "2023-10-10T20:00:00.919Z", "title": "DStv Padi", "network": "DSTV", "price": "2600", "code": "92", "available": "Yes", "allowance": "NLTESE36"}
{"id": "719da199-73c3-4909-b78a-4b40c981eb45", "createdAt": "2023-10-10T20:00:00.921Z", "updatedAt": "2023-10-10T20:00:00.921Z", "title": "DStv Great Wall Standalone Bouquet", "network": "DSTV", "price": "2150", "code": "93", "available": "Yes", "allowance": "GWALLE36"}
{"id": "8f8fbda1-2077-4c4f-8efe-52b92b87bafa", "createdAt": "2023-10-10T20:00:00.923Z", "updatedAt": "2023-10-10T20:00:00.923Z", "title": "Dstv Confam + Xtraview", "network": "DSTV", "price": "9700", "code": "94", "available": "Yes", "allowance": "NNJ2E36,HDPVRE36"}
{"id": "f88b0c56-4901-4eeb-a4f1-ea4dd718a1bc", "createdAt": "2023-10-10T20:00:00.925Z", "updatedAt": "2023-10-10T20:00:00.925Z", "title": "DStv Yanga + Xtraview", "network": "DSTV", "price": "7000", "code": "95", "available": "Yes", "allowance": "NNJ1E36,HDPVRE36"}
{"id": "09f36a0d-2d0d-468f-8f08-e28d5e9be46b", "createdAt": "2023-10-10T20:00:00.927Z", "updatedAt": "2023-10-10T20:00:00.927Z", "title": "DStv Padi + Xtraview", "network": "DSTV", "price": "6000", "code": "96", "available": "Yes", "allowance": "NLTESE36,HDPVRE36"}
{"id": "e4abe16f-d950-489a-a816-cd16b80736c2", "createdAt": "2023-10-10T20:00:00.929Z", "updatedAt": "2023-10-10T20:00:00.929Z", "title": "DStv Box Office", "network": "DSTV", "price": "900", "code": "97", "available": "Yes", "allowance": ""}
{"id": "17776fdc-916e-4651-aeae-420dee7b87d9", "createdAt": "2023-10-10T20:00:00.931Z", "updatedAt": "2023-10-10T20:00:00.931Z", "title": "HDPVR Access Service E36 DSTV ", "network": "DSTV", "price": "3500", "code": "99", "available": "Yes", "allowance": "HDPVRE36"}
{"id": "33c3c89a-d38a-40e1-be45-a25c65cd3d1a", "createdAt": "2023-10-10T20:00:00.933Z", "updatedAt": "2023-10-10T20:00:00.933Z", "title": "Add-on-French 11 Bouquet E36", "network": "DSTV", "price": "5250", "code": "100", "available": "Yes", "allowance": "FRN11E36 "}
{"id": "cf981ead-9b28-465b-9d53-aa55227c887b", "createdAt": "2023-10-10T20:00:00.935Z", "updatedAt": "2023-10-10T20:00:00.935Z", "title": "Add-on DStv French Touch Add-on Bouquet E36", "network": "DSTV", "price": "3400", "code": "102", "available": "Yes", "allowance": "FRN7E36,COMPLE36"}
{"id": "91913b7e-7af8-436c-a8fa-49ee3af01bcf", "createdAt": "2023-10-10T20:00:00.937Z", "updatedAt": "2023-10-10T20:00:00.937Z", "title": "Add-on DStv HDPVR/Xtraview Service E36 ", "network": "DSTV", "price": "3000", "code": "104", "available": "Yes", "allowance": "HDPVRE36"}
{"id": "9921c83f-2384-486b-9288-39f9ed1ff715", "createdAt": "2023-10-10T20:00:00.938Z", "updatedAt": "2023-10-10T20:00:00.938Z", "title": "French Plus Add-on", "network": "DSTV", "price": "11700", "code": "105", "available": "Yes", "allowance": "FRN15E36,COMPLE36"}
{"id": "60d51d6f-ac9e-401f-ae4e-77e246b48206", "createdAt": "2023-10-10T20:00:00.940Z", "updatedAt": "2023-10-10T20:00:00.940Z", "title": "Asian Bouqet", "network": "DSTV", "price": "8400", "code": "111", "available": "Yes", "allowance": "ASIAE36"}
{"id": "d8d4b8a8-139c-494a-bc00-d7ad3b120852", "createdAt": "2023-10-10T20:00:00.942Z", "updatedAt": "2023-10-10T20:00:00.942Z", "title": "Padi", "network": "DSTV", "price": "2600", "code": "112", "available": "Yes", "allowance": "NLTESE36"}
{"id": "5efab08f-aed3-452a-82a2-2ac40ea3b3ab", "createdAt": "2023-10-10T20:00:00.944Z", "updatedAt": "2023-10-10T20:00:00.944Z", "title": "DStv Premium French", "network": "DSTV", "price": "36700", "code": "113", "available": "Yes", "allowance": "PRWFRNSE36"}
```

</details>

### Lower case: gotv

Sent 2026-10-02 08:38:10 UTC, answered in 0.19 s.

```http
GET /api/dev/cable-service-name/gotv
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:38:11 GMT
content-type: application/json; charset=utf-8
content-length: 164
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a4-5MdLdcgjMcB2jz5OQbU40KeSaMo"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:38:11.038Z",
  "message": [
    "No subscribtion associated with this network was found"
  ],
  "path": "/api/dev/cable-service-name/gotv"
}
```

### POST /billing/cable-subscription, DStv Box Office

Sent 2026-10-02 08:30:17 UTC, answered in 0.22 s.

```http
POST /api/dev/billing/cable-subscription
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "smartcard_number": "1212121212",
  "tv_network": "DSTV",
  "service_code": "97"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:17 GMT
content-type: application/json; charset=utf-8
content-length: 135
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"87-d4Pprgg7eZX/tHXfP066o/iMUfk"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:17.371Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/billing/cable-subscription"
}
```
