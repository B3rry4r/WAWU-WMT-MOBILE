# GET /billing/discos: electricity companies

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 11 (electricity: list). Result: **ran, HTTP 200**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- 22 entries, `message: "Discos records fetched"`, no paging. Fields: `id`,
  `createdAt`, `updatedAt`, `code`, `description`, `minimum_value`,
  `maximum_value` (both **strings**), `is_available` (`"Yes"`/`"No"`).
- **Postpaid is listed**: `Eko_Postpaid`, `AEDC_Postpaid`, `PH_Disco`,
  `Jos_Disco_Postpaid` and others are separate codes. `naira-api.md` said
  "prepaid only"; that is corrected.
- **The minimum is not always ₦500**: `Eko_Prepaid` and `Jos_Disco` are
  ₦1,000, the Aba and most postpaid codes ₦900, Ibadan ₦0. Maximums run from
  ₦100,000 to ₦300,000,000. The app must read `minimum_value` and
  `maximum_value` per disco, never a fixed ₦500.
- `Kaduna_Electricity_Disco_Postpaid` is `is_available: "No"`: hide or
  disable those.
- Ikeja has two prepaid codes (`Ikeja_Electric_Bill_Payment` and
  `Ikeja_Token_Purchase`); which to use is a question for Fintava.

## Requests and responses

### GET /billing/discos

Sent 2026-10-02 08:28:48 UTC, answered in 0.26 s.

```http
GET /api/dev/billing/discos
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:48 GMT
content-type: application/json; charset=utf-8
content-length: 5832
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"16c8-sOmH/Gks0k+HWRRoMXJN4JgBmiU"
cf-cache-status: DYNAMIC
```

`data` holds 22 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Discos records fetched"
}
```

<details><summary>All 22 entries</summary>

```json
{"id": "26fa9a79-a339-4e3a-aebd-d3e0a52c5b29", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "AEDC", "description": "AEDC Prepaid", "minimum_value": "500", "maximum_value": "10000000", "is_available": "Yes"}
{"id": "c5f903df-b810-412a-a23d-83718053e04c", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Ikeja_Electric_Bill_Payment", "description": "Ikeja Electric Bill Payment", "minimum_value": "500", "maximum_value": "500000", "is_available": "Yes"}
{"id": "97b61c37-2224-4e0d-a710-5b262679574c", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Ikeja_Token_Purchase", "description": "Ikeja Token Purchase", "minimum_value": "500", "maximum_value": "500000", "is_available": "Yes"}
{"id": "212e8e56-93b4-456c-852c-720decb1742e", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Eko_Prepaid", "description": "Eko Prepaid", "minimum_value": "1000", "maximum_value": "500000", "is_available": "Yes"}
{"id": "9d2067c4-62a0-4a2e-aa5c-243255139e68", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Eko_Postpaid", "description": "Eko_Postpaid", "minimum_value": "900", "maximum_value": "300000000", "is_available": "Yes"}
{"id": "1de55912-7f07-4686-bb4f-781f1742c113", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Ibadan_Disco_Prepaid", "description": "Ibadan Disco Prepaid", "minimum_value": "0", "maximum_value": "1000000", "is_available": "Yes"}
{"id": "2eaf2418-a7d2-4856-a8e9-*******9254b", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Kano_Electricity_Disco", "description": "Kano Electricity DISCO", "minimum_value": "500", "maximum_value": "1000000", "is_available": "Yes"}
{"id": "0c77cdcd-d44a-4f56-a1b2-e337bb7d473b", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Kaduna_Electricity_Disco", "description": "Kaduna Electricity DISCO", "minimum_value": "500", "maximum_value": "100000", "is_available": "Yes"}
{"id": "85d7938a-3405-44ac-9355-074c8cfdce9d", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Jos_Disco", "description": "Jos Electricity Distribution", "minimum_value": "1000", "maximum_value": "5000000", "is_available": "Yes"}
{"id": "8f58712a-5baa-4f02-a800-b20937dc3808", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "BEDC", "description": "BEDC", "minimum_value": "500", "maximum_value": "500000", "is_available": "Yes"}
{"id": "9d34b077-1768-463c-bb81-eade6db23430", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "PhED_Electricity", "description": "Port Harcourt Electricity Distribution Prepaid", "minimum_value": "500", "maximum_value": "100000", "is_available": "Yes"}
{"id": "c483a92e-8077-4fb7-b723-767c96750f4f", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "PH_Disco", "description": "Port Harcourt Electricity Distribution Postpaid", "minimum_value": "900", "maximum_value": "100000", "is_available": "Yes"}
{"id": "16a9241c-edb1-473f-a362-06b3dada0f6c", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Kaduna_Electricity_Disco_Postpaid", "description": "Kaduna Electricity Disco Postpaid", "minimum_value": "900", "maximum_value": "5000000", "is_available": "No"}
{"id": "d6f10e48-dd4c-4e8f-9c6d-40e998f00eee", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "AEDC_Postpaid", "description": "AEDC Postpaid", "minimum_value": "900", "maximum_value": "21000000", "is_available": "Yes"}
{"id": "88987376-9022-4879-b305-81d38d45136a", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Jos_Disco_Postpaid", "description": "Jos Electricity Postpaid", "minimum_value": "1000", "maximum_value": "10000000", "is_available": "Yes"}
{"id": "07435e64-c2dd-4bf5-8325-a56afaa474d3", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Enugu_Electricity_Distribution_Prepaid", "description": "Enugu Electricity Distribution Prepaid", "minimum_value": "500", "maximum_value": "100000", "is_available": "Yes"}
{"id": "4b223720-7013-4388-82d3-5e0d250a7169", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Kano_Electricity_Disco_Postpaid", "description": "Kano Electricity Disco Postpaid", "minimum_value": "500", "maximum_value": "10000000", "is_available": "Yes"}
{"id": "2b59fc10-c043-498e-b108-6d69b35665ca", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Ibadan_Disco_Postpaid", "description": "Ibadan Disco Postpaid", "minimum_value": "0", "maximum_value": "10000000", "is_available": "Yes"}
{"id": "6bb8ef16-c269-4010-a63c-45c9d641da54", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Enugu_Electricity_Distribution_Postpaid", "description": "Enugu Electricity Distribution Postpaid", "minimum_value": "500", "maximum_value": "500000", "is_available": "Yes"}
{"id": "36f7f32a-a238-4fd1-92a8-f0a6f83352f6", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "BEDC_Postpaid", "description": "BEDC Postpaid", "minimum_value": "900", "maximum_value": "1000000", "is_available": "Yes"}
{"id": "0ee4e177-03f4-446e-8ce8-6dbab6164bca", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Aba_Power_Prepaid", "description": "Aba Power Prepaid", "minimum_value": "900", "maximum_value": "1000000", "is_available": "Yes"}
{"id": "78ce69e2-b2a7-4930-8385-3dd1dbdd4348", "createdAt": "2023-10-05T00:00:00.813Z", "updatedAt": "2023-10-05T00:00:00.813Z", "code": "Aba_Power_Postpaid", "description": "Aba Power Postpaid", "minimum_value": "900", "maximum_value": "1000000", "is_available": "Yes"}
```

</details>
