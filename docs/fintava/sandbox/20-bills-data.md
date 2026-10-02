# GET /billing/data-bundles/{network} and POST /billing/data-bundle

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 11 (bills; data listed in the OPS-02 prompt). Result: **lists ran (HTTP 200); purchase NOT RUN (HTTP 403)**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Bundle lists work. The network name is **case-insensitive** (`MTN`, `mtn`,
  `Airtel` all work). **9mobile is `ETISALAT`**: `9MOBILE` and `9mobile` are
  `404 ["Provider '9MOBILE' not found."]`. The airtime and data docs say
  `9MOBILE`; for data that is wrong, and airtime is untested.
- Counts: MTN 53, AIRTEL 38, GLO 55, ETISALAT 14. Fields: `id`, `createdAt`,
  `updatedAt`, `code` (string, used as `data_code`), `title`, `price`
  (**string**, naira), `validity` (free text, sometimes repeating the title,
  sometimes with `\r\n`). Titles carry provider codes such as "MTN
  D-MFIN-5-307 for ...": the app should show a cleaned title.
- Codes are small numbers that overlap between networks (`"1"`, `"30"`), so
  a bundle is identified by network plus code.
- Purchase: Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited. Tried MTN code `30` (₦100) to a test number.

## Requests and responses

### GET /billing/data-bundles/MTN

Sent 2026-10-02 08:28:49 UTC, answered in 0.20 s.

```http
GET /api/dev/billing/data-bundles/MTN
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:49 GMT
content-type: application/json; charset=utf-8
content-length: 13814
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"35f6-LG15cO2TF5j2D7kyKZ6aTrFNvXU"
cf-cache-status: DYNAMIC
```

`data` holds 53 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Provider bundles fetched"
}
```

<details><summary>All 53 entries</summary>

```json
{"id": "9b1a9eec-44cd-46b5-9410-19652a676086", "createdAt": "2024-07-11T13:48:12.064Z", "updatedAt": "2024-07-11T13:48:12.064Z", "code": "1", "title": "MTN D-MFIN-5-Combo-97 for Xtradata 20000 Monthly Bundle", "price": "20000", "validity": "Xtradata 20000 Monthly Bundle"}
{"id": "7d1246b0-c643-4829-933d-94625580a3a0", "createdAt": "2024-07-11T13:48:12.335Z", "updatedAt": "2024-07-11T13:48:12.335Z", "code": "2", "title": "MTN D-MFIN-5-Combo-96 for Xtradata 15000 Monthly Bundle", "price": "15000", "validity": "Xtradata 15000 Monthly Bundle"}
{"id": "86e599a4-c4c1-44f5-a13f-*******8451a", "createdAt": "2024-07-11T13:48:12.637Z", "updatedAt": "2024-07-11T13:48:12.637Z", "code": "3", "title": "MTN D-MFIN-5-Combo-95 for Xtradata 10000 Monthly Bundle", "price": "10000", "validity": "Xtradata 10000 Monthly Bundle"}
{"id": "e77becd0-e481-4459-92a2-e6ea4ade7b09", "createdAt": "2024-07-11T13:48:13.420Z", "updatedAt": "2024-07-11T13:48:13.420Z", "code": "4", "title": "MTN D-MFIN-5-Combo-94 for Xtradata 5000 Monthly Bundle", "price": "5000", "validity": "Xtradata 5000 Monthly Bundle"}
{"id": "fab54f43-ceba-4603-af90-531dc119a511", "createdAt": "2024-07-11T13:48:13.704Z", "updatedAt": "2024-07-11T13:48:13.704Z", "code": "5", "title": "MTN D-MFIN-5-Combo-93 for Xtradata 2000 Monthly Bundle", "price": "2000", "validity": "Xtradata 2000 Monthly Bundle"}
{"id": "92e797be-e7ad-4ba1-be08-e175be6faf67", "createdAt": "2024-07-11T13:48:13.983Z", "updatedAt": "2024-07-11T13:48:13.983Z", "code": "6", "title": "MTN D-MFIN-5-Combo-92 for Xtradata 1000 Monthly Bundle", "price": "1000", "validity": "Xtradata 1000 Monthly Bundle"}
{"id": "5e11118c-d7b1-462e-b514-50b90ccc7bc7", "createdAt": "2024-07-11T13:48:14.383Z", "updatedAt": "2024-07-11T13:48:14.383Z", "code": "7", "title": "MTN D-MFIN-5-Combo-91 for Xtradata 500 Weekly Bundle", "price": "500", "validity": "Xtradata 500 Weekly Bundle"}
{"id": "fa0fb1e3-79bb-4cc4-a2f6-38d1685058a1", "createdAt": "2024-07-11T13:48:14.669Z", "updatedAt": "2024-07-11T13:48:14.669Z", "code": "8", "title": "MTN D-MFIN-5-Combo-89 for Xtratalk 20000 Monthly Bundle", "price": "20000", "validity": "Xtratalk 20000 Monthly Bundle"}
{"id": "60894222-204c-48ae-9196-f33395f55b6a", "createdAt": "2024-07-11T13:48:14.943Z", "updatedAt": "2024-07-11T13:48:14.943Z", "code": "9", "title": "MTN D-MFIN-5-Combo-88 for Xtratalk 15000 Monthly Bundle", "price": "15000", "validity": "Xtratalk 15000 Monthly Bundle"}
{"id": "39855624-dc72-44e2-855f-f001f730b6ff", "createdAt": "2024-07-11T13:48:15.324Z", "updatedAt": "2024-07-11T13:48:15.324Z", "code": "10", "title": "MTN D-MFIN-5-Combo-87 for Xtratalk 10000 Monthly Bundle", "price": "10000", "validity": "Xtratalk 10000 Monthly Bundle"}
{"id": "cf04e5a4-d7fa-4afe-9ed4-3b4b39930ab1", "createdAt": "2024-07-11T13:48:15.739Z", "updatedAt": "2024-07-11T13:48:15.739Z", "code": "11", "title": "MTN D-MFIN-5-Combo-86 for Xtratalk 5000 Monthly Bundle", "price": "5000", "validity": "Xtratalk 5000 Monthly Bundle"}
{"id": "aaa3e385-8270-4f11-b54d-0696b8d8b927", "createdAt": "2024-07-11T13:48:16.037Z", "updatedAt": "2024-07-11T13:48:16.037Z", "code": "12", "title": "MTN D-MFIN-5-Combo-85 for Xtratalk 2000 Monthly Bundle", "price": "2000", "validity": "Xtratalk 2000 Monthly Bundle"}
{"id": "625e30d9-292e-4368-8ee9-6075e70c1cbc", "createdAt": "2024-07-11T13:48:16.331Z", "updatedAt": "2024-07-11T13:48:16.331Z", "code": "13", "title": "MTN D-MFIN-5-Combo-84 for Xtratalk 1000 Monthly Bundle", "price": "1000", "validity": "Xtratalk 1000 Monthly Bundle"}
{"id": "3387fe31-38c7-4359-a943-b3b31e4aeff3", "createdAt": "2024-07-11T13:48:16.622Z", "updatedAt": "2024-07-11T13:48:16.622Z", "code": "14", "title": "MTN D-MFIN-5-Combo-83 for Xtratalk 500 Weekly Bundle", "price": "500", "validity": "Xtratalk 500 Weekly Bundle"}
{"id": "61560c5c-75f0-4a80-ab65-4f803ea3835d", "createdAt": "2024-07-11T13:48:17.039Z", "updatedAt": "2024-07-11T13:48:17.039Z", "code": "15", "title": "MTN D-MFIN-5-Combo-73 for Xtratalk 300 Weekly Bundle\r\nXtratalk 300 Weekly Bundle", "price": "300", "validity": "Xtratalk 300 Weekly Bundle\r\nXtratalk 300 Weekly Bundle"}
{"id": "4a9aedb1-c9d3-4551-8916-d3bfd2d819df", "createdAt": "2024-07-11T13:48:17.318Z", "updatedAt": "2024-07-11T13:48:17.318Z", "code": "16", "title": "MTN D-MFIN-5-Combo-1588 for Xtradata 300 Weekly Bundle", "price": "300", "validity": "Xtradata 300 Weekly Bundle"}
{"id": "8f392769-81ae-4005-b60b-4d67401054c8", "createdAt": "2024-07-11T13:48:17.616Z", "updatedAt": "2024-07-11T13:48:17.616Z", "code": "17", "title": "MTN D-MFIN-5-Combo-1587 for Xtratalk 200 3days Bundle\r\nXtratalk 200 3days Bundle", "price": "200", "validity": "Xtratalk 200 3days Bundle\r\nXtratalk 200 3days Bundle"}
{"id": "b8fa09ea-190c-4f8d-a7e8-3c87a8b8f246", "createdAt": "2024-07-11T13:48:17.904Z", "updatedAt": "2024-07-11T13:48:17.904Z", "code": "18", "title": "MTN D-MFIN-5-7GB-A for 7GB Weekly Bundle", "price": "2000", "validity": "7GB Weekly Bundle"}
{"id": "4ce34519-4bcb-4d3e-982d-6685a7f6ac51", "createdAt": "2024-07-11T13:48:18.197Z", "updatedAt": "2024-07-11T13:48:18.197Z", "code": "19", "title": "MTN D-MFIN-5-774 for 1TB SME 3-Months Plan", "price": "350000", "validity": "1TB SME 3-Months Plan"}
{"id": "f353e29c-8d02-4f08-8131-e4da5d31904c", "createdAt": "2024-07-11T13:48:18.485Z", "updatedAt": "2024-07-11T13:48:18.485Z", "code": "20", "title": "MTN D-MFIN-5-773 for 165GB SME 2-Months Plan", "price": "50000", "validity": "165GB SME 2-Months Plan"}
{"id": "99dfe0ac-b67b-4982-a531-363fb5ab48a9", "createdAt": "2024-07-11T13:48:18.891Z", "updatedAt": "2024-07-11T13:48:18.891Z", "code": "21", "title": "MTN D-MFIN-5-755 for 400GB Yearly Plan", "price": "120000", "validity": "400GB Yearly Plan"}
{"id": "f17135cf-02a0-4d05-84cc-a673d400e362", "createdAt": "2024-07-11T13:48:19.166Z", "updatedAt": "2024-07-11T13:48:19.166Z", "code": "22", "title": "MTN D-MFIN-5-746 for 120GB Monthly Plan + 80mins.", "price": "22000", "validity": "120GB Monthly Plan + 80mins."}
{"id": "9b72a77b-b035-47c5-8d1a-fa220383cf1b", "createdAt": "2024-07-11T13:48:19.565Z", "updatedAt": "2024-07-11T13:48:19.565Z", "code": "23", "title": "MTN D-MFIN-5-745 for 10GB+2GB YouTube Night+300MB YouTube Music + 20mins.", "price": "3500", "validity": "10GB+2GB YouTube Night+300MB YouTube Music + 20mins."}
{"id": "1171a742-ed27-4e5a-97a7-01713785d350", "createdAt": "2024-07-11T13:48:19.974Z", "updatedAt": "2024-07-11T13:48:19.974Z", "code": "24", "title": "MTN D-MFIN-5-744 for 8GB+2GB YouTube Night+200MB YouTube Music + 15mins.", "price": "3000", "validity": "8GB+2GB YouTube Night+200MB YouTube Music + 15mins."}
{"id": "4bc5adfe-a06b-4170-b64d-7ada62d9c0a7", "createdAt": "2024-07-11T13:48:20.264Z", "updatedAt": "2024-07-11T13:48:20.264Z", "code": "25", "title": "MTN D-MFIN-5-743 for 5GB Weekly Plan", "price": "1500", "validity": "5GB Weekly Plan"}
{"id": "b1729302-920f-4b0b-ad5e-333d1d6e6d35", "createdAt": "2024-07-11T13:48:20.547Z", "updatedAt": "2024-07-11T13:48:20.547Z", "code": "26", "title": "MTN D-MFIN-5-742 for 1GB Weekly Plan + FREE 1GB for YouTube and 100MB for YouTube Music + 5mins.", "price": "600", "validity": "1GB Weekly Plan + FREE 1GB for YouTube and 100MB for YouTube Music + 5mins."}
{"id": "8d230d39-4aeb-47f2-86ea-717f44d8e289", "createdAt": "2024-07-11T13:48:20.967Z", "updatedAt": "2024-07-11T13:48:20.967Z", "code": "27", "title": "MTN D-MFIN-5-600 for 2.5GB 2-Day Plan", "price": "600", "validity": "2.5GB 2-Day Plan"}
{"id": "7a9276ac-71da-49df-a8b1-f*******2780", "createdAt": "2024-07-11T13:48:21.243Z", "updatedAt": "2024-07-11T13:48:21.243Z", "code": "28", "title": "MTN D-MFIN-5-3GB-A for 3GB 2-Days Bundle", "price": "800", "validity": "3GB 2-Days Bundle"}
{"id": "37ce1462-7317-4e0b-a9ef-1193ea9c825a", "createdAt": "2024-07-11T13:48:21.543Z", "updatedAt": "2024-07-11T13:48:21.543Z", "code": "29", "title": "MTN D-MFIN-5-360GB for 360GB SME 3-Months Plan", "price": "100000", "validity": "360GB SME 3-Months Plan"}
{"id": "5433abc6-567a-4be7-ad5f-5f498be05452", "createdAt": "2024-07-11T13:48:21.944Z", "updatedAt": "2024-07-11T13:48:21.944Z", "code": "30", "title": "MTN D-MFIN-5-307 for DataPlan 100MB Daily", "price": "100", "validity": "DataPlan 100MB Daily"}
{"id": "f664412c-7870-499b-a3aa-49849e499291", "createdAt": "2024-07-11T13:48:22.223Z", "updatedAt": "2024-07-11T13:48:22.223Z", "code": "31", "title": "MTN D-MFIN-5-278 for 75GB Monthly Plan + 40mins.", "price": "16000", "validity": "75GB Monthly Plan + 40mins."}
{"id": "f64b1f18-ac81-49dd-b7dc-0f282a784859", "createdAt": "2024-07-11T13:48:22.613Z", "updatedAt": "2024-07-11T13:48:22.613Z", "code": "32", "title": "MTN D-MFIN-5-276 for 1GB Daily Plan + 3mins.", "price": "350", "validity": "1GB Daily Plan + 3mins."}
{"id": "07d370de-07e4-4d3b-8e9e-05d451ea406d", "createdAt": "2024-07-11T13:48:22.902Z", "updatedAt": "2024-07-11T13:48:22.902Z", "code": "33", "title": "MTN D-MFIN-5-212 for 25GB+2GB YouTube Night + 25mins.", "price": "6500", "validity": "25GB+2GB YouTube Night + 25mins."}
{"id": "0aba8f21-b6ba-478f-9e47-9ca764243a8f", "createdAt": "2024-07-11T13:48:23.185Z", "updatedAt": "2024-07-11T13:48:23.185Z", "code": "34", "title": "MTN D-MFIN-5-211 for 3GB+2GB YouTube Night+200MB YouTube Music + 5mins.", "price": "1600", "validity": "3GB+2GB YouTube Night+200MB YouTube Music + 5mins."}
{"id": "7aae67b5-f243-4425-a99f-19d04e427be5", "createdAt": "2024-07-11T13:48:23.465Z", "updatedAt": "2024-07-11T13:48:23.465Z", "code": "35", "title": "MTN D-MFIN-5-210 for 160GB 2-Month Plan", "price": "30000", "validity": "160GB 2-Month Plan"}
{"id": "83fd358c-0a05-40db-b0fe-efe63676e161", "createdAt": "2024-07-11T13:48:23.876Z", "updatedAt": "2024-07-11T13:48:23.876Z", "code": "36", "title": "MTN D-MFIN-5-204 for 1-Year Plan", "price": "450000", "validity": "1-Year Plan"}
{"id": "581859eb-e14c-49b4-8be8-c22d103d157a", "createdAt": "2024-07-11T13:48:24.167Z", "updatedAt": "2024-07-11T13:48:24.167Z", "code": "37", "title": "MTN D-MFIN-5-203 for 2.5TB Yearly Plan", "price": "250000", "validity": "2.5TB Yearly Plan"}
{"id": "1d4fd70a-12d5-460d-9255-7b39389a4953", "createdAt": "2024-07-11T13:48:24.444Z", "updatedAt": "2024-07-11T13:48:24.444Z", "code": "38", "title": "MTN D-MFIN-5-202 for 1 year Plan", "price": "100000", "validity": "1 year Plan"}
{"id": "faa71781-8dd9-4430-b53a-1e1601e02d5d", "createdAt": "2024-07-11T13:48:24.851Z", "updatedAt": "2024-07-11T13:48:24.851Z", "code": "39", "title": "MTN D-MFIN-5-201 for 600GB 3-Month Plan", "price": "75000", "validity": "600GB 3-Month Plan"}
{"id": "e3ef6808-2b0d-4523-8aec-17a950ece231", "createdAt": "2024-07-11T13:48:25.131Z", "updatedAt": "2024-07-11T13:48:25.131Z", "code": "40", "title": "MTN D-MFIN-5-200 for 400GB 3-Month Plan", "price": "50000", "validity": "400GB 3-Month Plan"}
{"id": "9f95017b-fd9d-4f59-8ab3-e638ef8d2fe5", "createdAt": "2024-07-11T13:48:25.414Z", "updatedAt": "2024-07-11T13:48:25.414Z", "code": "41", "title": "MTN D-MFIN-5-199 for 100GB 2-Month Plan", "price": "20000", "validity": "100GB 2-Month Plan"}
{"id": "b7163189-c8fb-464e-b80b-cee5f334a176", "createdAt": "2024-07-11T13:48:25.685Z", "updatedAt": "2024-07-11T13:48:25.685Z", "code": "42", "title": "MTN D-MFIN-5-198 for 40GB Monthly Plan + 40mins.", "price": "11000", "validity": "40GB Monthly Plan + 40mins."}
{"id": "926223d1-f284-470c-a10b-c238510d9747", "createdAt": "2024-07-11T13:48:26.097Z", "updatedAt": "2024-07-11T13:48:26.097Z", "code": "43", "title": "MTN D-MFIN-5-197 for 20GB+2GB YouTube Night+300MB YouTube Music + 25mins.", "price": "5500", "validity": "20GB+2GB YouTube Night+300MB YouTube Music + 25mins."}
{"id": "1fe248b2-6583-454b-83ec-9360d704402e", "createdAt": "2024-07-11T13:48:26.364Z", "updatedAt": "2024-07-11T13:48:26.364Z", "code": "44", "title": "MTN D-MFIN-5-196 for 12GB+2GB YouTube Night + 25mins.", "price": "4000", "validity": "12GB+2GB YouTube Night + 25mins."}
{"id": "e193bfdc-e684-4c49-8d25-00a850a39e40", "createdAt": "2024-07-11T13:48:26.655Z", "updatedAt": "2024-07-11T13:48:26.655Z", "code": "45", "title": "MTN D-MFIN-5-195 for 4GB+2GB YouTube Night+200MB YouTube Music + 10mins.", "price": "2000", "validity": "4GB+2GB YouTube Night+200MB YouTube Music + 10mins."}
{"id": "902fc977-7872-4b8f-b2a1-0b78f7fd23a0", "createdAt": "2024-07-11T13:48:26.934Z", "updatedAt": "2024-07-11T13:48:26.934Z", "code": "46", "title": "MTN D-MFIN-5-192 for Data Plan 200MB 3-Day Plan", "price": "200", "validity": "Data Plan 200MB 3-Day Plan"}
{"id": "e7b5d942-aebb-4519-924f-2a3104cb7c37", "createdAt": "2024-07-11T13:48:27.352Z", "updatedAt": "2024-07-11T13:48:27.352Z", "code": "47", "title": "MTN D-MFIN-5-15AD for 1.2GB Monthly Plan + FREE 2GB for YouTube and 200MB for YouTube Music + 5mins.", "price": "1000", "validity": "1.2GB Monthly Plan + FREE 2GB for YouTube and 200MB for YouTube Music + 5mins."}
{"id": "fe82f10a-4d86-4bd1-9193-9c2c85463d5a", "createdAt": "2024-07-11T13:48:27.638Z", "updatedAt": "2024-07-11T13:48:27.638Z", "code": "48", "title": "MTN D-MFIN-5-1596 for 27GB Monthly Plan + 25mins.", "price": "6500", "validity": "27GB Monthly Plan + 25mins."}
{"id": "61c77afc-729d-4224-8845-57b765934662", "createdAt": "2024-07-11T13:48:27.923Z", "updatedAt": "2024-07-11T13:48:27.923Z", "code": "49", "title": "MTN D-MFIN-5-1595 for 22GB Monthly Plan + 25mins.", "price": "5500", "validity": "22GB Monthly Plan + 25mins."}
{"id": "e57aaf69-c1ed-4e5a-9b00-58915a43f70e", "createdAt": "2024-07-11T13:48:28.383Z", "updatedAt": "2024-07-11T13:48:28.383Z", "code": "50", "title": "MTN D-MFIN-5-1594 for 13GB Monthly Plan + 25mins.", "price": "4000", "validity": "13GB Monthly Plan + 25mins."}
{"id": "043abe5a-97d3-4474-9ad6-f63f4e359095", "createdAt": "2024-07-11T13:48:28.790Z", "updatedAt": "2024-07-11T13:48:28.790Z", "code": "51", "title": "MTN D-MFIN-5-1593 for 11GB Monthly Plan + 20mins.", "price": "3500", "validity": "11GB Monthly Plan + 20mins."}
{"id": "1373a4f8-2b96-4657-80e3-df5e4ed45e6b", "createdAt": "2024-07-11T13:48:29.077Z", "updatedAt": "2024-07-11T13:48:29.077Z", "code": "52", "title": "MTN D-MFIN-5-153 for 1.5GB+2.4GB YouTube Night+3hr-200MB-YouTube Weekly + 5mins.", "price": "1200", "validity": "1.5GB+2.4GB YouTube Night+3hr-200MB-YouTube Weekly + 5mins."}
{"id": "749c03cb-844d-46b5-8ef0-567436e0b151", "createdAt": "2024-07-11T13:48:29.359Z", "updatedAt": "2024-07-11T13:48:29.359Z", "code": "53", "title": "MTN D-MFIN-5-13500 for 35GB SME Monthly Plan", "price": "13500", "validity": "35GB SME Monthly Plan"}
```

</details>

### GET /billing/data-bundles/AIRTEL

Sent 2026-10-02 08:29:35 UTC, answered in 0.24 s.

```http
GET /api/dev/billing/data-bundles/AIRTEL
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:29:35 GMT
content-type: application/json; charset=utf-8
content-length: 8849
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2291-/IxYCEEyvX+ucCVHz20VJtDYw/g"
cf-cache-status: DYNAMIC
```

`data` holds 38 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Provider bundles fetched"
}
```

<details><summary>All 38 entries</summary>

```json
{"id": "44a7ad34-4459-48b2-a8dc-6965c0874620", "createdAt": "2024-07-11T13:48:30.643Z", "updatedAt": "2024-07-11T13:48:30.643Z", "code": "54", "title": "Airtel D-MFIN-1-40MB for 1 day", "price": "50", "validity": "1 day"}
{"id": "3750850b-5eb5-418c-9772-6efd11306b31", "createdAt": "2024-07-11T13:48:31.045Z", "updatedAt": "2024-07-11T13:48:31.045Z", "code": "55", "title": "Airtel D-MFIN-1-100MB for 1 day", "price": "99", "validity": "1 day"}
{"id": "963e16e8-4a58-4d6b-bec2-92899cdfa8a1", "createdAt": "2024-07-11T13:48:31.443Z", "updatedAt": "2024-07-11T13:48:31.443Z", "code": "56", "title": "Airtel D-MFIN-1-200MB for 3 days", "price": "199", "validity": "3 days"}
{"id": "89ccd734-df11-4c95-97ae-8cc630c4976a", "createdAt": "2024-07-11T13:48:31.719Z", "updatedAt": "2024-07-11T13:48:31.719Z", "code": "57", "title": "Airtel D-MFIN-1-350MB for 7 days", "price": "349", "validity": "7 days"}
{"id": "eac951a5-f40c-492d-a61f-ce8d3cb348f7", "createdAt": "2024-07-11T13:48:32.004Z", "updatedAt": "2024-07-11T13:48:32.004Z", "code": "58", "title": "Airtel D-MFIN-1-750MB for 7 days", "price": "499", "validity": "7 days"}
{"id": "32772ca5-b0cf-428d-8617-610bc9ea23d8", "createdAt": "2024-07-11T13:48:32.285Z", "updatedAt": "2024-07-11T13:48:32.285Z", "code": "59", "title": "Airtel D-MFIN-1-1.5GB for 30 days", "price": "999", "validity": "30 days"}
{"id": "a1993caf-e10b-4233-84d5-84028bebba48", "createdAt": "2024-07-11T13:48:32.566Z", "updatedAt": "2024-07-11T13:48:32.566Z", "code": "60", "title": "Airtel D-MFIN-1-3GB for 30 days", "price": "1499", "validity": "30 days"}
{"id": "2e788eb7-c419-4129-92e8-af1dfbd16b7a", "createdAt": "2024-07-11T13:48:32.850Z", "updatedAt": "2024-07-11T13:48:32.850Z", "code": "61", "title": "Airtel D-MFIN-1-6GB for 30 days", "price": "2499", "validity": "30 days"}
{"id": "b77188a1-e589-47be-9c92-7cba85b29725", "createdAt": "2024-07-11T13:48:33.124Z", "updatedAt": "2024-07-11T13:48:33.124Z", "code": "62", "title": "Airtel D-MFIN-1-11GB for 30 days", "price": "3999", "validity": "30 days"}
{"id": "e96453b8-8b34-4b18-b073-e93296a7135c", "createdAt": "2024-07-11T13:48:33.404Z", "updatedAt": "2024-07-11T13:48:33.404Z", "code": "63", "title": "Airtel D-MFIN-1-20GB for 30 days", "price": "4999", "validity": "30 days"}
{"id": "8a207bd3-4b3b-47ea-b84c-e9fda9087899", "createdAt": "2024-07-11T13:48:33.692Z", "updatedAt": "2024-07-11T13:48:33.692Z", "code": "64", "title": "Airtel D-MFIN-1-40GB for 30 days", "price": "9999", "validity": "30 days"}
{"id": "b600e578-e994-45c3-8c01-d0db790007f0", "createdAt": "2024-07-11T13:48:33.963Z", "updatedAt": "2024-07-11T13:48:33.963Z", "code": "65", "title": "Airtel D-MFIN-1-75GB for 30 days", "price": "14999", "validity": "30 days"}
{"id": "9f683b6a-5dd3-41d2-8ed7-09511b3907a6", "createdAt": "2024-07-11T13:48:34.455Z", "updatedAt": "2024-07-11T13:48:34.455Z", "code": "66", "title": "Airtel D-MFIN-1-8GB for 30 days", "price": "2999", "validity": "30 days"}
{"id": "bb7acd41-7d8e-42c7-a66b-f11e14e2d6bb", "createdAt": "2024-07-11T13:48:34.786Z", "updatedAt": "2024-07-11T13:48:34.786Z", "code": "67", "title": "Airtel D-MFIN-1-120GB for 30 days", "price": "19999", "validity": "30 days"}
{"id": "f54ab6f2-251d-4dbd-a45d-8d7501e65c42", "createdAt": "2024-07-11T13:48:35.206Z", "updatedAt": "2024-07-11T13:48:35.206Z", "code": "68", "title": "Airtel D-MFIN-1-1GB1D for 1 day", "price": "349", "validity": "1 day"}
{"id": "a554aa9b-439b-47c9-824c-8927a7a42f28", "createdAt": "2024-07-11T13:48:35.583Z", "updatedAt": "2024-07-11T13:48:35.583Z", "code": "69", "title": "Airtel D-MFIN-1-2GB1D for 1 day", "price": "499", "validity": "1 day"}
{"id": "e430b081-321f-4685-b33b-af21b44f2455", "createdAt": "2024-07-11T13:48:36.011Z", "updatedAt": "2024-07-11T13:48:36.011Z", "code": "70", "title": "Airtel D-MFIN-1-6GB1W for 7 days", "price": "1499", "validity": "7 days"}
{"id": "6f2b158a-4430-41ee-b83b-264396be2869", "createdAt": "2024-07-11T13:48:36.303Z", "updatedAt": "2024-07-11T13:48:36.303Z", "code": "71", "title": "Airtel D-MFIN-1-2GB1M for 30 days", "price": "1199", "validity": "30 days"}
{"id": "15ea0f97-a140-4154-9af4-57f8451a166c", "createdAt": "2024-07-11T13:48:36.604Z", "updatedAt": "2024-07-11T13:48:36.604Z", "code": "72", "title": "Airtel D-MFIN-1-4.5GB for 30 days", "price": "1999", "validity": "30 days"}
{"id": "14e751a8-3401-48b1-a0ec-1d1c90f4af0d", "createdAt": "2024-07-11T13:48:37.046Z", "updatedAt": "2024-07-11T13:48:37.046Z", "code": "73", "title": "Airtel D-MFIN-1-25GB1M for 30 days", "price": "7999", "validity": "30 days"}
{"id": "59825958-27f3-46ff-9c83-776887db17df", "createdAt": "2024-07-11T13:48:37.495Z", "updatedAt": "2024-07-11T13:48:37.495Z", "code": "74", "title": "Airtel D-MFIN-1-200GB1M for 30 days", "price": "29999", "validity": "30 days"}
{"id": "3f9b6310-cb26-4178-9f90-bab92c9a4f6a", "createdAt": "2024-07-11T13:48:37.782Z", "updatedAt": "2024-07-11T13:48:37.782Z", "code": "75", "title": "Airtel D-MFIN-1-280GB1M for 30 days", "price": "35999", "validity": "30 days"}
{"id": "0ed61762-2ddb-4f0a-aef8-90fee1e97b86", "createdAt": "2024-07-11T13:48:38.064Z", "updatedAt": "2024-07-11T13:48:38.064Z", "code": "76", "title": "Airtel D-MFIN-1-400GB3M for 90 days", "price": "49999", "validity": "90 days"}
{"id": "7a8bea3a-5522-4d56-9508-0642289525cd", "createdAt": "2024-07-11T13:48:38.509Z", "updatedAt": "2024-07-11T13:48:38.509Z", "code": "77", "title": "Airtel D-MFIN-1-500GB4M for 120 days", "price": "59999", "validity": "120 days"}
{"id": "f9680c7a-af4e-4938-b281-325b6a364a4c", "createdAt": "2024-07-11T13:48:38.811Z", "updatedAt": "2024-07-11T13:48:38.811Z", "code": "78", "title": "Airtel D-MFIN-1-1TB1Y for 365 days", "price": "99999", "validity": "365 days"}
{"id": "2cecfa04-eabf-4ab5-a3c1-2627a89e8178", "createdAt": "2024-07-11T13:48:39.120Z", "updatedAt": "2024-07-11T13:48:39.120Z", "code": "79", "title": "Airtel D-MFIN-1-1GB for 14 day", "price": "599", "validity": "14 day"}
{"id": "f889f4c6-81af-4671-993d-77d5f504a34f", "createdAt": "2024-07-11T13:48:39.436Z", "updatedAt": "2024-07-11T13:48:39.436Z", "code": "80", "title": "Airtel D-MFIN-1-15GB for 7 day", "price": "999", "validity": "7 day"}
{"id": "f86d35c9-073a-4428-a6c4-f177f8f41be1", "createdAt": "2024-07-11T13:48:39.762Z", "updatedAt": "2024-07-11T13:48:39.762Z", "code": "81", "title": "Airtel D-MFIN-1-7GB for 7 day", "price": "1999", "validity": "7 day"}
{"id": "9b6cf1ff-2832-4ffc-a714-224b0237143b", "createdAt": "2024-07-11T13:48:40.168Z", "updatedAt": "2024-07-11T13:48:40.168Z", "code": "82", "title": "Airtel D-MFIN-1-25GB for 7 day", "price": "4999", "validity": "7 day"}
{"id": "cf4e68e2-51e9-43f0-9a90-9011f411966a", "createdAt": "2024-07-11T13:48:40.522Z", "updatedAt": "2024-07-11T13:48:40.522Z", "code": "83", "title": "Airtel D-MFIN-1-15MB for 1 day", "price": "399", "validity": "1 day"}
{"id": "5a225abd-84ec-4e13-aa61-5cd8d6f5cc5b", "createdAt": "2024-07-11T13:48:41.076Z", "updatedAt": "2024-07-11T13:48:41.076Z", "code": "84", "title": "Airtel D-MFIN-1-35GB for 2 day", "price": "799", "validity": "2 day"}
{"id": "bbd805ae-bfd0-4ab4-a690-d80a4edb57a6", "createdAt": "2024-07-11T13:48:41.545Z", "updatedAt": "2024-07-11T13:48:41.545Z", "code": "85", "title": "Airtel D-MFIN-1-23GB for 30 day", "price": "5999", "validity": "30 day"}
{"id": "79b6cd89-2c4b-43b6-9482-815381f70adc", "createdAt": "2024-07-11T13:48:42.037Z", "updatedAt": "2024-07-11T13:48:42.037Z", "code": "86", "title": "Airtel D-MFIN-1-50MB for This Data plan gives 40MB for N50 valid for 1day (Social Plan)", "price": "50", "validity": "This Data plan gives 40MB for N50 valid for 1day (Social Plan)"}
{"id": "c2c8aa41-d7f5-4b9b-9c64-29f8443018f4", "createdAt": "2024-07-11T13:48:42.407Z", "updatedAt": "2024-07-11T13:48:42.407Z", "code": "87", "title": "Airtel D-MFIN-1-200MB2 for This Data plan gives 200MB for N100 valid for 5day (Social Plan)", "price": "100", "validity": "This Data plan gives 200MB for N100 valid for 5day (Social Plan)"}
{"id": "dd4e1648-4fb3-47ba-b92c-5395d95b69e1", "createdAt": "2024-07-11T13:48:42.761Z", "updatedAt": "2024-07-11T13:48:42.761Z", "code": "88", "title": "Airtel D-MFIN-1-400MB for This Data plan gives 400MB for N100 valid for 3day (TikTok)", "price": "100", "validity": "This Data plan gives 400MB for N100 valid for 3day (TikTok)"}
{"id": "b69db254-b70e-4cb8-ad5e-93176fffe21a", "createdAt": "2024-07-11T13:48:43.177Z", "updatedAt": "2024-07-11T13:48:43.177Z", "code": "89", "title": "Airtel D-MFIN-1-1024MB for This Data plan gives 1,024MB for N200 valid for 14day (Tik Tok)", "price": "200", "validity": "This Data plan gives 1,024MB for N200 valid for 14day (Tik Tok)"}
{"id": "4f0a7d45-c515-45cf-ac28-717681be2c9a", "createdAt": "2024-07-11T13:48:43.471Z", "updatedAt": "2024-07-11T13:48:43.471Z", "code": "90", "title": "Airtel D-MFIN-1-2048MB for This Data plan gives 2,048MB for N200 valid for 1 hr", "price": "200", "validity": "This Data plan gives 2,048MB for N200 valid for 1 hr"}
{"id": "8e2d654e-6119-4fc7-9a45-448f93d19f35", "createdAt": "2024-07-11T13:48:43.770Z", "updatedAt": "2024-07-11T13:48:43.770Z", "code": "91", "title": "Airtel D-MFIN-1-700MB for This Data plan gives 700MB for N300 valid for 25days (Social Plan)", "price": "300", "validity": "This Data plan gives 700MB for N300 valid for 25days (Social Plan)"}
```

</details>

### GET /billing/data-bundles/GLO

Sent 2026-10-02 08:29:35 UTC, answered in 0.20 s.

```http
GET /api/dev/billing/data-bundles/GLO
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:29:35 GMT
content-type: application/json; charset=utf-8
content-length: 13134
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"334e-/CJtXoMYGZM2Hw2X+GsNrWIcjsE"
cf-cache-status: DYNAMIC
```

`data` holds 55 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Provider bundles fetched"
}
```

<details><summary>All 55 entries</summary>

```json
{"id": "3d18cc71-7bb7-4720-93e9-9c1362411111", "createdAt": "2024-07-11T13:47:53.093Z", "updatedAt": "2024-07-11T13:47:53.093Z", "code": "106", "title": "Glo D-MFIN-6-DATA400 for Day Plan 1 days", "price": "50", "validity": "Day Plan 1 days"}
{"id": "fa06ae99-352a-4980-996d-e05a87843aa8", "createdAt": "2024-07-11T13:47:53.365Z", "updatedAt": "2024-07-11T13:47:53.365Z", "code": "107", "title": "Glo D-MFIN-6-DATA401 for Day Plan 1 days", "price": "100", "validity": "Day Plan 1 days"}
{"id": "1e74849d-d833-43ad-bedd-26c26494742f", "createdAt": "2024-07-11T13:47:53.666Z", "updatedAt": "2024-07-11T13:47:53.666Z", "code": "108", "title": "Glo D-MFIN-6-DATA402 for Day Plan 2 days", "price": "200", "validity": "Day Plan 2 days"}
{"id": "287edf86-2a03-4d4b-a863-621a69188db8", "createdAt": "2024-07-11T13:47:53.946Z", "updatedAt": "2024-07-11T13:47:53.946Z", "code": "109", "title": "Glo D-MFIN-6-DATA403 for Weekly Plan 14 days", "price": "500", "validity": "Weekly Plan 14 days"}
{"id": "7c52bbad-9b53-48eb-86e2-8067fdcc0175", "createdAt": "2024-07-11T13:47:54.351Z", "updatedAt": "2024-07-11T13:47:54.351Z", "code": "110", "title": "Glo D-MFIN-6-DATA404 for Monthly Plan 30 days", "price": "1000", "validity": "Monthly Plan 30 days"}
{"id": "2dc2c01a-29d1-4fd9-a53c-5af3295421f3", "createdAt": "2024-07-11T13:47:54.744Z", "updatedAt": "2024-07-11T13:47:54.744Z", "code": "111", "title": "Glo D-MFIN-6-DATA433 for Monthly Plan 30 days", "price": "1500", "validity": "Monthly Plan 30 days"}
{"id": "0a5527b0-4cd2-4746-b541-fbccd827871a", "createdAt": "2024-07-11T13:47:55.024Z", "updatedAt": "2024-07-11T13:47:55.024Z", "code": "112", "title": "Glo D-MFIN-6-DATA405 for Monthly Plan 30 days", "price": "2000", "validity": "Monthly Plan 30 days"}
{"id": "3d4f157a-4c13-423e-9770-377e21c0471e", "createdAt": "2024-07-11T13:47:55.453Z", "updatedAt": "2024-07-11T13:47:55.453Z", "code": "113", "title": "Glo D-MFIN-6-DATA406 for Monthly Plan 30 days", "price": "2500", "validity": "Monthly Plan 30 days"}
{"id": "ab1ab658-7454-403d-b040-5f4aebea070d", "createdAt": "2024-07-11T13:47:55.748Z", "updatedAt": "2024-07-11T13:47:55.748Z", "code": "114", "title": "Glo D-MFIN-6-DATA407 for Monthly Plan 30 days", "price": "3000", "validity": "Monthly Plan 30 days"}
{"id": "b9e09c82-50ea-4db6-a34d-aa526e0b2e08", "createdAt": "2024-07-11T13:47:56.042Z", "updatedAt": "2024-07-11T13:47:56.042Z", "code": "115", "title": "Glo D-MFIN-6-DATA408 for Monthly Plan 30 days", "price": "4000", "validity": "Monthly Plan 30 days"}
{"id": "60106693-9a78-4bba-9232-93663aace8f5", "createdAt": "2024-07-11T13:47:56.327Z", "updatedAt": "2024-07-11T13:47:56.327Z", "code": "116", "title": "Glo D-MFIN-6-DATA409 for Monthly Plan 30 days", "price": "5000", "validity": "Monthly Plan 30 days"}
{"id": "0e6a363e-52ce-4ee3-990f-8a3f37d7bee3", "createdAt": "2024-07-11T13:47:56.625Z", "updatedAt": "2024-07-11T13:47:56.625Z", "code": "117", "title": "Glo D-MFIN-6-DATA410 for Monthly Plan 30 days", "price": "8000", "validity": "Monthly Plan 30 days"}
{"id": "a68d4516-eba8-4117-9153-261edff9cb28", "createdAt": "2024-07-11T13:47:57.038Z", "updatedAt": "2024-07-11T13:47:57.038Z", "code": "118", "title": "Glo D-MFIN-6-DATA430 for Monthly Plan 30 days", "price": "10000", "validity": "Monthly Plan 30 days"}
{"id": "1d874e3d-1651-405b-813e-688402572dba", "createdAt": "2024-07-11T13:47:57.340Z", "updatedAt": "2024-07-11T13:47:57.340Z", "code": "119", "title": "Glo D-MFIN-6-DATA411 for Monthly Plan 30 days", "price": "15000", "validity": "Monthly Plan 30 days"}
{"id": "d67e2cb0-c02c-4f0c-9690-0e5f734ed75b", "createdAt": "2024-07-11T13:47:57.662Z", "updatedAt": "2024-07-11T13:47:57.662Z", "code": "120", "title": "Glo D-MFIN-6-DATA412 for Monthly Plan 30 days", "price": "18000", "validity": "Monthly Plan 30 days"}
{"id": "040bb409-5392-43cf-9a53-7496c12dc77d", "createdAt": "2024-07-11T13:47:57.963Z", "updatedAt": "2024-07-11T13:47:57.963Z", "code": "121", "title": "Glo D-MFIN-6-DATA432 for Monthly Plan 30 days", "price": "20000", "validity": "Monthly Plan 30 days"}
{"id": "5ed6af42-a2d3-4e3f-babc-b5be2b6d9bcb", "createdAt": "2024-07-11T13:47:58.257Z", "updatedAt": "2024-07-11T13:47:58.257Z", "code": "122", "title": "Glo D-MFIN-6-DATA15 for Night Plan 1 days", "price": "25", "validity": "Night Plan 1 days"}
{"id": "0a3509a4-b1f2-4237-9528-7f50410ce772", "createdAt": "2024-07-11T13:47:58.523Z", "updatedAt": "2024-07-11T13:47:58.523Z", "code": "123", "title": "Glo D-MFIN-6-DATA30 for Night Plan 1 days", "price": "50", "validity": "Night Plan 1 days"}
{"id": "06ba7fe7-f320-40c6-8a4c-25a33203d67c", "createdAt": "2024-07-11T13:47:59.292Z", "updatedAt": "2024-07-11T13:47:59.292Z", "code": "124", "title": "Glo D-MFIN-6-DATA31 for Night Plan 5 days", "price": "100", "validity": "Night Plan 5 days"}
{"id": "fa4a52f9-9ba4-4d36-ac8e-5c515029a38c", "createdAt": "2024-07-11T13:47:59.564Z", "updatedAt": "2024-07-11T13:47:59.564Z", "code": "125", "title": "Glo D-MFIN-6-DATA35 for Special Plan 1 days", "price": "300", "validity": "Special Plan 1 days"}
{"id": "a24b93b0-dd94-4916-baea-257ec7c0cb3b", "createdAt": "2024-07-11T13:47:59.855Z", "updatedAt": "2024-07-11T13:47:59.855Z", "code": "126", "title": "Glo D-MFIN-6-DATA36 for Special Plan 2 days", "price": "500", "validity": "Special Plan 2 days"}
{"id": "88b5b150-8c65-4ab4-8d4b-6947f30950e0", "createdAt": "2024-07-11T13:48:00.158Z", "updatedAt": "2024-07-11T13:48:00.158Z", "code": "127", "title": "Glo D-MFIN-6-DATA24 for Special Plan 7 days", "price": "1500", "validity": "Special Plan 7 days"}
{"id": "764aad15-e0bf-4673-926d-80b9233dff28", "createdAt": "2024-07-11T13:48:00.425Z", "updatedAt": "2024-07-11T13:48:00.425Z", "code": "128", "title": "Glo D-MFIN-6-DATA14 for Weekend Plan 2 (Sat & Sun) days", "price": "500", "validity": "Weekend Plan 2 (Sat & Sun) days"}
{"id": "f2e10d8b-acac-4a77-8810-e3d8463ece24", "createdAt": "2024-07-11T13:48:00.720Z", "updatedAt": "2024-07-11T13:48:00.720Z", "code": "129", "title": "Glo D-MFIN-6-DATA37 for Weekend Plan 1 (Sun) days", "price": "200", "validity": "Weekend Plan 1 (Sun) days"}
{"id": "d2874029-90d3-4f63-b724-8f2152e01d69", "createdAt": "2024-07-11T13:48:01.003Z", "updatedAt": "2024-07-11T13:48:01.003Z", "code": "130", "title": "Glo D-MFIN-6-DATA434 for Mega Plan 30 days", "price": "30000", "validity": "Mega Plan 30 days"}
{"id": "f3d726bd-34f1-4571-a800-f7d66ac05dc9", "createdAt": "2024-07-11T13:48:01.283Z", "updatedAt": "2024-07-11T13:48:01.283Z", "code": "131", "title": "Glo D-MFIN-6-DATA435 for Mega Plan 30 days", "price": "36000", "validity": "Mega Plan 30 days"}
{"id": "f2bddb68-d6cb-4922-9e2c-860e19b20f16", "createdAt": "2024-07-11T13:48:01.684Z", "updatedAt": "2024-07-11T13:48:01.684Z", "code": "132", "title": "Glo D-MFIN-6-DATA436 for Mega Plan 90 days", "price": "50000", "validity": "Mega Plan 90 days"}
{"id": "9132e133-fe12-469a-8f33-e4bbc3255742", "createdAt": "2024-07-11T13:48:01.985Z", "updatedAt": "2024-07-11T13:48:01.985Z", "code": "133", "title": "Glo D-MFIN-6-DATA437 for Mega Plan 120 days", "price": "60000", "validity": "Mega Plan 120 days"}
{"id": "a0ff8d0d-18ba-46db-9ebd-7ea7d2360483", "createdAt": "2024-07-11T13:48:02.331Z", "updatedAt": "2024-07-11T13:48:02.331Z", "code": "134", "title": "Glo D-MFIN-6-DATA438 for Mega Plan 120 days", "price": "75000", "validity": "Mega Plan 120 days"}
{"id": "ecd44c21-05a5-457f-8ab5-e22ae32f10ae", "createdAt": "2024-07-11T13:48:02.604Z", "updatedAt": "2024-07-11T13:48:02.604Z", "code": "135", "title": "Glo D-MFIN-6-DATA439 for Mega Plan 365 days", "price": "100000", "validity": "Mega Plan 365 days"}
{"id": "bcad4ac5-10a2-42cb-8e0b-bca2f91107f7", "createdAt": "2024-07-11T13:48:03.021Z", "updatedAt": "2024-07-11T13:48:03.021Z", "code": "136", "title": "Glo D-MFIN-6-DATA780 for Glo TV 3 days", "price": "150", "validity": "Glo TV 3 days"}
{"id": "068b435f-72f6-48ab-8b48-59688ce3cb9b", "createdAt": "2024-07-11T13:48:03.304Z", "updatedAt": "2024-07-11T13:48:03.304Z", "code": "137", "title": "Glo D-MFIN-6-DATA781 for Glo TV 7 days", "price": "450", "validity": "Glo TV 7 days"}
{"id": "40cfb6f8-cc55-4a30-aed3-a72bbbd07e44", "createdAt": "2024-07-11T13:48:03.706Z", "updatedAt": "2024-07-11T13:48:03.706Z", "code": "138", "title": "Glo D-MFIN-6-DATA782 for Glo TV 30 days", "price": "1400", "validity": "Glo TV 30 days"}
{"id": "f6b624b8-b239-428c-994a-104cedf7913a", "createdAt": "2024-07-11T13:48:04.124Z", "updatedAt": "2024-07-11T13:48:04.124Z", "code": "139", "title": "Glo D-MFIN-6-DATA783 for Glo TV 7 days", "price": "900", "validity": "Glo TV 7 days"}
{"id": "cc2db889-a536-4280-a754-8a466cf67e1c", "createdAt": "2024-07-11T13:48:04.403Z", "updatedAt": "2024-07-11T13:48:04.403Z", "code": "140", "title": "Glo D-MFIN-6-DATA784 for Glo TV 30 days", "price": "3200", "validity": "Glo TV 30 days"}
{"id": "9b7910db-3fe4-4440-964f-d25b8f668d48", "createdAt": "2024-07-11T13:48:04.692Z", "updatedAt": "2024-07-11T13:48:04.692Z", "code": "141", "title": "Glo D-MFIN-6-DATA850 for Social Plan 1 days", "price": "25", "validity": "Social Plan 1 days"}
{"id": "c6de4920-1720-439f-bb8b-813866e10b8b", "createdAt": "2024-07-11T13:48:05.086Z", "updatedAt": "2024-07-11T13:48:05.086Z", "code": "142", "title": "Glo D-MFIN-6-DATA851 for Social Plan 7 days", "price": "50", "validity": "Social Plan 7 days"}
{"id": "77fdc3b4-45d3-499a-9105-bec6b37f807f", "createdAt": "2024-07-11T13:48:05.371Z", "updatedAt": "2024-07-11T13:48:05.371Z", "code": "143", "title": "Glo D-MFIN-6-DATA852 for Social Plan 30 days", "price": "100", "validity": "Social Plan 30 days"}
{"id": "d192cee0-26be-4092-b250-ea8d0ea4ad55", "createdAt": "2024-07-11T13:48:05.676Z", "updatedAt": "2024-07-11T13:48:05.676Z", "code": "144", "title": "Glo D-MFIN-6-DATA853 for Social Plan 1 days", "price": "25", "validity": "Social Plan 1 days"}
{"id": "495929a3-2f3b-413a-a9e4-20db3e7efb26", "createdAt": "2024-07-11T13:48:05.962Z", "updatedAt": "2024-07-11T13:48:05.962Z", "code": "145", "title": "Glo D-MFIN-6-DATA854 for Social Plan 7 days", "price": "50", "validity": "Social Plan 7 days"}
{"id": "a072597a-f84f-4920-accc-a156177dd1f0", "createdAt": "2024-07-11T13:48:06.247Z", "updatedAt": "2024-07-11T13:48:06.247Z", "code": "146", "title": "Glo D-MFIN-6-DATA855 for Social Plan 30 days", "price": "100", "validity": "Social Plan 30 days"}
{"id": "42ed575b-ad38-4f7d-b7f1-4e8523915748", "createdAt": "2024-07-11T13:48:06.525Z", "updatedAt": "2024-07-11T13:48:06.525Z", "code": "147", "title": "Glo D-MFIN-6-DATA856 for Social Plan 1 days", "price": "25", "validity": "Social Plan 1 days"}
{"id": "9e2a8bc2-bd2b-4349-af58-6b58189ea10c", "createdAt": "2024-07-11T13:48:06.802Z", "updatedAt": "2024-07-11T13:48:06.802Z", "code": "148", "title": "Glo D-MFIN-6-DATA857 for Social Plan 7 days", "price": "50", "validity": "Social Plan 7 days"}
{"id": "27835f1b-413f-4394-af09-1eadf305aaf2", "createdAt": "2024-07-11T13:48:07.099Z", "updatedAt": "2024-07-11T13:48:07.099Z", "code": "149", "title": "Glo D-MFIN-6-DATA858 for Social Plan 30 days", "price": "100", "validity": "Social Plan 30 days"}
{"id": "e9f4856c-06d8-4aa4-85f4-f0c282704016", "createdAt": "2024-07-11T13:48:07.367Z", "updatedAt": "2024-07-11T13:48:07.367Z", "code": "150", "title": "Glo D-MFIN-6-DATA859 for Social Plan 1 days", "price": "25", "validity": "Social Plan 1 days"}
{"id": "0e59ade8-b7ee-4a0a-bda1-93d8f453397b", "createdAt": "2024-07-11T13:48:07.763Z", "updatedAt": "2024-07-11T13:48:07.763Z", "code": "151", "title": "Glo D-MFIN-6-DATA860 for Social Plan 7 days", "price": "50", "validity": "Social Plan 7 days"}
{"id": "2264980a-df68-4177-921f-1aab28ca070f", "createdAt": "2024-07-11T13:48:08.060Z", "updatedAt": "2024-07-11T13:48:08.060Z", "code": "152", "title": "Glo D-MFIN-6-DATA861 for Social Plan 30 days", "price": "100", "validity": "Social Plan 30 days"}
{"id": "c04c01b6-4938-42de-aaec-03a73c33b89c", "createdAt": "2024-07-11T13:48:08.351Z", "updatedAt": "2024-07-11T13:48:08.351Z", "code": "153", "title": "Glo D-MFIN-6-DATA869 for Social Plan 7 days", "price": "50", "validity": "Social Plan 7 days"}
{"id": "2af09c60-e07c-4098-bb81-ccdc232f25d2", "createdAt": "2024-07-11T13:48:08.626Z", "updatedAt": "2024-07-11T13:48:08.626Z", "code": "154", "title": "Glo D-MFIN-6-DATA871 for Social Plan 1 days", "price": "50", "validity": "Social Plan 1 days"}
{"id": "6808dbda-b661-446f-8237-a5cb8cf2d4fe", "createdAt": "2024-07-11T13:48:08.956Z", "updatedAt": "2024-07-11T13:48:08.956Z", "code": "155", "title": "Glo D-MFIN-6-DATA872 for Social Plan 7 days", "price": "100", "validity": "Social Plan 7 days"}
{"id": "79eeadc8-d1ee-4038-975e-72b0c710d7c9", "createdAt": "2024-07-11T13:48:09.358Z", "updatedAt": "2024-07-11T13:48:09.358Z", "code": "156", "title": "Glo D-MFIN-6-DATA873 for Social Plan 30 days", "price": "250", "validity": "Social Plan 30 days"}
{"id": "3a8e860f-f21a-4c02-a015-e079520ffbb8", "createdAt": "2024-07-11T13:48:09.642Z", "updatedAt": "2024-07-11T13:48:09.642Z", "code": "157", "title": "Glo D-MFIN-6-DATA874 for Social Plan 1 days", "price": "50", "validity": "Social Plan 1 days"}
{"id": "87610efe-f15d-4ce3-9990-5e64dad92076", "createdAt": "2024-07-11T13:48:09.923Z", "updatedAt": "2024-07-11T13:48:09.923Z", "code": "158", "title": "Glo D-MFIN-6-DATA875 for Social Plan 1 days", "price": "130", "validity": "Social Plan 1 days"}
{"id": "632c61d4-4de2-4a33-9ec4-531f6505f3b5", "createdAt": "2024-07-11T13:48:10.325Z", "updatedAt": "2024-07-11T13:48:10.325Z", "code": "159", "title": "Glo D-MFIN-6-DATA876 for Social Plan 1 days", "price": "50", "validity": "Social Plan 1 days"}
{"id": "7e94771c-5a00-4bb8-b3f4-f4910758dc19", "createdAt": "2024-07-11T13:48:10.725Z", "updatedAt": "2024-07-11T13:48:10.725Z", "code": "160", "title": "Glo D-MFIN-6-DATA877 for Social Plan 7 days", "price": "200", "validity": "Social Plan 7 days"}
```

</details>

### GET /billing/data-bundles/ETISALAT

Sent 2026-10-02 08:38:10 UTC, answered in 0.20 s.

```http
GET /api/dev/billing/data-bundles/ETISALAT
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:38:10 GMT
content-type: application/json; charset=utf-8
content-length: 3325
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"cfd-FiCRP+J0DL+hMV4z1sEcSz+UxHI"
cf-cache-status: DYNAMIC
```

`data` holds 14 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Provider bundles fetched"
}
```

<details><summary>All 14 entries</summary>

```json
{"id": "34855e4e-3e9a-4a2f-916b-7c4c3e8917c9", "createdAt": "2024-07-11T13:47:47.263Z", "updatedAt": "2024-07-11T13:47:47.263Z", "code": "92", "title": "Etisalat D-MFIN-2-1.5GB for 30 days \t\r\n4GB (2GB+2GB Night)", "price": "1000", "validity": "30 days \t\r\n4GB (2GB+2GB Night)"}
{"id": "7408f21a-3373-4ac9-a435-360d12d3f6b2", "createdAt": "2024-07-11T13:47:47.571Z", "updatedAt": "2024-07-11T13:47:47.571Z", "code": "93", "title": "Etisalat D-MFIN-2-4.5GB for 30 days 9.5GB (5.5GB+4GB Night)", "price": "2000", "validity": "30 days 9.5GB (5.5GB+4GB Night)"}
{"id": "4a74e51a-1ff5-4509-8b44-5286cb9e88b9", "createdAt": "2024-07-11T13:47:47.888Z", "updatedAt": "2024-07-11T13:47:47.888Z", "code": "94", "title": "Etisalat D-MFIN-2-40GB for 30 days", "price": "10000", "validity": "30 days"}
{"id": "a84fb024-3350-4180-a525-1b7dcd7a858d", "createdAt": "2024-07-11T13:47:48.183Z", "updatedAt": "2024-07-11T13:47:48.183Z", "code": "95", "title": "Etisalat D-MFIN-2-165GB for 1 days", "price": "300", "validity": "1 days"}
{"id": "83ca3984-e1e7-4e16-bba8-66027a97ad42", "createdAt": "2024-07-11T13:47:48.488Z", "updatedAt": "2024-07-11T13:47:48.488Z", "code": "96", "title": "Etisalat D-MFIN-2-365GB for 30 days\t15GB (10GB+ 5GB Night)", "price": "3000", "validity": "30 days\t15GB (10GB+ 5GB Night)"}
{"id": "a33741d7-0a3a-4a0c-82c8-874ff366eb8f", "createdAt": "2024-07-11T13:47:48.791Z", "updatedAt": "2024-07-11T13:47:48.791Z", "code": "97", "title": "Etisalat D-MFIN-2-25MB for 1 day", "price": "50", "validity": "1 day"}
{"id": "cc082230-524d-42fd-8c9e-5f24b114643e", "createdAt": "2024-07-11T13:47:49.104Z", "updatedAt": "2024-07-11T13:47:49.104Z", "code": "98", "title": "Etisalat D-MFIN-2-100MB for 1 day", "price": "100", "validity": "1 day"}
{"id": "12fba01d-8875-48e2-b396-11b80635f6b9", "createdAt": "2024-07-11T13:47:49.400Z", "updatedAt": "2024-07-11T13:47:49.400Z", "code": "99", "title": "Etisalat D-MFIN-2-650MB for 1 day", "price": "200", "validity": "1 day"}
{"id": "7dad7ec1-95f2-460a-a741-58021de4397f", "createdAt": "2024-07-11T13:47:49.708Z", "updatedAt": "2024-07-11T13:47:49.708Z", "code": "100", "title": "Etisalat D-MFIN-2-100GB for 1 days", "price": "150", "validity": "1 days"}
{"id": "0889cd14-bece-4498-bc6f-a25b1892ba9a", "createdAt": "2024-07-11T13:47:50.009Z", "updatedAt": "2024-07-11T13:47:50.009Z", "code": "101", "title": "Etisalat D-MFIN-2-7GB1W for 7 days 7GB (6GB+1GB Night)", "price": "1500", "validity": "7 days 7GB (6GB+1GB Night)"}
{"id": "58cdfe3d-4ec1-41dd-808f-741ca2fcefec", "createdAt": "2024-07-11T13:47:50.315Z", "updatedAt": "2024-07-11T13:47:50.315Z", "code": "102", "title": "Etisalat D-MFIN-2-5M for 30 days", "price": "500", "validity": "30 days"}
{"id": "549d361e-24b7-4164-803c-4d71b01d5ed3", "createdAt": "2024-07-11T13:47:50.769Z", "updatedAt": "2024-07-11T13:47:50.769Z", "code": "103", "title": "Etisalat D-MFIN-2-75M30 for 30 days", "price": "15000", "validity": "30 days"}
{"id": "2a903d9d-dd53-40f1-9d55-e6740e481079", "createdAt": "2024-07-11T13:47:51.075Z", "updatedAt": "2024-07-11T13:47:51.075Z", "code": "104", "title": "Etisalat D-MFIN-2-75M for 30 days", "price": "20000", "validity": "30 days"}
{"id": "a29f904f-a865-41bb-a8b7-d21dc8784951", "createdAt": "2024-07-11T13:47:51.382Z", "updatedAt": "2024-07-11T13:47:51.382Z", "code": "105", "title": "Etisalat D-MFIN-2-2.5GB for 30 days \t11GB (7GB+ 4GB Night)", "price": "2500", "validity": "30 days \t11GB (7GB+ 4GB Night)"}
```

</details>

### GET /billing/data-bundles/9MOBILE

Sent 2026-10-02 08:29:35 UTC, answered in 0.22 s.

```http
GET /api/dev/billing/data-bundles/9MOBILE
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:29:36 GMT
content-type: application/json; charset=utf-8
content-length: 144
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"90-sD3IUSV5DvGKodwMPc4HiNUaOq8"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:29:36.177Z",
  "message": [
    "Provider '9MOBILE' not found."
  ],
  "path": "/api/dev/billing/data-bundles/9MOBILE"
}
```

### Lower case: mtn

Sent 2026-10-02 08:38:09 UTC, answered in 0.46 s.

```http
GET /api/dev/billing/data-bundles/mtn
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:38:09 GMT
content-type: application/json; charset=utf-8
content-length: 13814
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"35f6-LG15cO2TF5j2D7kyKZ6aTrFNvXU"
cf-cache-status: DYNAMIC
```

`data` holds 53 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Provider bundles fetched"
}
```

<details><summary>All 53 entries</summary>

```json
{"id": "9b1a9eec-44cd-46b5-9410-19652a676086", "createdAt": "2024-07-11T13:48:12.064Z", "updatedAt": "2024-07-11T13:48:12.064Z", "code": "1", "title": "MTN D-MFIN-5-Combo-97 for Xtradata 20000 Monthly Bundle", "price": "20000", "validity": "Xtradata 20000 Monthly Bundle"}
{"id": "7d1246b0-c643-4829-933d-94625580a3a0", "createdAt": "2024-07-11T13:48:12.335Z", "updatedAt": "2024-07-11T13:48:12.335Z", "code": "2", "title": "MTN D-MFIN-5-Combo-96 for Xtradata 15000 Monthly Bundle", "price": "15000", "validity": "Xtradata 15000 Monthly Bundle"}
{"id": "86e599a4-c4c1-44f5-a13f-*******8451a", "createdAt": "2024-07-11T13:48:12.637Z", "updatedAt": "2024-07-11T13:48:12.637Z", "code": "3", "title": "MTN D-MFIN-5-Combo-95 for Xtradata 10000 Monthly Bundle", "price": "10000", "validity": "Xtradata 10000 Monthly Bundle"}
{"id": "e77becd0-e481-4459-92a2-e6ea4ade7b09", "createdAt": "2024-07-11T13:48:13.420Z", "updatedAt": "2024-07-11T13:48:13.420Z", "code": "4", "title": "MTN D-MFIN-5-Combo-94 for Xtradata 5000 Monthly Bundle", "price": "5000", "validity": "Xtradata 5000 Monthly Bundle"}
{"id": "fab54f43-ceba-4603-af90-531dc119a511", "createdAt": "2024-07-11T13:48:13.704Z", "updatedAt": "2024-07-11T13:48:13.704Z", "code": "5", "title": "MTN D-MFIN-5-Combo-93 for Xtradata 2000 Monthly Bundle", "price": "2000", "validity": "Xtradata 2000 Monthly Bundle"}
{"id": "92e797be-e7ad-4ba1-be08-e175be6faf67", "createdAt": "2024-07-11T13:48:13.983Z", "updatedAt": "2024-07-11T13:48:13.983Z", "code": "6", "title": "MTN D-MFIN-5-Combo-92 for Xtradata 1000 Monthly Bundle", "price": "1000", "validity": "Xtradata 1000 Monthly Bundle"}
{"id": "5e11118c-d7b1-462e-b514-50b90ccc7bc7", "createdAt": "2024-07-11T13:48:14.383Z", "updatedAt": "2024-07-11T13:48:14.383Z", "code": "7", "title": "MTN D-MFIN-5-Combo-91 for Xtradata 500 Weekly Bundle", "price": "500", "validity": "Xtradata 500 Weekly Bundle"}
{"id": "fa0fb1e3-79bb-4cc4-a2f6-38d1685058a1", "createdAt": "2024-07-11T13:48:14.669Z", "updatedAt": "2024-07-11T13:48:14.669Z", "code": "8", "title": "MTN D-MFIN-5-Combo-89 for Xtratalk 20000 Monthly Bundle", "price": "20000", "validity": "Xtratalk 20000 Monthly Bundle"}
{"id": "60894222-204c-48ae-9196-f33395f55b6a", "createdAt": "2024-07-11T13:48:14.943Z", "updatedAt": "2024-07-11T13:48:14.943Z", "code": "9", "title": "MTN D-MFIN-5-Combo-88 for Xtratalk 15000 Monthly Bundle", "price": "15000", "validity": "Xtratalk 15000 Monthly Bundle"}
{"id": "39855624-dc72-44e2-855f-f001f730b6ff", "createdAt": "2024-07-11T13:48:15.324Z", "updatedAt": "2024-07-11T13:48:15.324Z", "code": "10", "title": "MTN D-MFIN-5-Combo-87 for Xtratalk 10000 Monthly Bundle", "price": "10000", "validity": "Xtratalk 10000 Monthly Bundle"}
{"id": "cf04e5a4-d7fa-4afe-9ed4-3b4b39930ab1", "createdAt": "2024-07-11T13:48:15.739Z", "updatedAt": "2024-07-11T13:48:15.739Z", "code": "11", "title": "MTN D-MFIN-5-Combo-86 for Xtratalk 5000 Monthly Bundle", "price": "5000", "validity": "Xtratalk 5000 Monthly Bundle"}
{"id": "aaa3e385-8270-4f11-b54d-0696b8d8b927", "createdAt": "2024-07-11T13:48:16.037Z", "updatedAt": "2024-07-11T13:48:16.037Z", "code": "12", "title": "MTN D-MFIN-5-Combo-85 for Xtratalk 2000 Monthly Bundle", "price": "2000", "validity": "Xtratalk 2000 Monthly Bundle"}
{"id": "625e30d9-292e-4368-8ee9-6075e70c1cbc", "createdAt": "2024-07-11T13:48:16.331Z", "updatedAt": "2024-07-11T13:48:16.331Z", "code": "13", "title": "MTN D-MFIN-5-Combo-84 for Xtratalk 1000 Monthly Bundle", "price": "1000", "validity": "Xtratalk 1000 Monthly Bundle"}
{"id": "3387fe31-38c7-4359-a943-b3b31e4aeff3", "createdAt": "2024-07-11T13:48:16.622Z", "updatedAt": "2024-07-11T13:48:16.622Z", "code": "14", "title": "MTN D-MFIN-5-Combo-83 for Xtratalk 500 Weekly Bundle", "price": "500", "validity": "Xtratalk 500 Weekly Bundle"}
{"id": "61560c5c-75f0-4a80-ab65-4f803ea3835d", "createdAt": "2024-07-11T13:48:17.039Z", "updatedAt": "2024-07-11T13:48:17.039Z", "code": "15", "title": "MTN D-MFIN-5-Combo-73 for Xtratalk 300 Weekly Bundle\r\nXtratalk 300 Weekly Bundle", "price": "300", "validity": "Xtratalk 300 Weekly Bundle\r\nXtratalk 300 Weekly Bundle"}
{"id": "4a9aedb1-c9d3-4551-8916-d3bfd2d819df", "createdAt": "2024-07-11T13:48:17.318Z", "updatedAt": "2024-07-11T13:48:17.318Z", "code": "16", "title": "MTN D-MFIN-5-Combo-1588 for Xtradata 300 Weekly Bundle", "price": "300", "validity": "Xtradata 300 Weekly Bundle"}
{"id": "8f392769-81ae-4005-b60b-4d67401054c8", "createdAt": "2024-07-11T13:48:17.616Z", "updatedAt": "2024-07-11T13:48:17.616Z", "code": "17", "title": "MTN D-MFIN-5-Combo-1587 for Xtratalk 200 3days Bundle\r\nXtratalk 200 3days Bundle", "price": "200", "validity": "Xtratalk 200 3days Bundle\r\nXtratalk 200 3days Bundle"}
{"id": "b8fa09ea-190c-4f8d-a7e8-3c87a8b8f246", "createdAt": "2024-07-11T13:48:17.904Z", "updatedAt": "2024-07-11T13:48:17.904Z", "code": "18", "title": "MTN D-MFIN-5-7GB-A for 7GB Weekly Bundle", "price": "2000", "validity": "7GB Weekly Bundle"}
{"id": "4ce34519-4bcb-4d3e-982d-6685a7f6ac51", "createdAt": "2024-07-11T13:48:18.197Z", "updatedAt": "2024-07-11T13:48:18.197Z", "code": "19", "title": "MTN D-MFIN-5-774 for 1TB SME 3-Months Plan", "price": "350000", "validity": "1TB SME 3-Months Plan"}
{"id": "f353e29c-8d02-4f08-8131-e4da5d31904c", "createdAt": "2024-07-11T13:48:18.485Z", "updatedAt": "2024-07-11T13:48:18.485Z", "code": "20", "title": "MTN D-MFIN-5-773 for 165GB SME 2-Months Plan", "price": "50000", "validity": "165GB SME 2-Months Plan"}
{"id": "99dfe0ac-b67b-4982-a531-363fb5ab48a9", "createdAt": "2024-07-11T13:48:18.891Z", "updatedAt": "2024-07-11T13:48:18.891Z", "code": "21", "title": "MTN D-MFIN-5-755 for 400GB Yearly Plan", "price": "120000", "validity": "400GB Yearly Plan"}
{"id": "f17135cf-02a0-4d05-84cc-a673d400e362", "createdAt": "2024-07-11T13:48:19.166Z", "updatedAt": "2024-07-11T13:48:19.166Z", "code": "22", "title": "MTN D-MFIN-5-746 for 120GB Monthly Plan + 80mins.", "price": "22000", "validity": "120GB Monthly Plan + 80mins."}
{"id": "9b72a77b-b035-47c5-8d1a-fa220383cf1b", "createdAt": "2024-07-11T13:48:19.565Z", "updatedAt": "2024-07-11T13:48:19.565Z", "code": "23", "title": "MTN D-MFIN-5-745 for 10GB+2GB YouTube Night+300MB YouTube Music + 20mins.", "price": "3500", "validity": "10GB+2GB YouTube Night+300MB YouTube Music + 20mins."}
{"id": "1171a742-ed27-4e5a-97a7-01713785d350", "createdAt": "2024-07-11T13:48:19.974Z", "updatedAt": "2024-07-11T13:48:19.974Z", "code": "24", "title": "MTN D-MFIN-5-744 for 8GB+2GB YouTube Night+200MB YouTube Music + 15mins.", "price": "3000", "validity": "8GB+2GB YouTube Night+200MB YouTube Music + 15mins."}
{"id": "4bc5adfe-a06b-4170-b64d-7ada62d9c0a7", "createdAt": "2024-07-11T13:48:20.264Z", "updatedAt": "2024-07-11T13:48:20.264Z", "code": "25", "title": "MTN D-MFIN-5-743 for 5GB Weekly Plan", "price": "1500", "validity": "5GB Weekly Plan"}
{"id": "b1729302-920f-4b0b-ad5e-333d1d6e6d35", "createdAt": "2024-07-11T13:48:20.547Z", "updatedAt": "2024-07-11T13:48:20.547Z", "code": "26", "title": "MTN D-MFIN-5-742 for 1GB Weekly Plan + FREE 1GB for YouTube and 100MB for YouTube Music + 5mins.", "price": "600", "validity": "1GB Weekly Plan + FREE 1GB for YouTube and 100MB for YouTube Music + 5mins."}
{"id": "8d230d39-4aeb-47f2-86ea-717f44d8e289", "createdAt": "2024-07-11T13:48:20.967Z", "updatedAt": "2024-07-11T13:48:20.967Z", "code": "27", "title": "MTN D-MFIN-5-600 for 2.5GB 2-Day Plan", "price": "600", "validity": "2.5GB 2-Day Plan"}
{"id": "7a9276ac-71da-49df-a8b1-f*******2780", "createdAt": "2024-07-11T13:48:21.243Z", "updatedAt": "2024-07-11T13:48:21.243Z", "code": "28", "title": "MTN D-MFIN-5-3GB-A for 3GB 2-Days Bundle", "price": "800", "validity": "3GB 2-Days Bundle"}
{"id": "37ce1462-7317-4e0b-a9ef-1193ea9c825a", "createdAt": "2024-07-11T13:48:21.543Z", "updatedAt": "2024-07-11T13:48:21.543Z", "code": "29", "title": "MTN D-MFIN-5-360GB for 360GB SME 3-Months Plan", "price": "100000", "validity": "360GB SME 3-Months Plan"}
{"id": "5433abc6-567a-4be7-ad5f-5f498be05452", "createdAt": "2024-07-11T13:48:21.944Z", "updatedAt": "2024-07-11T13:48:21.944Z", "code": "30", "title": "MTN D-MFIN-5-307 for DataPlan 100MB Daily", "price": "100", "validity": "DataPlan 100MB Daily"}
{"id": "f664412c-7870-499b-a3aa-49849e499291", "createdAt": "2024-07-11T13:48:22.223Z", "updatedAt": "2024-07-11T13:48:22.223Z", "code": "31", "title": "MTN D-MFIN-5-278 for 75GB Monthly Plan + 40mins.", "price": "16000", "validity": "75GB Monthly Plan + 40mins."}
{"id": "f64b1f18-ac81-49dd-b7dc-0f282a784859", "createdAt": "2024-07-11T13:48:22.613Z", "updatedAt": "2024-07-11T13:48:22.613Z", "code": "32", "title": "MTN D-MFIN-5-276 for 1GB Daily Plan + 3mins.", "price": "350", "validity": "1GB Daily Plan + 3mins."}
{"id": "07d370de-07e4-4d3b-8e9e-05d451ea406d", "createdAt": "2024-07-11T13:48:22.902Z", "updatedAt": "2024-07-11T13:48:22.902Z", "code": "33", "title": "MTN D-MFIN-5-212 for 25GB+2GB YouTube Night + 25mins.", "price": "6500", "validity": "25GB+2GB YouTube Night + 25mins."}
{"id": "0aba8f21-b6ba-478f-9e47-9ca764243a8f", "createdAt": "2024-07-11T13:48:23.185Z", "updatedAt": "2024-07-11T13:48:23.185Z", "code": "34", "title": "MTN D-MFIN-5-211 for 3GB+2GB YouTube Night+200MB YouTube Music + 5mins.", "price": "1600", "validity": "3GB+2GB YouTube Night+200MB YouTube Music + 5mins."}
{"id": "7aae67b5-f243-4425-a99f-19d04e427be5", "createdAt": "2024-07-11T13:48:23.465Z", "updatedAt": "2024-07-11T13:48:23.465Z", "code": "35", "title": "MTN D-MFIN-5-210 for 160GB 2-Month Plan", "price": "30000", "validity": "160GB 2-Month Plan"}
{"id": "83fd358c-0a05-40db-b0fe-efe63676e161", "createdAt": "2024-07-11T13:48:23.876Z", "updatedAt": "2024-07-11T13:48:23.876Z", "code": "36", "title": "MTN D-MFIN-5-204 for 1-Year Plan", "price": "450000", "validity": "1-Year Plan"}
{"id": "581859eb-e14c-49b4-8be8-c22d103d157a", "createdAt": "2024-07-11T13:48:24.167Z", "updatedAt": "2024-07-11T13:48:24.167Z", "code": "37", "title": "MTN D-MFIN-5-203 for 2.5TB Yearly Plan", "price": "250000", "validity": "2.5TB Yearly Plan"}
{"id": "1d4fd70a-12d5-460d-9255-7b39389a4953", "createdAt": "2024-07-11T13:48:24.444Z", "updatedAt": "2024-07-11T13:48:24.444Z", "code": "38", "title": "MTN D-MFIN-5-202 for 1 year Plan", "price": "100000", "validity": "1 year Plan"}
{"id": "faa71781-8dd9-4430-b53a-1e1601e02d5d", "createdAt": "2024-07-11T13:48:24.851Z", "updatedAt": "2024-07-11T13:48:24.851Z", "code": "39", "title": "MTN D-MFIN-5-201 for 600GB 3-Month Plan", "price": "75000", "validity": "600GB 3-Month Plan"}
{"id": "e3ef6808-2b0d-4523-8aec-17a950ece231", "createdAt": "2024-07-11T13:48:25.131Z", "updatedAt": "2024-07-11T13:48:25.131Z", "code": "40", "title": "MTN D-MFIN-5-200 for 400GB 3-Month Plan", "price": "50000", "validity": "400GB 3-Month Plan"}
{"id": "9f95017b-fd9d-4f59-8ab3-e638ef8d2fe5", "createdAt": "2024-07-11T13:48:25.414Z", "updatedAt": "2024-07-11T13:48:25.414Z", "code": "41", "title": "MTN D-MFIN-5-199 for 100GB 2-Month Plan", "price": "20000", "validity": "100GB 2-Month Plan"}
{"id": "b7163189-c8fb-464e-b80b-cee5f334a176", "createdAt": "2024-07-11T13:48:25.685Z", "updatedAt": "2024-07-11T13:48:25.685Z", "code": "42", "title": "MTN D-MFIN-5-198 for 40GB Monthly Plan + 40mins.", "price": "11000", "validity": "40GB Monthly Plan + 40mins."}
{"id": "926223d1-f284-470c-a10b-c238510d9747", "createdAt": "2024-07-11T13:48:26.097Z", "updatedAt": "2024-07-11T13:48:26.097Z", "code": "43", "title": "MTN D-MFIN-5-197 for 20GB+2GB YouTube Night+300MB YouTube Music + 25mins.", "price": "5500", "validity": "20GB+2GB YouTube Night+300MB YouTube Music + 25mins."}
{"id": "1fe248b2-6583-454b-83ec-9360d704402e", "createdAt": "2024-07-11T13:48:26.364Z", "updatedAt": "2024-07-11T13:48:26.364Z", "code": "44", "title": "MTN D-MFIN-5-196 for 12GB+2GB YouTube Night + 25mins.", "price": "4000", "validity": "12GB+2GB YouTube Night + 25mins."}
{"id": "e193bfdc-e684-4c49-8d25-00a850a39e40", "createdAt": "2024-07-11T13:48:26.655Z", "updatedAt": "2024-07-11T13:48:26.655Z", "code": "45", "title": "MTN D-MFIN-5-195 for 4GB+2GB YouTube Night+200MB YouTube Music + 10mins.", "price": "2000", "validity": "4GB+2GB YouTube Night+200MB YouTube Music + 10mins."}
{"id": "902fc977-7872-4b8f-b2a1-0b78f7fd23a0", "createdAt": "2024-07-11T13:48:26.934Z", "updatedAt": "2024-07-11T13:48:26.934Z", "code": "46", "title": "MTN D-MFIN-5-192 for Data Plan 200MB 3-Day Plan", "price": "200", "validity": "Data Plan 200MB 3-Day Plan"}
{"id": "e7b5d942-aebb-4519-924f-2a3104cb7c37", "createdAt": "2024-07-11T13:48:27.352Z", "updatedAt": "2024-07-11T13:48:27.352Z", "code": "47", "title": "MTN D-MFIN-5-15AD for 1.2GB Monthly Plan + FREE 2GB for YouTube and 200MB for YouTube Music + 5mins.", "price": "1000", "validity": "1.2GB Monthly Plan + FREE 2GB for YouTube and 200MB for YouTube Music + 5mins."}
{"id": "fe82f10a-4d86-4bd1-9193-9c2c85463d5a", "createdAt": "2024-07-11T13:48:27.638Z", "updatedAt": "2024-07-11T13:48:27.638Z", "code": "48", "title": "MTN D-MFIN-5-1596 for 27GB Monthly Plan + 25mins.", "price": "6500", "validity": "27GB Monthly Plan + 25mins."}
{"id": "61c77afc-729d-4224-8845-57b765934662", "createdAt": "2024-07-11T13:48:27.923Z", "updatedAt": "2024-07-11T13:48:27.923Z", "code": "49", "title": "MTN D-MFIN-5-1595 for 22GB Monthly Plan + 25mins.", "price": "5500", "validity": "22GB Monthly Plan + 25mins."}
{"id": "e57aaf69-c1ed-4e5a-9b00-58915a43f70e", "createdAt": "2024-07-11T13:48:28.383Z", "updatedAt": "2024-07-11T13:48:28.383Z", "code": "50", "title": "MTN D-MFIN-5-1594 for 13GB Monthly Plan + 25mins.", "price": "4000", "validity": "13GB Monthly Plan + 25mins."}
{"id": "043abe5a-97d3-4474-9ad6-f63f4e359095", "createdAt": "2024-07-11T13:48:28.790Z", "updatedAt": "2024-07-11T13:48:28.790Z", "code": "51", "title": "MTN D-MFIN-5-1593 for 11GB Monthly Plan + 20mins.", "price": "3500", "validity": "11GB Monthly Plan + 20mins."}
{"id": "1373a4f8-2b96-4657-80e3-df5e4ed45e6b", "createdAt": "2024-07-11T13:48:29.077Z", "updatedAt": "2024-07-11T13:48:29.077Z", "code": "52", "title": "MTN D-MFIN-5-153 for 1.5GB+2.4GB YouTube Night+3hr-200MB-YouTube Weekly + 5mins.", "price": "1200", "validity": "1.5GB+2.4GB YouTube Night+3hr-200MB-YouTube Weekly + 5mins."}
{"id": "749c03cb-844d-46b5-8ef0-567436e0b151", "createdAt": "2024-07-11T13:48:29.359Z", "updatedAt": "2024-07-11T13:48:29.359Z", "code": "53", "title": "MTN D-MFIN-5-13500 for 35GB SME Monthly Plan", "price": "13500", "validity": "35GB SME Monthly Plan"}
```

</details>

### Mixed case: Airtel

Sent 2026-10-02 08:38:09 UTC, answered in 0.46 s.

```http
GET /api/dev/billing/data-bundles/Airtel
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:38:10 GMT
content-type: application/json; charset=utf-8
content-length: 8849
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2291-/IxYCEEyvX+ucCVHz20VJtDYw/g"
cf-cache-status: DYNAMIC
```

`data` holds 38 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "Provider bundles fetched"
}
```

<details><summary>All 38 entries</summary>

```json
{"id": "44a7ad34-4459-48b2-a8dc-6965c0874620", "createdAt": "2024-07-11T13:48:30.643Z", "updatedAt": "2024-07-11T13:48:30.643Z", "code": "54", "title": "Airtel D-MFIN-1-40MB for 1 day", "price": "50", "validity": "1 day"}
{"id": "3750850b-5eb5-418c-9772-6efd11306b31", "createdAt": "2024-07-11T13:48:31.045Z", "updatedAt": "2024-07-11T13:48:31.045Z", "code": "55", "title": "Airtel D-MFIN-1-100MB for 1 day", "price": "99", "validity": "1 day"}
{"id": "963e16e8-4a58-4d6b-bec2-92899cdfa8a1", "createdAt": "2024-07-11T13:48:31.443Z", "updatedAt": "2024-07-11T13:48:31.443Z", "code": "56", "title": "Airtel D-MFIN-1-200MB for 3 days", "price": "199", "validity": "3 days"}
{"id": "89ccd734-df11-4c95-97ae-8cc630c4976a", "createdAt": "2024-07-11T13:48:31.719Z", "updatedAt": "2024-07-11T13:48:31.719Z", "code": "57", "title": "Airtel D-MFIN-1-350MB for 7 days", "price": "349", "validity": "7 days"}
{"id": "eac951a5-f40c-492d-a61f-ce8d3cb348f7", "createdAt": "2024-07-11T13:48:32.004Z", "updatedAt": "2024-07-11T13:48:32.004Z", "code": "58", "title": "Airtel D-MFIN-1-750MB for 7 days", "price": "499", "validity": "7 days"}
{"id": "32772ca5-b0cf-428d-8617-610bc9ea23d8", "createdAt": "2024-07-11T13:48:32.285Z", "updatedAt": "2024-07-11T13:48:32.285Z", "code": "59", "title": "Airtel D-MFIN-1-1.5GB for 30 days", "price": "999", "validity": "30 days"}
{"id": "a1993caf-e10b-4233-84d5-84028bebba48", "createdAt": "2024-07-11T13:48:32.566Z", "updatedAt": "2024-07-11T13:48:32.566Z", "code": "60", "title": "Airtel D-MFIN-1-3GB for 30 days", "price": "1499", "validity": "30 days"}
{"id": "2e788eb7-c419-4129-92e8-af1dfbd16b7a", "createdAt": "2024-07-11T13:48:32.850Z", "updatedAt": "2024-07-11T13:48:32.850Z", "code": "61", "title": "Airtel D-MFIN-1-6GB for 30 days", "price": "2499", "validity": "30 days"}
{"id": "b77188a1-e589-47be-9c92-7cba85b29725", "createdAt": "2024-07-11T13:48:33.124Z", "updatedAt": "2024-07-11T13:48:33.124Z", "code": "62", "title": "Airtel D-MFIN-1-11GB for 30 days", "price": "3999", "validity": "30 days"}
{"id": "e96453b8-8b34-4b18-b073-e93296a7135c", "createdAt": "2024-07-11T13:48:33.404Z", "updatedAt": "2024-07-11T13:48:33.404Z", "code": "63", "title": "Airtel D-MFIN-1-20GB for 30 days", "price": "4999", "validity": "30 days"}
{"id": "8a207bd3-4b3b-47ea-b84c-e9fda9087899", "createdAt": "2024-07-11T13:48:33.692Z", "updatedAt": "2024-07-11T13:48:33.692Z", "code": "64", "title": "Airtel D-MFIN-1-40GB for 30 days", "price": "9999", "validity": "30 days"}
{"id": "b600e578-e994-45c3-8c01-d0db790007f0", "createdAt": "2024-07-11T13:48:33.963Z", "updatedAt": "2024-07-11T13:48:33.963Z", "code": "65", "title": "Airtel D-MFIN-1-75GB for 30 days", "price": "14999", "validity": "30 days"}
{"id": "9f683b6a-5dd3-41d2-8ed7-09511b3907a6", "createdAt": "2024-07-11T13:48:34.455Z", "updatedAt": "2024-07-11T13:48:34.455Z", "code": "66", "title": "Airtel D-MFIN-1-8GB for 30 days", "price": "2999", "validity": "30 days"}
{"id": "bb7acd41-7d8e-42c7-a66b-f11e14e2d6bb", "createdAt": "2024-07-11T13:48:34.786Z", "updatedAt": "2024-07-11T13:48:34.786Z", "code": "67", "title": "Airtel D-MFIN-1-120GB for 30 days", "price": "19999", "validity": "30 days"}
{"id": "f54ab6f2-251d-4dbd-a45d-8d7501e65c42", "createdAt": "2024-07-11T13:48:35.206Z", "updatedAt": "2024-07-11T13:48:35.206Z", "code": "68", "title": "Airtel D-MFIN-1-1GB1D for 1 day", "price": "349", "validity": "1 day"}
{"id": "a554aa9b-439b-47c9-824c-8927a7a42f28", "createdAt": "2024-07-11T13:48:35.583Z", "updatedAt": "2024-07-11T13:48:35.583Z", "code": "69", "title": "Airtel D-MFIN-1-2GB1D for 1 day", "price": "499", "validity": "1 day"}
{"id": "e430b081-321f-4685-b33b-af21b44f2455", "createdAt": "2024-07-11T13:48:36.011Z", "updatedAt": "2024-07-11T13:48:36.011Z", "code": "70", "title": "Airtel D-MFIN-1-6GB1W for 7 days", "price": "1499", "validity": "7 days"}
{"id": "6f2b158a-4430-41ee-b83b-264396be2869", "createdAt": "2024-07-11T13:48:36.303Z", "updatedAt": "2024-07-11T13:48:36.303Z", "code": "71", "title": "Airtel D-MFIN-1-2GB1M for 30 days", "price": "1199", "validity": "30 days"}
{"id": "15ea0f97-a140-4154-9af4-57f8451a166c", "createdAt": "2024-07-11T13:48:36.604Z", "updatedAt": "2024-07-11T13:48:36.604Z", "code": "72", "title": "Airtel D-MFIN-1-4.5GB for 30 days", "price": "1999", "validity": "30 days"}
{"id": "14e751a8-3401-48b1-a0ec-1d1c90f4af0d", "createdAt": "2024-07-11T13:48:37.046Z", "updatedAt": "2024-07-11T13:48:37.046Z", "code": "73", "title": "Airtel D-MFIN-1-25GB1M for 30 days", "price": "7999", "validity": "30 days"}
{"id": "59825958-27f3-46ff-9c83-776887db17df", "createdAt": "2024-07-11T13:48:37.495Z", "updatedAt": "2024-07-11T13:48:37.495Z", "code": "74", "title": "Airtel D-MFIN-1-200GB1M for 30 days", "price": "29999", "validity": "30 days"}
{"id": "3f9b6310-cb26-4178-9f90-bab92c9a4f6a", "createdAt": "2024-07-11T13:48:37.782Z", "updatedAt": "2024-07-11T13:48:37.782Z", "code": "75", "title": "Airtel D-MFIN-1-280GB1M for 30 days", "price": "35999", "validity": "30 days"}
{"id": "0ed61762-2ddb-4f0a-aef8-90fee1e97b86", "createdAt": "2024-07-11T13:48:38.064Z", "updatedAt": "2024-07-11T13:48:38.064Z", "code": "76", "title": "Airtel D-MFIN-1-400GB3M for 90 days", "price": "49999", "validity": "90 days"}
{"id": "7a8bea3a-5522-4d56-9508-0642289525cd", "createdAt": "2024-07-11T13:48:38.509Z", "updatedAt": "2024-07-11T13:48:38.509Z", "code": "77", "title": "Airtel D-MFIN-1-500GB4M for 120 days", "price": "59999", "validity": "120 days"}
{"id": "f9680c7a-af4e-4938-b281-325b6a364a4c", "createdAt": "2024-07-11T13:48:38.811Z", "updatedAt": "2024-07-11T13:48:38.811Z", "code": "78", "title": "Airtel D-MFIN-1-1TB1Y for 365 days", "price": "99999", "validity": "365 days"}
{"id": "2cecfa04-eabf-4ab5-a3c1-2627a89e8178", "createdAt": "2024-07-11T13:48:39.120Z", "updatedAt": "2024-07-11T13:48:39.120Z", "code": "79", "title": "Airtel D-MFIN-1-1GB for 14 day", "price": "599", "validity": "14 day"}
{"id": "f889f4c6-81af-4671-993d-77d5f504a34f", "createdAt": "2024-07-11T13:48:39.436Z", "updatedAt": "2024-07-11T13:48:39.436Z", "code": "80", "title": "Airtel D-MFIN-1-15GB for 7 day", "price": "999", "validity": "7 day"}
{"id": "f86d35c9-073a-4428-a6c4-f177f8f41be1", "createdAt": "2024-07-11T13:48:39.762Z", "updatedAt": "2024-07-11T13:48:39.762Z", "code": "81", "title": "Airtel D-MFIN-1-7GB for 7 day", "price": "1999", "validity": "7 day"}
{"id": "9b6cf1ff-2832-4ffc-a714-224b0237143b", "createdAt": "2024-07-11T13:48:40.168Z", "updatedAt": "2024-07-11T13:48:40.168Z", "code": "82", "title": "Airtel D-MFIN-1-25GB for 7 day", "price": "4999", "validity": "7 day"}
{"id": "cf4e68e2-51e9-43f0-9a90-9011f411966a", "createdAt": "2024-07-11T13:48:40.522Z", "updatedAt": "2024-07-11T13:48:40.522Z", "code": "83", "title": "Airtel D-MFIN-1-15MB for 1 day", "price": "399", "validity": "1 day"}
{"id": "5a225abd-84ec-4e13-aa61-5cd8d6f5cc5b", "createdAt": "2024-07-11T13:48:41.076Z", "updatedAt": "2024-07-11T13:48:41.076Z", "code": "84", "title": "Airtel D-MFIN-1-35GB for 2 day", "price": "799", "validity": "2 day"}
{"id": "bbd805ae-bfd0-4ab4-a690-d80a4edb57a6", "createdAt": "2024-07-11T13:48:41.545Z", "updatedAt": "2024-07-11T13:48:41.545Z", "code": "85", "title": "Airtel D-MFIN-1-23GB for 30 day", "price": "5999", "validity": "30 day"}
{"id": "79b6cd89-2c4b-43b6-9482-815381f70adc", "createdAt": "2024-07-11T13:48:42.037Z", "updatedAt": "2024-07-11T13:48:42.037Z", "code": "86", "title": "Airtel D-MFIN-1-50MB for This Data plan gives 40MB for N50 valid for 1day (Social Plan)", "price": "50", "validity": "This Data plan gives 40MB for N50 valid for 1day (Social Plan)"}
{"id": "c2c8aa41-d7f5-4b9b-9c64-29f8443018f4", "createdAt": "2024-07-11T13:48:42.407Z", "updatedAt": "2024-07-11T13:48:42.407Z", "code": "87", "title": "Airtel D-MFIN-1-200MB2 for This Data plan gives 200MB for N100 valid for 5day (Social Plan)", "price": "100", "validity": "This Data plan gives 200MB for N100 valid for 5day (Social Plan)"}
{"id": "dd4e1648-4fb3-47ba-b92c-5395d95b69e1", "createdAt": "2024-07-11T13:48:42.761Z", "updatedAt": "2024-07-11T13:48:42.761Z", "code": "88", "title": "Airtel D-MFIN-1-400MB for This Data plan gives 400MB for N100 valid for 3day (TikTok)", "price": "100", "validity": "This Data plan gives 400MB for N100 valid for 3day (TikTok)"}
{"id": "b69db254-b70e-4cb8-ad5e-93176fffe21a", "createdAt": "2024-07-11T13:48:43.177Z", "updatedAt": "2024-07-11T13:48:43.177Z", "code": "89", "title": "Airtel D-MFIN-1-1024MB for This Data plan gives 1,024MB for N200 valid for 14day (Tik Tok)", "price": "200", "validity": "This Data plan gives 1,024MB for N200 valid for 14day (Tik Tok)"}
{"id": "4f0a7d45-c515-45cf-ac28-717681be2c9a", "createdAt": "2024-07-11T13:48:43.471Z", "updatedAt": "2024-07-11T13:48:43.471Z", "code": "90", "title": "Airtel D-MFIN-1-2048MB for This Data plan gives 2,048MB for N200 valid for 1 hr", "price": "200", "validity": "This Data plan gives 2,048MB for N200 valid for 1 hr"}
{"id": "8e2d654e-6119-4fc7-9a45-448f93d19f35", "createdAt": "2024-07-11T13:48:43.770Z", "updatedAt": "2024-07-11T13:48:43.770Z", "code": "91", "title": "Airtel D-MFIN-1-700MB for This Data plan gives 700MB for N300 valid for 25days (Social Plan)", "price": "300", "validity": "This Data plan gives 700MB for N300 valid for 25days (Social Plan)"}
```

</details>

### Lower case: 9mobile

Sent 2026-10-02 08:38:10 UTC, answered in 0.23 s.

```http
GET /api/dev/billing/data-bundles/9mobile
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:38:10 GMT
content-type: application/json; charset=utf-8
content-length: 144
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"90-DCI4K6K9CWGfor5JeNQ9CrI8ynI"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:38:10.411Z",
  "message": [
    "Provider '9mobile' not found."
  ],
  "path": "/api/dev/billing/data-bundles/9mobile"
}
```

### A guess that is not a provider: T2

Sent 2026-10-02 08:38:10 UTC, answered in 0.21 s.

```http
GET /api/dev/billing/data-bundles/T2
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:38:10 GMT
content-type: application/json; charset=utf-8
content-length: 134
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"86-KJOw/vGXrX8SrbLgEqy21YK0Oyw"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:38:10.837Z",
  "message": [
    "Provider 'T2' not found."
  ],
  "path": "/api/dev/billing/data-bundles/T2"
}
```

### POST /billing/data-bundle, ₦100 bundle

Sent 2026-10-02 08:29:57 UTC, answered in 0.20 s.

```http
POST /api/dev/billing/data-bundle
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "vtu_network": "MTN",
  "data_code": "30",
  "vtu_number": "*******0101"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:29:57 GMT
content-type: application/json; charset=utf-8
content-length: 128
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"80-YbckjwUp9FkZoyMKnNBlBifhUdc"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:29:57.816Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/billing/data-bundle"
}
```
