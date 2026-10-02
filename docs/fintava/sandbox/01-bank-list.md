# GET /banks: bank list

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 5 (bank list).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200, unchanged**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **ran, HTTP 200** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Same answer as the first run: 358 banks in one unpaged list, Loma Bank is
  `090620` (`LOMA BANK`). Compared code by code with the first run's list by
  script: 0 differences. Activating the merchant changed nothing here.
- Free (the merchant balance did not move across it: `22-merchant-balance.md`).

### Requests and responses

#### GET /banks

Sent 2026-10-02 09:43:14 UTC, answered in 0.25 s.

```http
GET /api/dev/banks
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:43:14 GMT
content-type: application/json; charset=utf-8
content-length: 61655
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"f0d7-0NcHPKB7CuKCQg98KbB/Wqah6Ls"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 200,
  "message": "bank lists fetched successfully",
  "data": [
{"id": "90d92fad-9d66-48a5-87b4-75d9e1291d49", "createdAt": "2023-10-13T20:00:00.170Z", "updatedAt": "2023-10-13T20:00:00.170Z", "code": "110005", "name": "3LINE CARD MANAGEMENT LIMITED"},
{"id": "ed9ddfe0-5b14-4c97-a9e8-de5389a918bf", "createdAt": "2023-10-13T20:00:00.176Z", "updatedAt": "2023-10-13T20:00:00.176Z", "code": "120001", "name": "9 PAYMENT SOLUTIONS BANK"},
{"id": "5cd7d06e-e59a-492c-9d7e-0a52d908dbcf", "createdAt": "2023-10-13T20:00:00.180Z", "updatedAt": "2023-10-13T20:00:00.180Z", "code": "050005", "name": "AAA FINANCE"},
{"id": "438ed5de-0acc-476e-96c6-94ccabf2a9af", "createdAt": "2023-10-13T20:00:00.185Z", "updatedAt": "2023-10-13T20:00:00.185Z", "code": "000112", "name": "ABank ABC"},
{"id": "1c027323-e7b4-43a5-acd5-1016e1d84ae4", "createdAt": "2023-10-13T20:00:00.189Z", "updatedAt": "2023-10-13T20:00:00.189Z", "code": "070010", "name": "ABBEY MORTGAGE BANK"},
{"id": "059f2dcd-6209-4019-8599-98a9cfae5346", "createdAt": "2023-10-13T20:00:00.234Z", "updatedAt": "2023-10-13T20:00:00.234Z", "code": "090270", "name": "AB MICROFINANCE BANK"},
{"id": "71102a67-541b-4a7d-a28b-8dda683086b7", "createdAt": "2023-10-13T20:00:00.266Z", "updatedAt": "2023-10-13T20:00:00.266Z", "code": "090260", "name": "ABOVE ONLY MICROFINANCE BANK"},
{"id": "9c5b7845-a76d-4e4a-9277-6b71e35bbbf5", "createdAt": "2023-10-13T20:00:00.297Z", "updatedAt": "2023-10-13T20:00:00.297Z", "code": "090197", "name": "ABU MICROFINANCE BANK"},
{"id": "da5e6132-29a8-4f36-9295-aa59cc9027c7", "createdAt": "2023-10-13T20:00:00.304Z", "updatedAt": "2023-10-13T20:00:00.304Z", "code": "90202", "name": "ACCELEREX NETWORK LIMITED"},
{"id": "586a673b-e118-4381-855f-eb9ab475cac3", "createdAt": "2023-10-13T20:00:00.307Z", "updatedAt": "2023-10-13T20:00:00.307Z", "code": "090202", "name": "ACCELEREX NETWORK LIMITED"},
{"id": "3257ee2c-3774-46ec-b88c-c3a44cbde297", "createdAt": "2023-10-13T20:00:00.310Z", "updatedAt": "2023-10-13T20:00:00.310Z", "code": "000014", "name": "ACCESS BANK"},
{"id": "b34eb6cb-c8f5-471b-8485-ecba113f4d90", "createdAt": "2023-10-13T20:00:00.314Z", "updatedAt": "2023-10-13T20:00:00.314Z", "code": "000005", "name": "ACCESS(DIAMOND) BANK"},
{"id": "605703ef-7445-45ff-8139-f449f2be3c81", "createdAt": "2023-10-13T20:00:00.320Z", "updatedAt": "2023-10-13T20:00:00.320Z", "code": "100013", "name": "ACCESS MONEY"},
{"id": "dd274573-c407-4243-9d66-5e48d3ff6ba0", "createdAt": "2023-10-13T20:00:00.325Z", "updatedAt": "2023-10-13T20:00:00.325Z", "code": "100052", "name": "ACCESS YELLO & BETA"},
{"id": "a141c37b-0365-4d77-a485-6cfe44c3ac40", "createdAt": "2023-10-13T20:00:00.330Z", "updatedAt": "2023-10-13T20:00:00.330Z", "code": "090134", "name": "ACCION MICROFINANCE BANK"},
{"id": "96c83cac-0ae5-4f6b-9f6c-c2738f1e3946", "createdAt": "2023-10-13T20:00:00.333Z", "updatedAt": "2023-10-13T20:00:00.333Z", "code": "090160", "name": "ADDOSSER MICROFINANCE BANK"},
{"id": "71ffbe59-09d9-4d95-b9e7-272a3bb3a6ac", "createdAt": "2023-10-13T20:00:00.338Z", "updatedAt": "2023-10-13T20:00:00.338Z", "code": "090268", "name": "ADEYEMI COLLEGE STAFF MICROFINANCE BANK"},
{"id": "5054087d-df16-4b4a-8d14-6060ad97a959", "createdAt": "2023-10-13T20:00:00.342Z", "updatedAt": "2023-10-13T20:00:00.342Z", "code": "090155", "name": "ADVANS LA FAYETTE  MICROFINANCE BANK"},
{"id": "e82e631d-110a-46cf-a485-41f70de72ea4", "createdAt": "2023-10-13T20:00:00.345Z", "updatedAt": "2023-10-13T20:00:00.345Z", "code": "90155", "name": "ADVANS LA FAYETTE  MICROFINANCE BANK"},
{"id": "34e746dc-9488-4eea-9b4b-31a31087cf72", "createdAt": "2023-10-13T20:00:00.350Z", "updatedAt": "2023-10-13T20:00:00.350Z", "code": "090292", "name": "AFEKHAFE MICROFINANCE BANK"},
{"id": "c274a087-cdd2-45c5-a2db-8c8dcecbb11d", "createdAt": "2023-10-13T20:00:00.355Z", "updatedAt": "2023-10-13T20:00:00.355Z", "code": "100028", "name": "AG MORTGAGE BANK"},
{"id": "acf1b9af-73f8-42ee-859e-8c40aa5ffbb2", "createdAt": "2023-10-13T20:00:00.360Z", "updatedAt": "2023-10-13T20:00:00.360Z", "code": "090371", "name": "AGOSASA MICROFINANCE BANK"},
{"id": "43a368d1-531f-4ed0-8c97-0575b56fbd66", "createdAt": "2023-10-13T20:00:00.362Z", "updatedAt": "2023-10-13T20:00:00.362Z", "code": "090608", "name": "Akpo Microfinance Bank"},
{"id": "9f2b085a-783c-4104-b531-073f04d24fdd", "createdAt": "2023-10-13T20:00:00.366Z", "updatedAt": "2023-10-13T20:00:00.366Z", "code": "090133", "name": "AL-BARAKAH MICROFINANCE BANK"},
{"id": "7b249a74-cd7e-4707-b2da-928f0baaa0b4", "createdAt": "2023-10-13T20:00:00.369Z", "updatedAt": "2023-10-13T20:00:00.369Z", "code": "090259", "name": "ALEKUN MICROFINANCE BANK"},
{"id": "5e598432-e823-437d-94d4-ac18238d0050", "createdAt": "2023-10-13T20:00:00.373Z", "updatedAt": "2023-10-13T20:00:00.373Z", "code": "090297", "name": "ALERT MICROFINANCE BANK"},
{"id": "98733c57-236c-452e-a82a-790f3027b4d2", "createdAt": "2023-10-13T20:00:00.376Z", "updatedAt": "2023-10-13T20:00:00.376Z", "code": "090277", "name": "AL-HAYAT MICROFINANCE BANK"},
{"id": "bd72faad-ea27-473a-9034-0f4b12f99af2", "createdAt": "2023-10-13T20:00:00.378Z", "updatedAt": "2023-10-13T20:00:00.378Z", "code": "090131", "name": "ALLWORKERS MICROFINANCE BANK"},
{"id": "f2e3e7ec-ecb4-4fcb-bcab-125245a8322a", "createdAt": "2023-10-13T20:00:00.381Z", "updatedAt": "2023-10-13T20:00:00.381Z", "code": "090169", "name": "ALPHA KAPITAL MICROFINANCE BANK"},
{"id": "f398bd9d-3359-4084-8220-14292a7f4316", "createdAt": "2023-10-13T20:00:00.384Z", "updatedAt": "2023-10-13T20:00:00.384Z", "code": "090394", "name": "AMAC MICROFINANCE BANK"},
{"id": "c681c03e-4189-4f9e-a389-4b1437b2e729", "createdAt": "2023-10-13T20:00:00.387Z", "updatedAt": "2023-10-13T20:00:00.387Z", "code": "090180", "name": "AMJU UNIQUE MICROFINANCE BANK"},
{"id": "f1559c2a-6cf4-4715-a019-fdde6ac31ed7", "createdAt": "2023-10-13T20:00:00.391Z", "updatedAt": "2023-10-13T20:00:00.391Z", "code": "090116", "name": "AMML MICROFINANCE BANK"},
{"id": "150db961-3193-4465-a43c-35d956c93e5f", "createdAt": "2023-10-13T20:00:00.395Z", "updatedAt": "2023-10-13T20:00:00.395Z", "code": "090610", "name": "AMOYE MICROFINANCE BANK"},
{"id": "df60512e-372d-4192-953d-b43ea8a8a584", "createdAt": "2023-10-13T20:00:00.398Z", "updatedAt": "2023-10-13T20:00:00.398Z", "code": "090143", "name": "APEKS MICROFINANCE BANK"},
{"id": "51cc7b8b-7bbe-47a9-98f6-5a48c8fc3357", "createdAt": "2023-10-13T20:00:00.401Z", "updatedAt": "2023-10-13T20:00:00.401Z", "code": "090376", "name": "APPLE MICROFINANCE BANK"},
{"id": "722d0a6a-c101-432a-b78a-a3b2cc5c0380", "createdAt": "2023-10-13T20:00:00.403Z", "updatedAt": "2023-10-13T20:00:00.403Z", "code": "090282", "name": "ARISE MICROFINANCE BANK"},
{"id": "eee2a920-cd4b-43a0-aaa0-b6b051935bf1", "createdAt": "2023-10-13T20:00:00.406Z", "updatedAt": "2023-10-13T20:00:00.406Z", "code": "090001", "name": "ASO SAVINGS"},
{"id": "a36a7ba0-964a-4c7e-aa7d-5a23f7109a3e", "createdAt": "2023-10-13T20:00:00.409Z", "updatedAt": "2023-10-13T20:00:00.409Z", "code": "090287", "name": "ASSETMATRIX MICROFINANCE BANK"},
{"id": "60a7b14f-b43a-47c8-8d90-f260da4fa8dc", "createdAt": "2023-10-13T20:00:00.415Z", "updatedAt": "2023-10-13T20:00:00.415Z", "code": "090172", "name": "ASTRAPOLARIS MICROFINANCE BANK"},
{"id": "540728db-c096-47b2-9770-8f86e443dd9c", "createdAt": "2023-10-13T20:00:00.418Z", "updatedAt": "2023-10-13T20:00:00.418Z", "code": "090264", "name": "AUCHI MICROFINANCE BANK"},
{"id": "8d34d196-3512-4861-89f9-9203c3579a95", "createdAt": "2023-10-13T20:00:00.421Z", "updatedAt": "2023-10-13T20:00:00.421Z", "code": "090600", "name": "AVE MARIA MICROFINANCE BANK LTD"},
{"id": "2f25c9fc-fe3c-46b8-a160-20cedd6554b4", "createdAt": "2023-10-13T20:00:00.424Z", "updatedAt": "2023-10-13T20:00:00.424Z", "code": "090188", "name": "BAINES CREDIT MICROFINANCE BANK"},
{"id": "95b0ff34-d5e0-49ca-81bb-9aec11faf55b", "createdAt": "2023-10-13T20:00:00.427Z", "updatedAt": "2023-10-13T20:00:00.427Z", "code": "090326", "name": "BALOGUN GAMBARI MICROFINANCE BANK"},
{"id": "807d48e0-bba1-4f6d-9bac-1bf0e65c675e", "createdAt": "2023-10-13T20:00:00.429Z", "updatedAt": "2023-10-13T20:00:00.429Z", "code": "090581", "name": "BANC CORP MICROFINANCE BANK LTD"},
{"id": "9979df6d-d23d-4057-a926-27190a7730a3", "createdAt": "2023-10-13T20:00:00.432Z", "updatedAt": "2023-10-13T20:00:00.432Z", "code": "090316", "name": "BAYERO UNIVERSITY MICROFINANCE BANK"},
{"id": "0bed1ff5-2578-4cec-91ef-739443e9ae08", "createdAt": "2023-10-13T20:00:00.435Z", "updatedAt": "2023-10-13T20:00:00.435Z", "code": "090127", "name": "BC KASH MICROFINANCE BANK"},
{"id": "00f6a3d2-d42e-42e3-ac98-d7308efe90e4", "createdAt": "2023-10-13T20:00:00.440Z", "updatedAt": "2023-10-13T20:00:00.440Z", "code": "090336", "name": "BIPC MICROFINANCE BANK"},
{"id": "1089919a-424b-47b5-8611-d54d8e62166d", "createdAt": "2023-10-13T20:00:00.442Z", "updatedAt": "2023-10-13T20:00:00.442Z", "code": "090117", "name": "BOCTRUST MICROFINANCE BANK LIMITED"},
{"id": "8e835e4c-bd6d-4a21-a649-1ab3fa26096c", "createdAt": "2023-10-13T20:00:00.445Z", "updatedAt": "2023-10-13T20:00:00.445Z", "code": "090395", "name": "BORGU  MICROFINANCE BANK"},
{"id": "0f1949be-ddbb-4a0d-8de0-2f8894d29130", "createdAt": "2023-10-13T20:00:00.448Z", "updatedAt": "2023-10-13T20:00:00.448Z", "code": "090176", "name": "BOSAK MICROFINANCE BANK"},
{"id": "075eb082-1468-4178-b620-b6660bed8ab1", "createdAt": "2023-10-13T20:00:00.451Z", "updatedAt": "2023-10-13T20:00:00.451Z", "code": "090148", "name": "BOWEN MICROFINANCE BANK"},
{"id": "c9853440-37d5-494e-978e-6fae1067d2b5", "createdAt": "2023-10-13T20:00:00.461Z", "updatedAt": "2023-10-13T20:00:00.461Z", "code": "050006", "name": "Branch International Financial Services"},
{"id": "fc4198b0-f00b-4d71-adc3-0e09897be7c7", "createdAt": "2023-10-13T20:00:00.466Z", "updatedAt": "2023-10-13T20:00:00.466Z", "code": "070015", "name": "BRENT MORTGAGE BANK"},
{"id": "76a56bf3-2a34-4a28-a83a-c94407908e5a", "createdAt": "2023-10-13T20:00:00.470Z", "updatedAt": "2023-10-13T20:00:00.470Z", "code": "090293", "name": "BRETHREN MICROFINANCE BANK"},
{"id": "eb884b19-ffbe-49e2-897a-3bd7f1bb8e81", "createdAt": "2023-10-13T20:00:00.474Z", "updatedAt": "2023-10-13T20:00:00.474Z", "code": "090393", "name": "BRIDGEWAY MICROFINANACE BANK"},
{"id": "7363d3e6-b702-42b9-a567-cdd08172b124", "createdAt": "2023-10-13T20:00:00.476Z", "updatedAt": "2023-10-13T20:00:00.476Z", "code": "090308", "name": "BRIGHTWAY MICROFINANCE BANK"},
{"id": "8d46617b-6dbe-4ed3-bfe0-b2c618e9edc7", "createdAt": "2023-10-13T20:00:00.483Z", "updatedAt": "2023-10-13T20:00:00.483Z", "code": "090568", "name": "BROADVIEW MICROFINANCE BANK LTD"},
{"id": "588f9f1f-d0f8-4fdb-b53f-3b32480f0c97", "createdAt": "2023-10-13T20:00:00.485Z", "updatedAt": "2023-10-13T20:00:00.485Z", "code": "090406", "name": "BUSINESS SUPPORT MICROFINANCE BANK"},
{"id": "a61d4830-5e51-4bbc-933e-ba2e96a33e72", "createdAt": "2023-10-13T20:00:00.489Z", "updatedAt": "2023-10-13T20:00:00.489Z", "code": "090415", "name": "Calabar Microfinance Bank"},
{"id": "6e2d3e08-4e32-4f5b-9c04-c787a07ff4a1", "createdAt": "2023-10-13T20:00:00.491Z", "updatedAt": "2023-10-13T20:00:00.491Z", "code": "100026", "name": "CARBON"},
{"id": "48a08796-18f6-4db9-94a9-0eff9f5687c6", "createdAt": "2023-10-13T20:00:00.494Z", "updatedAt": "2023-10-13T20:00:00.494Z", "code": "090360", "name": "CASHCONNECT MICROFINANCE BANK"},
{"id": "33021e86-9ff9-4851-9dd5-7b40a7be3b8f", "createdAt": "2023-10-13T20:00:00.499Z", "updatedAt": "2023-10-13T20:00:00.499Z", "code": "100005", "name": "CELLULANT"},
{"id": "6a50ccca-f9dc-4402-8010-5334da6bb7a0", "createdAt": "2023-10-13T20:00:00.504Z", "updatedAt": "2023-10-13T20:00:00.504Z", "code": "090154", "name": "CEMCS MICROFINANCE BANK"},
{"id": "f3a56ede-c9e9-4dcf-9ab5-43e9a0438dcb", "createdAt": "2023-10-13T20:00:00.511Z", "updatedAt": "2023-10-13T20:00:00.511Z", "code": "000028", "name": "Central Bank of Nigeria"},
{"id": "f0c849ee-6a7f-4ab7-a433-5d5171ed5d1e", "createdAt": "2023-10-13T20:00:00.518Z", "updatedAt": "2023-10-13T20:00:00.518Z", "code": "100015", "name": "CHAMS MOBILE"},
{"id": "50c1dc3e-9782-4ff1-abcf-04029db151c9", "createdAt": "2023-10-13T20:00:00.525Z", "updatedAt": "2023-10-13T20:00:00.525Z", "code": "090397", "name": "Chanelle Bank"},
{"id": "45f5223e-c274-4a85-8bd5-b04addfefb0d", "createdAt": "2023-10-13T20:00:00.530Z", "updatedAt": "2023-10-13T20:00:00.530Z", "code": "090416", "name": "Chibueze Microfinance Bank"},
{"id": "e0cf4613-eee8-4e8e-b6d9-df399c5b5b44", "createdAt": "2023-10-13T20:00:00.532Z", "updatedAt": "2023-10-13T20:00:00.532Z", "code": "090141", "name": "CHIKUM MICROFINANCE BANK"},
{"id": "4719c22d-cf1e-4e2f-a211-502638f14a15", "createdAt": "2023-10-13T20:00:00.536Z", "updatedAt": "2023-10-13T20:00:00.536Z", "code": "000009", "name": "CITI BANK"},
{"id": "50878c93-bf3f-43ea-b3a7-74042160b12e", "createdAt": "2023-10-13T20:00:00.539Z", "updatedAt": "2023-10-13T20:00:00.539Z", "code": "090144", "name": "CIT MICROFINANCE BANK"},
{"id": "4d9b9dc5-90fc-49cf-b039-d3cd1389b39f", "createdAt": "2023-10-13T20:00:00.541Z", "updatedAt": "2023-10-13T20:00:00.541Z", "code": "090374", "name": "COASTLINE MICROFINANCE BANK"},
{"id": "83581ff3-49e1-4e20-a517-cf49c9d5beda", "createdAt": "2023-10-13T20:00:00.544Z", "updatedAt": "2023-10-13T20:00:00.544Z", "code": "090130", "name": "CONSUMER MICROFINANCE BANK"},
{"id": "42e35d15-eb14-41e3-a52e-f32568032e49", "createdAt": "2023-10-13T20:00:00.547Z", "updatedAt": "2023-10-13T20:00:00.547Z", "code": "070021", "name": "COOP MORTGAGE BANK"},
{"id": "22a4f1a9-1a3d-4c15-98ce-9619d4b02fb3", "createdAt": "2023-10-13T20:00:00.550Z", "updatedAt": "2023-10-13T20:00:00.550Z", "code": "090365", "name": "CORESTEP MICROFINANCE BANK"},
{"id": "a7612640-cf13-4db9-9e9a-4a2091e15bb6", "createdAt": "2023-10-13T20:00:00.553Z", "updatedAt": "2023-10-13T20:00:00.553Z", "code": "060001", "name": "CORONATION MERCHANT BANK"},
{"id": "849f7c70-5f54-43b7-90a8-5aba5808d531", "createdAt": "2023-10-13T20:00:00.557Z", "updatedAt": "2023-10-13T20:00:00.557Z", "code": "070006", "name": "COVENANT MFB"},
{"id": "bf7631db-7ccd-4d51-a214-73769fda9a78", "createdAt": "2023-10-13T20:00:00.560Z", "updatedAt": "2023-10-13T20:00:00.560Z", "code": "090159", "name": "CREDIT AFRIQUE MICROFINANCE BANK"},
{"id": "d519267a-5da0-46e0-8ced-53e199852cba", "createdAt": "2023-10-13T20:00:00.564Z", "updatedAt": "2023-10-13T20:00:00.564Z", "code": "090611", "name": "Creditville MFB"},
{"id": "f6aae15a-aa05-49f4-8446-d3ce150f720b", "createdAt": "2023-10-13T20:00:00.567Z", "updatedAt": "2023-10-13T20:00:00.567Z", "code": "110014", "name": "CYBERSPACE LIMITED"},
{"id": "bd28bdb8-dc4f-4743-bdf3-c9368f2cc1e8", "createdAt": "2023-10-13T20:00:00.573Z", "updatedAt": "2023-10-13T20:00:00.573Z", "code": "090391", "name": "DAVODANI  MICROFINANCE BANK"},
{"id": "b73a9ba5-1a86-4bf1-869a-cd3ad268ee26", "createdAt": "2023-10-13T20:00:00.575Z", "updatedAt": "2023-10-13T20:00:00.575Z", "code": "090167", "name": "DAYLIGHT MICROFINANCE BANK"},
{"id": "118ae6d8-3ebb-4c40-a2d8-e3aaea0a401a", "createdAt": "2023-10-13T20:00:00.578Z", "updatedAt": "2023-10-13T20:00:00.578Z", "code": "050013", "name": "Dignity Finance"},
{"id": "19c2baa4-e6fe-458e-bd2f-e7de09990202", "createdAt": "2023-10-13T20:00:00.580Z", "updatedAt": "2023-10-13T20:00:00.580Z", "code": "090294", "name": "EAGLE FLIGHT MICROFINANCE BANK"},
{"id": "bbbc2279-5afb-4495-a199-60f434d0e07b", "createdAt": "2023-10-13T20:00:00.586Z", "updatedAt": "2023-10-13T20:00:00.586Z", "code": "100021", "name": "EARTHOLEUM"},
{"id": "e6a1ffbd-12f2-40a9-8af8-5a19e014ca1c", "createdAt": "2023-10-13T20:00:00.590Z", "updatedAt": "2023-10-13T20:00:00.590Z", "code": "090156", "name": "E-BARCS MICROFINANCE BANK"},
{"id": "ce2ecaea-d9ac-4afa-987d-e03f2f9f2f42", "createdAt": "2023-10-13T20:00:00.594Z", "updatedAt": "2023-10-13T20:00:00.594Z", "code": "000010", "name": "ECOBANK"},
{"id": "7dd71db5-ec53-4533-a88e-084b79757619", "createdAt": "2023-10-13T20:00:00.596Z", "updatedAt": "2023-10-13T20:00:00.596Z", "code": "100008", "name": "ECOBANK XPRESS ACCOUNT"},
{"id": "e478a1a8-d0ed-4bac-8fe3-89e74981d212", "createdAt": "2023-10-13T20:00:00.599Z", "updatedAt": "2023-10-13T20:00:00.599Z", "code": "100030", "name": "ECOMOBILE"},
{"id": "bbc86cc4-3ede-4b31-bd4b-4a3fe216664b", "createdAt": "2023-10-13T20:00:00.603Z", "updatedAt": "2023-10-13T20:00:00.603Z", "code": "090310", "name": "EDFIN MICROFINANCE BANK"},
{"id": "f5e20cf7-f722-43fd-b7c3-53d4952552e2", "createdAt": "2023-10-13T20:00:00.606Z", "updatedAt": "2023-10-13T20:00:00.606Z", "code": "090097", "name": "EKONDO MICROFINANCE BANK"},
{"id": "304714c8-b081-4d6d-a721-87035a958f90", "createdAt": "2023-10-13T20:00:00.609Z", "updatedAt": "2023-10-13T20:00:00.609Z", "code": "090389", "name": "EK-RELIABLE MICROFINANCE BANK"},
{"id": "0651c5f3-41ec-488b-86e8-f269de2a9fc1", "createdAt": "2023-10-13T20:00:00.611Z", "updatedAt": "2023-10-13T20:00:00.611Z", "code": "090273", "name": "EMERALD MICROFINANCE BANK"},
{"id": "e28a94c9-76d1-4a45-8522-d512b5e1f9e2", "createdAt": "2023-10-13T20:00:00.618Z", "updatedAt": "2023-10-13T20:00:00.618Z", "code": "090114", "name": "EMPIRE TRUST MICROFINANCE BANK"},
{"id": "4cf90df3-fad7-459a-8451-b2b9d9524f73", "createdAt": "2023-10-13T20:00:00.621Z", "updatedAt": "2023-10-13T20:00:00.621Z", "code": "050012", "name": "Enco Finance"},
{"id": "73293262-ee11-4c55-9324-607c6790d4f8", "createdAt": "2023-10-13T20:00:00.624Z", "updatedAt": "2023-10-13T20:00:00.624Z", "code": "000019", "name": "ENTERPRISE BANK"},
{"id": "345cc766-5e0f-4b87-bf82-e4eca8a506d7", "createdAt": "2023-10-13T20:00:00.626Z", "updatedAt": "2023-10-13T20:00:00.626Z", "code": "090189", "name": "ESAN MICROFINANCE BANK"},
{"id": "17087701-ebf3-473c-92cc-f3b334ae53be", "createdAt": "2023-10-13T20:00:00.630Z", "updatedAt": "2023-10-13T20:00:00.630Z", "code": "090166", "name": "ESO-E MICROFINANCE BANK"},
{"id": "279325fd-c40c-4e81-a218-9facc2dad455", "createdAt": "2023-10-13T20:00:00.633Z", "updatedAt": "2023-10-13T20:00:00.633Z", "code": "100006", "name": "eTRANZACT"},
{"id": "3348b964-602f-4af2-b879-8affc526f47f", "createdAt": "2023-10-13T20:00:00.639Z", "updatedAt": "2023-10-13T20:00:00.639Z", "code": "090304", "name": "EVANGEL MICROFINANCE BANK"},
{"id": "562b4ee4-5de2-44f4-993b-4f54bf2404e0", "createdAt": "2023-10-13T20:00:00.644Z", "updatedAt": "2023-10-13T20:00:00.644Z", "code": "090332", "name": "EVERGREEN MICROFINANCE BANK"},
{"id": "4ef899d4-4514-4d8a-95c2-9c1e7efe132a", "createdAt": "2023-10-13T20:00:00.649Z", "updatedAt": "2023-10-13T20:00:00.649Z", "code": "090572", "name": "EWT Microfinance Bank"},
{"id": "e694aadd-2a61-405e-a67f-34efbc8e06c1", "createdAt": "2023-10-13T20:00:00.660Z", "updatedAt": "2023-10-13T20:00:00.660Z", "code": "090328", "name": "EYOWO"},
{"id": "a2f8eddd-87a5-4c65-92f3-53f363434839", "createdAt": "2024-05-04T14:30:50.290Z", "updatedAt": "2024-05-04T14:30:50.290Z", "code": "090551", "name": "FAIRMONEY"},
{"id": "bcc38643-9926-46aa-9c35-e8f2a4ba2b46", "createdAt": "2023-10-13T20:00:00.663Z", "updatedAt": "2023-10-13T20:00:00.663Z", "code": "050009", "name": "FAST CREDIT"},
{"id": "5dd01fde-2085-4351-a9bc-a605f8a12bb0", "createdAt": "2023-10-13T20:00:00.667Z", "updatedAt": "2023-10-13T20:00:00.667Z", "code": "090179", "name": "FAST MICROFINANCE BANK"},
{"id": "e5da7de4-baad-491b-a051-b821b0e82e9d", "createdAt": "2023-10-13T20:00:00.670Z", "updatedAt": "2023-10-13T20:00:00.670Z", "code": "060002", "name": "FBNQUEST MERCHANT BANK"},
{"id": "92696dc7-dc94-437c-a03b-d60607cb94d2", "createdAt": "2023-10-13T20:00:00.675Z", "updatedAt": "2023-10-13T20:00:00.675Z", "code": "090409", "name": "FCMB MFB"},
{"id": "f9049c12-d2c0-454d-b94b-bd32d8e616c5", "createdAt": "2023-10-13T20:00:00.680Z", "updatedAt": "2023-10-13T20:00:00.680Z", "code": "100031", "name": "FCMB MOBILE"},
{"id": "68071d8b-fffc-486b-ab05-c671a58bb652", "createdAt": "2023-10-13T20:00:00.684Z", "updatedAt": "2023-10-13T20:00:00.684Z", "code": "090290", "name": "FCT MICROFINANCE BANK"},
{"id": "4db9937d-5c3d-44e0-a3f4-63b3578e9067", "createdAt": "2023-10-13T20:00:00.687Z", "updatedAt": "2023-10-13T20:00:00.687Z", "code": "090398", "name": "FEDERAL POLYTECHNIC NEKEDE MICROFINANCE BANK"},
{"id": "1311a8e3-9735-41b9-a403-1992a68852bc", "createdAt": "2023-10-13T20:00:00.694Z", "updatedAt": "2023-10-13T20:00:00.694Z", "code": "090318", "name": "FEDERAL UNIVERSITY DUTSE MICROFINANCE BANK"},
{"id": "a80c81b2-9b2b-4d3d-88e4-70dc5d32e342", "createdAt": "2023-10-13T20:00:00.698Z", "updatedAt": "2023-10-13T20:00:00.698Z", "code": "090298", "name": "FEDPOLY NASARAWA MICROFINANCE BANK"},
{"id": "ecfee0b4-5398-49b1-8d57-b4778ebf3d4a", "createdAt": "2023-10-13T20:00:00.704Z", "updatedAt": "2023-10-13T20:00:00.704Z", "code": "100001", "name": "FETS"},
{"id": "e35e0944-1434-444d-8fa7-36f7a0353057", "createdAt": "2023-10-13T20:00:00.709Z", "updatedAt": "2023-10-13T20:00:00.709Z", "code": "090153", "name": "FFS MICROFINANCE BANK"},
{"id": "bcc1cad3-a72b-4e22-b256-1072c2ea24df", "createdAt": "2023-10-13T20:00:00.737Z", "updatedAt": "2023-10-13T20:00:00.737Z", "code": "070026", "name": "FHA MORTGAGE BANK LTD"},
{"id": "c7bff190-db6f-4d68-9cab-f93cefc9c665", "createdAt": "2023-10-13T20:00:00.743Z", "updatedAt": "2023-10-13T20:00:00.743Z", "code": "000007", "name": "FIDELITY BANK"},
{"id": "e1363d22-b883-4f8a-b766-d74eea955873", "createdAt": "2023-10-13T20:00:00.746Z", "updatedAt": "2023-10-13T20:00:00.746Z", "code": "100019", "name": "FIDELITY MOBILE"},
{"id": "94c96afa-3e2d-474d-8ba5-d95f0b2defe6", "createdAt": "2023-10-13T20:00:00.750Z", "updatedAt": "2023-10-13T20:00:00.750Z", "code": "090126", "name": "FIDFUND MICROFINANCE Bank"},
{"id": "70f212c0-ee9d-48c7-8eb1-0410d0419a0a", "createdAt": "2023-10-13T20:00:00.753Z", "updatedAt": "2023-10-13T20:00:00.753Z", "code": "090111", "name": "FINATRUST MICROFINANCE BANK"},
{"id": "0fdc5a02-6581-4d32-8af9-67d39fbcd81b", "createdAt": "2023-10-13T20:00:00.759Z", "updatedAt": "2023-10-13T20:00:00.759Z", "code": "090400", "name": "FINCA MICROFINANCE BANK"},
{"id": "ae6a51d4-1b3c-4f50-8977-09c0e407e059", "createdAt": "2023-10-13T20:00:00.763Z", "updatedAt": "2023-10-13T20:00:00.763Z", "code": "090366", "name": "FIRMUS MICROFINANCE BANK"},
{"id": "d30ffd5c-7881-426b-88e0-666e95051f93", "createdAt": "2023-10-13T20:00:00.767Z", "updatedAt": "2023-10-13T20:00:00.767Z", "code": "110004", "name": "FIRST APPLE LIMITED"},
{"id": "2dbdc7fa-902a-482b-a96c-75e214d8088d", "createdAt": "2023-10-13T20:00:00.771Z", "updatedAt": "2023-10-13T20:00:00.771Z", "code": "000016", "name": "FIRST BANK OF NIGERIA"},
{"id": "967ae55b-4ff8-445c-bf0d-88f0bf0fcb68", "createdAt": "2023-10-13T20:00:00.776Z", "updatedAt": "2023-10-13T20:00:00.776Z", "code": "000003", "name": "FIRST CITY MONUMENT BANK"},
{"id": "5149ae58-715c-47c0-aa7e-cd90163fd616", "createdAt": "2023-10-13T20:00:00.780Z", "updatedAt": "2023-10-13T20:00:00.780Z", "code": "070014", "name": "FIRST GENERATION MORTGAGE BANK"},
{"id": "8e9abd45-101e-4131-809d-5ca10df06fb3", "createdAt": "2023-10-13T20:00:00.787Z", "updatedAt": "2023-10-13T20:00:00.787Z", "code": "090575", "name": "FIRSTMIDAS MICROFINANCE BANK LTD"},
{"id": "8703b05f-827b-4ea7-b9bc-217c7a1b740b", "createdAt": "2023-10-13T20:00:00.792Z", "updatedAt": "2023-10-13T20:00:00.792Z", "code": "100014", "name": "FIRSTMONIE WALLET"},
{"id": "e41e7ebf-3e49-41e8-9041-526682dc749e", "createdAt": "2023-10-13T20:00:00.796Z", "updatedAt": "2023-10-13T20:00:00.796Z", "code": "090163", "name": "FIRST MULTIPLE MFB"},
{"id": "293b2c34-5351-408f-9810-e20104473b97", "createdAt": "2023-10-13T20:00:00.803Z", "updatedAt": "2023-10-13T20:00:00.803Z", "code": "090285", "name": "FIRST OPTION MICROFINANCE BANK"},
{"id": "c32d2e3d-4cf6-404f-a976-181b2cf6858f", "createdAt": "2023-10-13T20:00:00.806Z", "updatedAt": "2023-10-13T20:00:00.806Z", "code": "090164", "name": "FIRST ROYAL MICROFINANCE BANK"},
{"id": "0ba19637-133e-437b-abdd-d8e792bf45d2", "createdAt": "2023-10-13T20:00:00.810Z", "updatedAt": "2023-10-13T20:00:00.810Z", "code": "090107", "name": "FIRST TRUST MORTGAGE BANK PLC"},
{"id": "d292ae92-983d-4287-a1af-2764eb814f6e", "createdAt": "2023-10-13T20:00:00.815Z", "updatedAt": "2023-10-13T20:00:00.815Z", "code": "090614", "name": "Flourish MFB"},
{"id": "58e57283-4b51-4f53-a3be-ba0c8b5f9bd6", "createdAt": "2023-10-13T20:00:00.818Z", "updatedAt": "2023-10-13T20:00:00.818Z", "code": "110002", "name": "FLUTTERWAVE TECHNOLOGY SOLUTIONS LIMITED"},
{"id": "1d16d6f0-bc29-4b4f-877b-c6ac94be3cd6", "createdAt": "2023-10-13T20:00:00.821Z", "updatedAt": "2023-10-13T20:00:00.821Z", "code": "070002", "name": "FORTIS MICROFINANCE BANK"},
{"id": "043b64ab-f4b5-471a-b96e-c475df089fda", "createdAt": "2023-10-13T20:00:00.824Z", "updatedAt": "2023-10-13T20:00:00.824Z", "code": "100016", "name": "FORTIS MOBILE"},
{"id": "82955d9b-e84c-4047-a97c-c40a5d5bd1ff", "createdAt": "2023-10-13T20:00:00.828Z", "updatedAt": "2023-10-13T20:00:00.828Z", "code": "400001", "name": "FSDH"},
{"id": "b4ee7f68-c5dc-4deb-8dc1-1b646e1a500c", "createdAt": "2023-10-13T20:00:00.832Z", "updatedAt": "2023-10-13T20:00:00.832Z", "code": "090145", "name": "FULLRANGE MICROFINANCE BANK"},
{"id": "83f47c63-a69b-4432-9c30-fc1b25097fc2", "createdAt": "2023-10-13T20:00:00.839Z", "updatedAt": "2023-10-13T20:00:00.839Z", "code": "050010", "name": "FUNDQUEST FINANCIAL SERVICES"},
{"id": "a7ffb265-a289-48d8-8fd6-6e1f491a00dc", "createdAt": "2023-10-13T20:00:00.846Z", "updatedAt": "2023-10-13T20:00:00.846Z", "code": "090158", "name": "FUTO MICROFINANCE BANK"},
{"id": "99f71303-3364-4d80-8420-868668594d48", "createdAt": "2023-10-13T20:00:00.850Z", "updatedAt": "2023-10-13T20:00:00.850Z", "code": "090591", "name": "Gabsyn MFB"},
{"id": "e4b1e5fe-01ac-4bd3-abe5-dec1d058864a", "createdAt": "2023-10-13T20:00:00.862Z", "updatedAt": "2023-10-13T20:00:00.862Z", "code": "090168", "name": "GASHUA MICROFINANCE BANK"},
{"id": "2ed21d95-f16e-4ed3-b7ec-a2fcae02f372", "createdAt": "2023-10-13T20:00:00.871Z", "updatedAt": "2023-10-13T20:00:00.871Z", "code": "070009", "name": "GATEWAY MORTGAGE BANK"},
{"id": "cb7bf38f-ee8a-466c-a795-ccda685e0dbc", "createdAt": "2023-10-13T20:00:00.879Z", "updatedAt": "2023-10-13T20:00:00.879Z", "code": "090579", "name": "GBEDE Microfinance Bank"},
{"id": "21c66fb2-50af-4012-be74-81c28197c6c3", "createdAt": "2023-10-13T20:00:00.884Z", "updatedAt": "2023-10-13T20:00:00.884Z", "code": "090411", "name": "GiGinya Microfinance Bank"},
{"id": "93f68b59-7205-476a-9ca9-7390988c3c7d", "createdAt": "2023-10-13T20:00:00.888Z", "updatedAt": "2023-10-13T20:00:00.888Z", "code": "090186", "name": "GIREI MICROFINANACE BANK"},
{"id": "74895d06-10f1-4646-8e53-cec799618cea", "createdAt": "2023-10-13T20:00:00.893Z", "updatedAt": "2023-10-13T20:00:00.893Z", "code": "000027", "name": "GLOBUS BANK"},
{"id": "2c774729-69a2-4e83-92f8-3bae4b25fd74", "createdAt": "2023-10-13T20:00:00.896Z", "updatedAt": "2023-10-13T20:00:00.896Z", "code": "090278", "name": "GLORY MICROFINANCE BANK"},
{"id": "a55a46ef-76bb-4896-80ea-40eb8ad27772", "createdAt": "2023-10-13T20:00:00.901Z", "updatedAt": "2023-10-13T20:00:00.901Z", "code": "090408", "name": "GMB MICROFINANCE BANK"},
{"id": "b78332c4-8f56-4e19-a78f-7694c1943444", "createdAt": "2023-10-13T20:00:00.904Z", "updatedAt": "2023-10-13T20:00:00.904Z", "code": "090574", "name": "GOLDMAN MICROFINANCE BANK LTD"},
{"id": "3367b63b-d68d-423d-8e79-4402e39d6626", "createdAt": "2023-10-13T20:00:00.908Z", "updatedAt": "2023-10-13T20:00:00.908Z", "code": "090586", "name": "GOMBE MICROFINANCE BANK LTD"},
{"id": "6907bbf7-d4db-403e-9669-777e3411078d", "createdAt": "2023-10-13T20:00:00.912Z", "updatedAt": "2023-10-13T20:00:00.912Z", "code": "090122", "name": "GOWANS MICROFINANCE BANK"},
{"id": "6731d2e7-6fd7-4a51-a171-743d6b693f08", "createdAt": "2023-10-13T20:00:00.920Z", "updatedAt": "2023-10-13T20:00:00.920Z", "code": "090599", "name": "Greenacres MFB"},
{"id": "7342d620-bac2-4305-bace-f59522c18b94", "createdAt": "2023-10-13T20:00:00.924Z", "updatedAt": "2023-10-13T20:00:00.924Z", "code": "090178", "name": "GREENBANK MICROFINANCE BANK"},
{"id": "f2c64025-8667-4c98-80db-e7ca8ebe0ab6", "createdAt": "2023-10-13T20:00:00.927Z", "updatedAt": "2023-10-13T20:00:00.927Z", "code": "090269", "name": "GREENVILLE MICROFINANCE BANK"},
{"id": "ad5f10b1-c2e4-47ae-91ea-b894ac220ff0", "createdAt": "2023-10-13T20:00:00.929Z", "updatedAt": "2023-10-13T20:00:00.929Z", "code": "090195", "name": "GROOMING MICROFINANCE BANK"},
{"id": "97ec2202-f3b2-4841-aef2-173f917d18cb", "createdAt": "2023-10-13T20:00:00.933Z", "updatedAt": "2023-10-13T20:00:00.933Z", "code": "000013", "name": "GTBANK PLC"},
{"id": "3bf3b556-b8c2-402c-8f03-4510a9145cd5", "createdAt": "2023-10-13T20:00:00.940Z", "updatedAt": "2023-10-13T20:00:00.940Z", "code": "090385", "name": "GTI MICROFINANCE BANK"},
{"id": "3bf9ac3b-d204-4c61-8bef-4bdcc26ec5c3", "createdAt": "2023-10-13T20:00:00.944Z", "updatedAt": "2023-10-13T20:00:00.944Z", "code": "100009", "name": "GT MOBILE"},
{"id": "2bd04d20-340b-4a3d-86a6-fdf98d09699d", "createdAt": "2023-10-13T20:00:00.946Z", "updatedAt": "2023-10-13T20:00:00.946Z", "code": "090147", "name": "HACKMAN MICROFINANCE BANK"},
{"id": "55e33413-f195-47c7-ac2e-77bbfb8d80d7", "createdAt": "2023-10-13T20:00:00.949Z", "updatedAt": "2023-10-13T20:00:00.949Z", "code": "070017", "name": "HAGGAI MORTGAGE BANK LIMITED"},
{"id": "589a2614-a40e-4b49-b010-bcd183abea46", "createdAt": "2023-10-13T20:00:00.955Z", "updatedAt": "2023-10-13T20:00:00.955Z", "code": "090121", "name": "HASAL MICROFINANCE BANK"},
{"id": "d59c9a98-321e-4944-ab16-920cac1609c0", "createdAt": "2023-10-13T20:00:00.960Z", "updatedAt": "2023-10-13T20:00:00.960Z", "code": "090363", "name": "HEADWAY MICROFINANCE BANK"},
{"id": "ad61edd6-812b-4878-9bf1-3144f89f610f", "createdAt": "2023-10-13T20:00:00.962Z", "updatedAt": "2023-10-13T20:00:00.962Z", "code": "100017", "name": "HEDONMARK"},
{"id": "38cff360-7a03-4a21-a63a-62ca74e4a069", "createdAt": "2023-10-13T20:00:00.964Z", "updatedAt": "2023-10-13T20:00:00.964Z", "code": "000020", "name": "HERITAGE BANK"},
{"id": "18bc9596-4eb5-4d6c-9dcb-a92c8f51936e", "createdAt": "2023-10-13T20:00:00.966Z", "updatedAt": "2023-10-13T20:00:00.966Z", "code": "120002", "name": "HOPEPSB"},
{"id": "71c929b3-09af-4df6-89a4-44758c0c3548", "createdAt": "2023-10-13T20:00:00.968Z", "updatedAt": "2023-10-13T20:00:00.968Z", "code": "090598", "name": "IBA MFB"},
{"id": "4ab57a1c-cc7b-4065-81c9-d20f273942a6", "createdAt": "2023-10-13T20:00:00.971Z", "updatedAt": "2023-10-13T20:00:00.971Z", "code": "090118", "name": "IBILE MICROFINANCE BANK"},
{"id": "e5daa513-d739-46e6-888f-82db7e5c0650", "createdAt": "2023-10-13T20:00:00.973Z", "updatedAt": "2023-10-13T20:00:00.973Z", "code": "090324", "name": "IKENNE MICROFINANCE BANK"},
{"id": "7053cde5-02b1-4545-b64b-8210899fb474", "createdAt": "2023-10-13T20:00:00.976Z", "updatedAt": "2023-10-13T20:00:00.976Z", "code": "090279", "name": "IKIRE MICROFINANCE BANK"},
{"id": "47b4128f-7ece-489f-98e9-54e242b9f157", "createdAt": "2023-10-13T20:00:00.979Z", "updatedAt": "2023-10-13T20:00:00.979Z", "code": "090275", "name": "IKIRE MICROFINANCE BANK"},
{"id": "9fd647a7-cb79-47a1-8441-5d14340665e2", "createdAt": "2023-10-13T20:00:00.981Z", "updatedAt": "2023-10-13T20:00:00.981Z", "code": "090571", "name": "ILARO POLY MICROFINANCE BANK LTD"},
{"id": "99750a4a-334f-4a02-b676-83a0ae12f6cd", "createdAt": "2023-10-13T20:00:00.983Z", "updatedAt": "2023-10-13T20:00:00.983Z", "code": "090370", "name": "ILISAN MICROFINANCE BANK"},
{"id": "009baa3e-03d5-4da0-bec0-77aaae0ecdad", "createdAt": "2023-10-13T20:00:00.985Z", "updatedAt": "2023-10-13T20:00:00.985Z", "code": "090258", "name": "IMO STATE MICROFINANCE BANK"},
{"id": "2f809e85-0437-4546-b313-c0748dc2adce", "createdAt": "2023-10-13T20:00:00.988Z", "updatedAt": "2023-10-13T20:00:00.988Z", "code": "090417", "name": "Imowo Microfinance Bank"},
{"id": "46a5548a-7946-420a-90ca-01310bcd63dd", "createdAt": "2023-10-13T20:00:00.990Z", "updatedAt": "2023-10-13T20:00:00.990Z", "code": "100024", "name": "IMPERIAL HOMES MORTGAGE BANK"},
{"id": "62670a79-6603-414b-b594-ba4fe17eb791", "createdAt": "2023-10-13T20:00:00.992Z", "updatedAt": "2023-10-13T20:00:00.992Z", "code": "090157", "name": "INFINITY MICROFINANCE BANK"},
{"id": "a05352a2-76ff-4321-967b-9bb92d683efe", "createdAt": "2023-10-13T20:00:00.994Z", "updatedAt": "2023-10-13T20:00:00.994Z", "code": "070016", "name": "INFINITY TRUST MORTGAGE BANK"},
{"id": "84d8064c-e0cc-4333-b2cd-3f7d0ed9c5dc", "createdAt": "2023-10-13T20:00:00.999Z", "updatedAt": "2023-10-13T20:00:00.999Z", "code": "100029", "name": "INNOVECTIVES KESH"},
{"id": "db341cf7-b0ec-41cf-a6ea-1807c7ed85f6", "createdAt": "2023-10-13T20:00:01.001Z", "updatedAt": "2023-10-13T20:00:01.001Z", "code": "100027", "name": "INTELLIFIN"},
{"id": "970ce5c7-b45f-4d81-bd85-be1be447b5fd", "createdAt": "2023-10-13T20:00:01.004Z", "updatedAt": "2023-10-13T20:00:01.004Z", "code": "090386", "name": "INTERLAND MICROFINANCE BANK"},
{"id": "c4a3cab5-fc46-447a-bca4-8e580bbe656e", "createdAt": "2023-10-13T20:00:01.006Z", "updatedAt": "2023-10-13T20:00:01.006Z", "code": "110003", "name": "INTERSWITCH LIMITED"},
{"id": "3b21e7f9-5f17-430f-acb6-445b51460f0a", "createdAt": "2023-10-13T20:00:01.009Z", "updatedAt": "2023-10-13T20:00:01.009Z", "code": "090149", "name": "IRL MICROFINANCE BANK"},
{"id": "d0792c05-fee2-4610-a85b-c2b6ff96250e", "createdAt": "2023-10-13T20:00:01.012Z", "updatedAt": "2023-10-13T20:00:01.012Z", "code": "090377", "name": "ISALEOYO MICROFINANCE BANK"},
{"id": "553de8f9-1043-4bb1-94f5-4b7393b5001b", "createdAt": "2023-10-13T20:00:01.014Z", "updatedAt": "2023-10-13T20:00:01.014Z", "code": "090584", "name": "ISLAND MICROFINANCE BANK LTD"},
{"id": "d2bcdf0d-c62f-444d-838f-d354566dc05b", "createdAt": "2023-10-13T20:00:01.016Z", "updatedAt": "2023-10-13T20:00:01.016Z", "code": "090578", "name": "IWADE MICROFINANCE BANK LTD"},
{"id": "a6303cde-4fbe-4187-9aaf-28528bbb0656", "createdAt": "2023-10-13T20:00:01.018Z", "updatedAt": "2023-10-13T20:00:01.018Z", "code": "090570", "name": "IYAMOYE MICROFINANCE BANK LTD"},
{"id": "12c87604-1e09-4d12-8cb9-a1c02b919315", "createdAt": "2023-10-13T20:00:01.023Z", "updatedAt": "2023-10-13T20:00:01.023Z", "code": "000006", "name": "JAIZ BANK"},
{"id": "7019f32a-1525-452c-89ea-7223c540b6a9", "createdAt": "2023-10-13T20:00:01.026Z", "updatedAt": "2023-10-13T20:00:01.026Z", "code": "090003", "name": "JUBILEE LIFE"},
{"id": "4b0da1ff-d642-4456-87b2-b1f0205dea60", "createdAt": "2023-10-13T20:00:01.028Z", "updatedAt": "2023-10-13T20:00:01.028Z", "code": "090320", "name": "KADPOLY MICROFINANCE BANK"},
{"id": "897e6d64-0856-4f8d-a838-5c5df745f2d9", "createdAt": "2023-10-13T20:00:01.031Z", "updatedAt": "2023-10-13T20:00:01.031Z", "code": "090592", "name": "Kano Poly MFB"},
{"id": "7ccf0c4c-8426-4d00-ae07-09cec0597b2e", "createdAt": "2023-10-13T20:00:01.033Z", "updatedAt": "2023-10-13T20:00:01.033Z", "code": "090191", "name": "KCMB MICROFINANCE BANK"},
{"id": "46bfdbd3-1cbe-4792-9b79-3c69011bc90c", "createdAt": "2023-10-13T20:00:01.035Z", "updatedAt": "2023-10-13T20:00:01.035Z", "code": "100036", "name": "KEGOW(CHAMSMOBILE)"},
{"id": "a4793956-3663-4615-bee7-761e32169ecd", "createdAt": "2023-10-13T20:00:01.038Z", "updatedAt": "2023-10-13T20:00:01.038Z", "code": "090602", "name": "KENECHUKWU MICROFINANCE BANK"},
{"id": "7ec1bc0d-a5b1-4a43-aba9-6d5de28aaf87", "createdAt": "2023-10-13T20:00:01.040Z", "updatedAt": "2023-10-13T20:00:01.040Z", "code": "000002", "name": "KEYSTONE BANK"},
{"id": "97bcafe7-62a1-41e0-8bab-d94cd899f82b", "createdAt": "2023-10-13T20:00:01.042Z", "updatedAt": "2023-10-13T20:00:01.042Z", "code": "090299", "name": "KONTAGORA MICROFINANCE BANK"},
{"id": "15b5aa40-a92c-493e-8573-aa497c8cdee5", "createdAt": "2023-10-13T20:00:01.045Z", "updatedAt": "2023-10-13T20:00:01.045Z", "code": "090380", "name": "KREDI MONEY MICROFINANCE BANK"},
{"id": "0e9e673f-10b5-42b3-bec5-193fd2cb8043", "createdAt": "2023-10-13T20:00:01.047Z", "updatedAt": "2023-10-13T20:00:01.047Z", "code": "090267", "name": "KUDA MICROFINANCE BANK"},
{"id": "070414cf-a264-447f-ba7f-0f462d8cb612", "createdAt": "2023-10-13T20:00:01.050Z", "updatedAt": "2023-10-13T20:00:01.050Z", "code": "070012", "name": "LAGOS BUILDING AND INVESTMENT COMPANY"},
{"id": "76cfb0fe-c837-4fc4-8a7f-a2b394f53bd0", "createdAt": "2023-10-13T20:00:01.055Z", "updatedAt": "2023-10-13T20:00:01.055Z", "code": "090422", "name": "Landgold  Microfinance Bank"},
{"id": "21b5460a-59f1-4b31-ba46-fa93631795be", "createdAt": "2023-10-13T20:00:01.058Z", "updatedAt": "2023-10-13T20:00:01.058Z", "code": "090177", "name": "LAPO MICROFINANCE BANK"},
{"id": "86ef9555-b141-4802-86a3-f5421b751bdf", "createdAt": "2023-10-13T20:00:01.060Z", "updatedAt": "2023-10-13T20:00:01.060Z", "code": "090271", "name": "LAVENDER MICROFINANCE BANK"},
{"id": "89aa73ef-9306-444b-924e-8a83533757a4", "createdAt": "2023-10-13T20:00:01.063Z", "updatedAt": "2023-10-13T20:00:01.063Z", "code": "110044", "name": "Leadremit Limited"},
{"id": "b7454037-564a-4ef5-be60-c11db112f181", "createdAt": "2023-10-13T20:00:01.065Z", "updatedAt": "2023-10-13T20:00:01.065Z", "code": "090372", "name": "LEGEND MICROFINANCE BANK"},
{"id": "a497de5b-f7bb-4ccb-b223-0ebb5ca2e167", "createdAt": "2023-10-13T20:00:01.067Z", "updatedAt": "2023-10-13T20:00:01.067Z", "code": "090420", "name": "LETSHEGO MICROFINANCE BANK"},
{"id": "b615a277-71a4-4fe4-a627-b9aba63172cb", "createdAt": "2023-10-13T20:00:01.070Z", "updatedAt": "2023-10-13T20:00:01.070Z", "code": "070007", "name": "LIVINGTRUST MORTGAGE BANK PLC"},
{"id": "44a994e0-00cd-45c0-9649-449b3db0a9d9", "createdAt": "2024-05-10T16:32:58.173Z", "updatedAt": "2024-05-10T16:32:58.173Z", "code": "090620", "name": "LOMA BANK"},
{"id": "d5e2d55d-e325-4f45-b25a-cff9085d6b13", "createdAt": "2023-10-13T20:00:01.072Z", "updatedAt": "2023-10-13T20:00:01.072Z", "code": "090265", "name": "LOVONUS MICROFINANCE BANK"},
{"id": "41a78c59-1720-4314-ab15-068574e57549", "createdAt": "2023-10-13T20:00:01.075Z", "updatedAt": "2023-10-13T20:00:01.075Z", "code": "100035", "name": "M36"},
{"id": "ac3ee1ea-0241-473e-9653-0e37d4763453", "createdAt": "2023-10-13T20:00:01.077Z", "updatedAt": "2023-10-13T20:00:01.077Z", "code": "090603", "name": "Macrod MFB"},
{"id": "f48f65cf-160b-49ae-ac13-44c9c17caad1", "createdAt": "2023-10-13T20:00:01.079Z", "updatedAt": "2023-10-13T20:00:01.079Z", "code": "090323", "name": "MAINLAND MICROFINANCE BANK"},
{"id": "25a176bd-0c80-4515-99e8-515249ee08ab", "createdAt": "2023-10-13T20:00:01.081Z", "updatedAt": "2023-10-13T20:00:01.081Z", "code": "090171", "name": "MAINSTREET MICROFINANCE BANK"},
{"id": "f6f4bc0e-7b57-45fe-a43d-68309ba8b255", "createdAt": "2023-10-13T20:00:01.084Z", "updatedAt": "2023-10-13T20:00:01.084Z", "code": "090174", "name": "MALACHY MICROFINANCE BANK"},
{"id": "ea14106b-af2a-44f9-9455-30b2dfbc0bff", "createdAt": "2023-10-13T20:00:01.086Z", "updatedAt": "2023-10-13T20:00:01.086Z", "code": "090383", "name": "MANNY MICROFINANCE BANK"},
{"id": "231154be-5718-45b9-b713-59d00351c1b6", "createdAt": "2023-10-13T20:00:01.088Z", "updatedAt": "2023-10-13T20:00:01.088Z", "code": "090410", "name": "MARITIME MICROFINANCE BANK"},
{"id": "b9198492-8db6-4ab3-a005-196cb9b256f7", "createdAt": "2023-10-13T20:00:01.091Z", "updatedAt": "2023-10-13T20:00:01.091Z", "code": "090321", "name": "MAYFAIR MICROFINANCE BANK"},
{"id": "700ccce9-1986-4ccc-9a45-951a2c6088c6", "createdAt": "2023-10-13T20:00:01.093Z", "updatedAt": "2023-10-13T20:00:01.093Z", "code": "070019", "name": "MAYFRESH MORTGAGE BANK"},
{"id": "8660483f-77bd-4bad-a7c3-1fca1509c400", "createdAt": "2023-10-13T20:00:01.095Z", "updatedAt": "2023-10-13T20:00:01.095Z", "code": "090612", "name": "Medef MFB"},
{"id": "b166940e-3212-400c-b058-5605a6d2d89a", "createdAt": "2023-10-13T20:00:01.097Z", "updatedAt": "2023-10-13T20:00:01.097Z", "code": "090280", "name": "MEGAPRAISE MICROFINANCE BANK"},
{"id": "b8f02ee3-61dd-47c8-a673-8ac62b1ece2c", "createdAt": "2023-10-13T20:00:01.100Z", "updatedAt": "2023-10-13T20:00:01.100Z", "code": "090589", "name": "MERCURY MICROFINANCE BANK"},
{"id": "753e011d-18bb-4cad-96c4-054b378ced6a", "createdAt": "2023-10-13T20:00:01.102Z", "updatedAt": "2023-10-13T20:00:01.102Z", "code": "090587", "name": "Microbiz MFB"},
{"id": "76d04caf-7aa0-46ec-931a-127df73acf45", "createdAt": "2023-10-13T20:00:01.105Z", "updatedAt": "2023-10-13T20:00:01.105Z", "code": "090136", "name": "MICROCRED MICROFINANCE BANK"},
{"id": "4cd85706-30de-41f8-96fb-339cba86b6d0", "createdAt": "2023-10-13T20:00:01.107Z", "updatedAt": "2023-10-13T20:00:01.107Z", "code": "090113", "name": "MICROVIS MICROFINANCE BANK"},
{"id": "187887ee-68b2-441c-bf91-4db86f6583d1", "createdAt": "2023-10-13T20:00:01.109Z", "updatedAt": "2023-10-13T20:00:01.109Z", "code": "090192", "name": "MIDLAND MICROFINANCE BANK"},
{"id": "51c68791-80b4-4b9b-bf43-2b7f1cc673f5", "createdAt": "2023-10-13T20:00:01.111Z", "updatedAt": "2023-10-13T20:00:01.111Z", "code": "090281", "name": "MINT-FINEX MFB"},
{"id": "cea978de-7774-4adc-811e-1d6133af04c1", "createdAt": "2023-10-13T20:00:01.114Z", "updatedAt": "2023-10-13T20:00:01.114Z", "code": "090455", "name": "MKOBO MICROFINANCE BANK LTD"},
{"id": "94a7e8a0-804f-4134-815e-b13a570e51af", "createdAt": "2023-10-13T20:00:01.116Z", "updatedAt": "2023-10-13T20:00:01.116Z", "code": "100011", "name": "MKUDI"},
{"id": "322b2cee-e838-4b7c-a190-26b2c7260b6e", "createdAt": "2023-10-13T20:00:01.119Z", "updatedAt": "2023-10-13T20:00:01.119Z", "code": "090362", "name": "MOLUSI MICROFINANCE BANK"},
{"id": "2a16685a-8d93-4ede-8e4b-8f2073c6a30b", "createdAt": "2023-10-13T20:00:01.122Z", "updatedAt": "2023-10-13T20:00:01.122Z", "code": "100020", "name": "MONEY BOX"},
{"id": "640d452e-de46-4e33-a5a1-528e0589c3fa", "createdAt": "2023-10-13T20:00:01.124Z", "updatedAt": "2023-10-13T20:00:01.124Z", "code": "090129", "name": "MONEY TRUST MICROFINANCE BANK"},
{"id": "a6911dec-3352-43e4-9ef2-8838d0a1f637", "createdAt": "2023-10-13T20:00:01.299Z", "updatedAt": "2023-10-13T20:00:01.299Z", "code": "090405", "name": "MONIEPOINT MICROFINANCE BANK"},
{"id": "afd517ca-8a38-4040-aaac-e51bdd561eed", "createdAt": "2023-10-13T20:00:01.127Z", "updatedAt": "2023-10-13T20:00:01.127Z", "code": "090392", "name": "MOZFIN MICROFINANCE BANK"},
{"id": "c3ff60d6-13ad-4c29-975d-18529920a848", "createdAt": "2023-10-13T20:00:01.130Z", "updatedAt": "2023-10-13T20:00:01.130Z", "code": "090190", "name": "MUTUAL BENEFITS MICROFINANCE BANK"},
{"id": "118d511d-a142-4026-ab25-4affb007957b", "createdAt": "2023-10-13T20:00:01.132Z", "updatedAt": "2023-10-13T20:00:01.132Z", "code": "090151", "name": "MUTUAL TRUST MICROFINANCE BANK"},
{"id": "9698f97c-c37d-49f6-b7a9-28a85fcab148", "createdAt": "2023-10-13T20:00:01.135Z", "updatedAt": "2023-10-13T20:00:01.135Z", "code": "090152", "name": "NAGARTA MICROFINANCE BANK"},
{"id": "2df09c7b-285f-4d88-8d6d-b334a84f8958", "createdAt": "2023-10-13T20:00:01.137Z", "updatedAt": "2023-10-13T20:00:01.137Z", "code": "code", "name": "name"},
{"id": "ddae0ff6-cec3-4e2c-a67e-f*******9796", "createdAt": "2023-10-13T20:00:01.140Z", "updatedAt": "2023-10-13T20:00:01.140Z", "code": "090128", "name": "NDIORAH MICROFINANCE BANK"},
{"id": "9baf628d-7aa9-4004-a630-9e1702192ef6", "createdAt": "2023-10-13T20:00:01.143Z", "updatedAt": "2023-10-13T20:00:01.143Z", "code": "090329", "name": "NEPTUNE MICROFINANCE BANK"},
{"id": "5d3cd937-47c5-458d-a4d3-eeaa5a29a9bc", "createdAt": "2023-10-13T20:00:01.145Z", "updatedAt": "2023-10-13T20:00:01.145Z", "code": "090205", "name": "NEW DAWN MICROFINANCE BANK"},
{"id": "eacd870b-7fe5-410c-95a2-2239f75d664e", "createdAt": "2023-10-13T20:00:01.148Z", "updatedAt": "2023-10-13T20:00:01.148Z", "code": "090378", "name": "NEW GOLDEN PASTURES MICROFINANCE BANK"},
{"id": "da3dda1a-7bc9-4f1b-9772-76d0b606a3ab", "createdAt": "2023-10-13T20:00:01.155Z", "updatedAt": "2023-10-13T20:00:01.155Z", "code": "090108", "name": "NEW PRUDENTIAL BANK"},
{"id": "d26f7932-f005-4c67-9299-f4cb88763d44", "createdAt": "2023-10-13T20:00:01.158Z", "updatedAt": "2023-10-13T20:00:01.158Z", "code": "090263", "name": "NIGERIAN NAVY MICROFINANCE BANK"},
{"id": "6e800dce-2583-4dfe-a81e-f9385769629f", "createdAt": "2023-10-13T20:00:01.161Z", "updatedAt": "2023-10-13T20:00:01.161Z", "code": "999999", "name": "NIP VIRTUAL BANK"},
{"id": "57b0b579-04ac-403a-89e1-e5152ab8d084", "createdAt": "2023-10-13T20:00:01.164Z", "updatedAt": "2023-10-13T20:00:01.164Z", "code": "090194", "name": "NIRSAL NATIONAL MICROFINANCE BANK"},
{"id": "b167ad36-17ff-44d3-b2bc-64db392290ea", "createdAt": "2023-10-13T20:00:01.166Z", "updatedAt": "2023-10-13T20:00:01.166Z", "code": "090283", "name": "NNEW WOMEN MICROFINANCE BANK"},
{"id": "a224d0d9-f06c-4fb8-b8d2-ac249a378178", "createdAt": "2023-10-13T20:00:01.169Z", "updatedAt": "2023-10-13T20:00:01.169Z", "code": "060003", "name": "NOVA MERCHANT BANK"},
{"id": "1ed99782-8ba4-4136-bc0d-83f3c4c2aa10", "createdAt": "2023-10-13T20:00:01.171Z", "updatedAt": "2023-10-13T20:00:01.171Z", "code": "100032", "name": "NOWNOW DIGITAL SYSTEMS LIMITED"},
{"id": "e68b7cf7-9b0c-4f16-8bd7-734a625b0963", "createdAt": "2023-10-13T20:00:01.174Z", "updatedAt": "2023-10-13T20:00:01.174Z", "code": "070001", "name": "NPF MICROFINANCE BANK"},
{"id": "92cc4211-4484-4273-8193-429ff9facf82", "createdAt": "2023-10-13T20:00:01.176Z", "updatedAt": "2023-10-13T20:00:01.176Z", "code": "090364", "name": "NUTURE MICROFINANCE BANK"},
{"id": "63d24db3-bd29-48b5-99a6-6c2175119f3f", "createdAt": "2023-10-13T20:00:01.179Z", "updatedAt": "2023-10-13T20:00:01.179Z", "code": "090399", "name": "NWANNEGADI MICROFINANCE BANK"},
{"id": "5bf52bbb-7969-4795-95a5-86a8d41787b5", "createdAt": "2023-10-13T20:00:01.182Z", "updatedAt": "2023-10-13T20:00:01.182Z", "code": "090345", "name": "OAU MICROFINANCE BANK LTD"},
{"id": "00814f35-70c4-4f07-ad35-df037c73510a", "createdAt": "2023-10-13T20:00:01.185Z", "updatedAt": "2023-10-13T20:00:01.185Z", "code": "090333", "name": "OCHE MICROFINANCE BANK"},
{"id": "1a158132-0994-4ba3-81e4-1b69bf2dfdc0", "createdAt": "2023-10-13T20:00:01.188Z", "updatedAt": "2023-10-13T20:00:01.188Z", "code": "090576", "name": "OCTOPUS MICROFINANCE BANK LTD"},
{"id": "6d4cf56b-b9d4-46de-82d0-e32dba4f5b1d", "createdAt": "2023-10-13T20:00:01.191Z", "updatedAt": "2023-10-13T20:00:01.191Z", "code": "090119", "name": "OHAFIA MICROFINANCE BANK"},
{"id": "3da1d689-1cb1-4a7c-b477-8db676ecfc88", "createdAt": "2023-10-13T20:00:01.194Z", "updatedAt": "2023-10-13T20:00:01.194Z", "code": "090161", "name": "OKPOGA MICROFINANCE BANK"},
{"id": "3d886ac1-b8ca-44d2-b509-1f2ebcd32d1e", "createdAt": "2023-10-13T20:00:01.196Z", "updatedAt": "2023-10-13T20:00:01.196Z", "code": "090272", "name": "OLABISI ONABANJO UNIVERSITY MICROFINANCE"},
{"id": "1e5990a6-0d53-4e5e-89a6-29a4ebab0b20", "createdAt": "2023-10-13T20:00:01.199Z", "updatedAt": "2023-10-13T20:00:01.199Z", "code": "090404", "name": "OLOWOLAGBA MICROFINANCE BANK"},
{"id": "235478ad-1e8d-426f-a5a8-dca2b38b333f", "createdAt": "2023-10-13T20:00:01.202Z", "updatedAt": "2023-10-13T20:00:01.202Z", "code": "090295", "name": "OMIYE MICROFINANCE BANK"},
{"id": "3fcda460-a19d-476c-be2f-f447314dfd18", "createdAt": "2023-10-13T20:00:01.204Z", "updatedAt": "2023-10-13T20:00:01.204Z", "code": "100004", "name": "OPAY"},
{"id": "b13e9165-efe3-4883-bab4-919ddeb1cfc0", "createdAt": "2023-10-13T20:00:01.206Z", "updatedAt": "2023-10-13T20:00:01.206Z", "code": "000036", "name": "OPTIMUS BANK"},
{"id": "f7c1c018-8ff5-400a-83a8-f3e7a384b074", "createdAt": "2023-10-13T20:00:01.209Z", "updatedAt": "2023-10-13T20:00:01.209Z", "code": "090588", "name": "Orisun MFB"},
{"id": "2152860a-7452-483a-879c-8ffa4570e6bd", "createdAt": "2023-10-13T20:00:01.212Z", "updatedAt": "2023-10-13T20:00:01.212Z", "code": "090396", "name": "OSCOTECH MICROFINANCE BANK"},
{"id": "736536d8-d74e-4ae8-979f-50c1db3c9837", "createdAt": "2023-10-13T20:00:01.216Z", "updatedAt": "2023-10-13T20:00:01.216Z", "code": "090580", "name": "OTECH MICROFINANCE BANK LTD"},
{"id": "d4929787-c09e-4b8d-9e13-0a26d1929ce8", "createdAt": "2023-10-13T20:00:01.218Z", "updatedAt": "2023-10-13T20:00:01.218Z", "code": "100002", "name": "PAGA"},
{"id": "ddaa0ec8-6c61-45d9-a248-ad7c3936d3e2", "createdAt": "2023-10-13T20:00:01.221Z", "updatedAt": "2023-10-13T20:00:01.221Z", "code": "070008", "name": "PAGE MFBank"},
{"id": "315def57-50bc-418e-a2d4-0949b701230f", "createdAt": "2023-10-13T20:00:01.224Z", "updatedAt": "2023-10-13T20:00:01.224Z", "code": "100033", "name": "PALMPAY"},
{"id": "aedebfa5-c48f-4d7b-9fbc-f9950a7ee8a7", "createdAt": "2023-10-13T20:00:01.227Z", "updatedAt": "2023-10-13T20:00:01.227Z", "code": "090004", "name": "PARALLEX"},
{"id": "2e57dde9-876a-4dc5-9112-514cbd555857", "createdAt": "2023-10-13T20:00:01.230Z", "updatedAt": "2023-10-13T20:00:01.230Z", "code": "100003", "name": "PARKWAY-READYCASH"},
{"id": "9b35e707-c9f0-4cb6-9568-87458faf85aa", "createdAt": "2023-10-13T20:00:01.233Z", "updatedAt": "2023-10-13T20:00:01.233Z", "code": "090317", "name": "PATRICKGOLD MICROFINANCE BANK"},
{"id": "05683ee3-d80f-4e4e-9d65-bb05dc30969c", "createdAt": "2023-10-13T20:00:01.236Z", "updatedAt": "2023-10-13T20:00:01.236Z", "code": "110001", "name": "PAYATTITUDE ONLINE"},
{"id": "8a205a18-efd1-4662-8072-77a91150cbba", "createdAt": "2023-10-13T20:00:01.239Z", "updatedAt": "2023-10-13T20:00:01.239Z", "code": "110006", "name": "PAYSTACK PAYMENT LIMITED"},
{"id": "e71be235-d4f2-4df1-80c3-e90f2267247e", "createdAt": "2023-10-13T20:00:01.242Z", "updatedAt": "2023-10-13T20:00:01.242Z", "code": "090402", "name": "Peace Microfinance Bank"},
{"id": "86f46021-3601-4ea6-8415-69e526e6d4c4", "createdAt": "2023-10-13T20:00:01.244Z", "updatedAt": "2023-10-13T20:00:01.244Z", "code": "090137", "name": "PECANTRUST MICROFINANCE BANK"},
{"id": "643d54ff-67d6-4dca-a0fb-bedfd7a7de6f", "createdAt": "2023-10-13T20:00:01.246Z", "updatedAt": "2023-10-13T20:00:01.246Z", "code": "090196", "name": "PENNYWISE MICROFINANCE BANK"},
{"id": "7f0a9719-bcb2-4302-941f-09d228cd776e", "createdAt": "2023-10-13T20:00:01.248Z", "updatedAt": "2023-10-13T20:00:01.248Z", "code": "090135", "name": "PERSONAL TRUST MICROFINANCE BANK"},
{"id": "4e849f28-ee83-4285-85d2-50da7b867c61", "createdAt": "2023-10-13T20:00:01.250Z", "updatedAt": "2023-10-13T20:00:01.250Z", "code": "90165", "name": "PETRA MICROFINANCE BANK"},
{"id": "fdd38041-4071-4ca9-8266-6a942804724d", "createdAt": "2023-10-13T20:00:01.253Z", "updatedAt": "2023-10-13T20:00:01.253Z", "code": "090165", "name": "PETRA MICROFINANCE BANK"},
{"id": "294acecd-9316-4b99-bd63-fa5843afae62", "createdAt": "2023-10-13T20:00:01.255Z", "updatedAt": "2023-10-13T20:00:01.255Z", "code": "090289", "name": "PILLAR MICROFINANCE BANK"},
{"id": "b0a4ed68-c7ee-4a0b-a0db-26ab7d1ba1c0", "createdAt": "2023-10-13T20:00:01.258Z", "updatedAt": "2023-10-13T20:00:01.258Z", "code": "070013", "name": "PLATINUM MORTGAGE BANK"},
{"id": "79903355-7515-4d0b-a18d-08209e1853b8", "createdAt": "2023-10-13T20:00:01.260Z", "updatedAt": "2023-10-13T20:00:01.260Z", "code": "000008", "name": "POLARIS BANK"},
{"id": "53468e46-e480-4ddf-8517-5efa9a233927", "createdAt": "2023-10-13T20:00:01.263Z", "updatedAt": "2023-10-13T20:00:01.263Z", "code": "090296", "name": "POLYUNWANA MICROFINANCE BANK"},
{"id": "2f322799-5561-4cfb-af84-cb35754e3742", "createdAt": "2023-10-13T20:00:01.265Z", "updatedAt": "2023-10-13T20:00:01.265Z", "code": "090412", "name": "Preeminent Microfinance Bank"},
{"id": "5ef16b36-5af6-4823-bda4-06f2ce97136b", "createdAt": "2023-10-13T20:00:01.267Z", "updatedAt": "2023-10-13T20:00:01.267Z", "code": "090274", "name": "PRESTIGE MICROFINANCE BANK"},
{"id": "62286fc1-d43e-4518-947d-f44c2a48c2de", "createdAt": "2023-10-13T20:00:01.270Z", "updatedAt": "2023-10-13T20:00:01.270Z", "code": "000023", "name": "PROVIDUS BANK"},
{"id": "1bbdfc17-e0da-49fb-b51e-c623b0e5c3cb", "createdAt": "2023-10-13T20:00:01.272Z", "updatedAt": "2023-10-13T20:00:01.272Z", "code": "090303", "name": "PURPLEMONEY MICROFINANCE BANK"},
{"id": "36f80000-28e7-481c-b58b-ea4767d6b939", "createdAt": "2023-10-13T20:00:01.275Z", "updatedAt": "2023-10-13T20:00:01.275Z", "code": "090569", "name": "QUBE MICROFINANCE BANK LTD"},
{"id": "f02c6b22-6fcc-4e8e-9899-310601c7aacd", "createdAt": "2023-10-13T20:00:01.277Z", "updatedAt": "2023-10-13T20:00:01.277Z", "code": "090261", "name": "QUICKFUND MICROFINANCE BANK"},
{"id": "da2fb3d7-5a5d-4fab-a617-29b32f2784ea", "createdAt": "2023-10-13T20:00:01.280Z", "updatedAt": "2023-10-13T20:00:01.280Z", "code": "090170", "name": "RAHAMA MFB"},
{"id": "d4ee853e-7f9f-43d1-ac22-750257be64b7", "createdAt": "2023-10-13T20:00:01.282Z", "updatedAt": "2023-10-13T20:00:01.282Z", "code": "000024", "name": "RAND MERCHANT BANK"},
{"id": "b3108c6d-1555-42c6-90e4-6ed6e137a2a2", "createdAt": "2023-10-13T20:00:01.284Z", "updatedAt": "2023-10-13T20:00:01.284Z", "code": "070011", "name": "REFUGE MORTGAGE BANK"},
{"id": "ac555105-0611-426f-9e01-3d134b0644da", "createdAt": "2023-10-13T20:00:01.287Z", "updatedAt": "2023-10-13T20:00:01.287Z", "code": "090125", "name": "REGENT MICROFINANCE BANK"},
{"id": "c7693deb-10d3-4204-912f-1c49ed613c45", "createdAt": "2023-10-13T20:00:01.289Z", "updatedAt": "2023-10-13T20:00:01.289Z", "code": "090173", "name": "RELIANCE MICROFINANCE BANK"},
{"id": "5690436c-f23f-44cb-9c70-49b0a893ab8c", "createdAt": "2023-10-13T20:00:01.292Z", "updatedAt": "2023-10-13T20:00:01.292Z", "code": "090198", "name": "RENMONEY MICROFINANCE BANK"},
{"id": "ce47652f-0dff-432e-b08f-a500a4ddb1a5", "createdAt": "2023-10-13T20:00:01.294Z", "updatedAt": "2023-10-13T20:00:01.294Z", "code": "090322", "name": "REPHIDIM MICROFINANCE BANK"},
{"id": "52f2bcec-1cac-4d83-9b50-1ae551f89d19", "createdAt": "2023-10-13T20:00:01.296Z", "updatedAt": "2023-10-13T20:00:01.296Z", "code": "090132", "name": "RICHWAY MICROFINANCE BANK"},
{"id": "e1fbd2fc-0a57-4b65-aff8-04b0bc4dc420", "createdAt": "2023-10-13T20:00:01.302Z", "updatedAt": "2023-10-13T20:00:01.302Z", "code": "090138", "name": "ROYAL EXCHANGE MICROFINANCE BANK"},
{"id": "a5834614-2e29-4d61-8935-a97100ba01d4", "createdAt": "2023-10-13T20:00:01.304Z", "updatedAt": "2023-10-13T20:00:01.304Z", "code": "090175", "name": "RUBIES MICROFINANCE BANK"},
{"id": "ced1d262-7c6e-4653-9185-944b54e1673d", "createdAt": "2023-10-13T20:00:01.306Z", "updatedAt": "2023-10-13T20:00:01.306Z", "code": "090286", "name": "SAFE HAVEN MICROFINANCE BANK"},
{"id": "7d598730-82d0-4088-975b-609a39e9d8a2", "createdAt": "2023-10-13T20:00:01.309Z", "updatedAt": "2023-10-13T20:00:01.309Z", "code": "090006", "name": "SAFETRUST"},
{"id": "29a07824-60e7-4fbc-99f5-a62f2197d0a8", "createdAt": "2023-10-13T20:00:01.311Z", "updatedAt": "2023-10-13T20:00:01.311Z", "code": "090140", "name": "SAGAMU MICROFINANCE BANK"},
{"id": "b1a661f5-e385-4922-b394-09425ee0e05d", "createdAt": "2023-10-13T20:00:01.314Z", "updatedAt": "2023-10-13T20:00:01.314Z", "code": "090112", "name": "SEED CAPITAL MICROFINANCE BANK"},
{"id": "d2d21ffe-9de6-4437-93a7-7c51275a664e", "createdAt": "2023-10-13T20:00:01.316Z", "updatedAt": "2023-10-13T20:00:01.316Z", "code": "090369", "name": "SEEDVEST MICROFINANCE BANK"},
{"id": "e840ac51-d684-4009-b696-92f84b7fed69", "createdAt": "2023-10-13T20:00:01.318Z", "updatedAt": "2023-10-13T20:00:01.318Z", "code": "090401", "name": "SHERPERD TRUST MICROFINANCE BANK"},
{"id": "390a9f21-f120-4fc1-abc7-bf81177f9661", "createdAt": "2023-10-13T20:00:01.320Z", "updatedAt": "2023-10-13T20:00:01.320Z", "code": "000034", "name": "Signature Bank"},
{"id": "0a7ff782-8078-4622-a850-8bd2f10c54de", "createdAt": "2023-10-13T20:00:01.323Z", "updatedAt": "2023-10-13T20:00:01.323Z", "code": "090573", "name": "SNOW MFB"},
{"id": "d477d857-add7-43f9-a6fa-e9f042efd17f", "createdAt": "2023-10-13T20:00:01.325Z", "updatedAt": "2023-10-13T20:00:01.325Z", "code": "090325", "name": "SPARKLE"},
{"id": "ab38102e-d134-43f0-b327-9c5d0f11b5b7", "createdAt": "2023-10-13T20:00:01.328Z", "updatedAt": "2023-10-13T20:00:01.328Z", "code": "000012", "name": "STANBIC IBTC BANK"},
{"id": "c6904a1a-40a4-4bf0-ab6b-90ce378d34ac", "createdAt": "2023-10-13T20:00:01.331Z", "updatedAt": "2023-10-13T20:00:01.331Z", "code": "100007", "name": "STANBIC IBTC @Ease WALLET"},
{"id": "b29a622a-351b-4a2a-8bca-9c37878aaaf6", "createdAt": "2023-10-13T20:00:01.333Z", "updatedAt": "2023-10-13T20:00:01.333Z", "code": "000021", "name": "STANDARD CHARTERED BANK"},
{"id": "710d7496-ffbb-4411-8d4b-1ab2b4499b61", "createdAt": "2023-10-13T20:00:01.336Z", "updatedAt": "2023-10-13T20:00:01.336Z", "code": "090162", "name": "STANFORD MICROFINANCE BANK"},
{"id": "a153f024-f6d1-4ef5-b06d-f7a273f8ef72", "createdAt": "2023-10-13T20:00:01.339Z", "updatedAt": "2023-10-13T20:00:01.339Z", "code": "090583", "name": "STATESIDE MFB"},
{"id": "10c9d1c5-31fc-46e8-be95-efcf7344a69d", "createdAt": "2023-10-13T20:00:01.341Z", "updatedAt": "2023-10-13T20:00:01.341Z", "code": "090262", "name": "STELLAS MICROFINANCE BANK"},
{"id": "ca7c441a-1a4a-4c6b-bcd4-ca76b9165c0a", "createdAt": "2023-10-13T20:00:01.344Z", "updatedAt": "2023-10-13T20:00:01.344Z", "code": "000001", "name": "STERLING BANK"},
{"id": "3ffd3caf-d50c-4bda-aacc-152e87e8437f", "createdAt": "2023-10-13T20:00:01.347Z", "updatedAt": "2023-10-13T20:00:01.347Z", "code": "100022", "name": "STERLING MOBILE"},
{"id": "7b9dc58d-8321-40e3-8afe-6357d8849d0f", "createdAt": "2023-10-13T20:00:01.349Z", "updatedAt": "2023-10-13T20:00:01.349Z", "code": "090305", "name": "SULSPAP MICROFINANCE BANK"},
{"id": "23aaa344-56bc-4aeb-99d9-0bc8296bc8b4", "createdAt": "2023-10-13T20:00:01.353Z", "updatedAt": "2023-10-13T20:00:01.353Z", "code": "090302", "name": "Sunbeam Microfinance Bank"},
{"id": "508ed125-c342-4a93-9f00-9ecedafc6be5", "createdAt": "2023-10-13T20:00:01.355Z", "updatedAt": "2023-10-13T20:00:01.355Z", "code": "000022", "name": "SUNTRUST BANK"},
{"id": "9bb425ab-a746-4c1f-96d6-3870f9641dee", "createdAt": "2023-10-13T20:00:01.358Z", "updatedAt": "2023-10-13T20:00:01.358Z", "code": "100023", "name": "TAGPAY"},
{"id": "9a31f934-5d3a-41d3-b792-98d3e035f796", "createdAt": "2023-10-13T20:00:01.360Z", "updatedAt": "2023-10-13T20:00:01.360Z", "code": "000026", "name": "TAJ BANK"},
{"id": "a10cf3a8-78f2-472e-9d5f-47e327ca7adb", "createdAt": "2023-10-13T20:00:01.364Z", "updatedAt": "2023-10-13T20:00:01.364Z", "code": "090593", "name": "TASUED MICROFINANCE BANK LTD"},
{"id": "83c535be-3dbd-4491-8574-a9597660a70e", "createdAt": "2023-10-13T20:00:01.367Z", "updatedAt": "2023-10-13T20:00:01.367Z", "code": "090115", "name": "TCF MICROFINANCE BANK"},
{"id": "0fe79725-b8c2-47ae-ba09-bd1e93316ca2", "createdAt": "2023-10-13T20:00:01.369Z", "updatedAt": "2023-10-13T20:00:01.369Z", "code": "110007", "name": "TEAMAPT LIMITED"},
{"id": "e3fa7356-983a-4017-af5f-a48ec00b2fc2", "createdAt": "2023-10-13T20:00:01.372Z", "updatedAt": "2023-10-13T20:00:01.372Z", "code": "100010", "name": "TEASY MOBILE"},
{"id": "ff292560-3478-459c-b1c9-2603a3842c40", "createdAt": "2023-10-13T20:00:01.375Z", "updatedAt": "2023-10-13T20:00:01.375Z", "code": "050007", "name": "Tekla Finance Ltd"},
{"id": "e72ce10c-575f-4dbf-868e-a56fd1d0b1f3", "createdAt": "2023-10-13T20:00:01.378Z", "updatedAt": "2023-10-13T20:00:01.378Z", "code": "090373", "name": "THINK FINANCE MICROFINANCE BANK"},
{"id": "48ea2023-2aa6-403f-b595-cf66b512ecdd", "createdAt": "2024-04-15T08:50:09.959Z", "updatedAt": "2024-04-15T08:50:09.959Z", "code": "100039", "name": "TITAN-PAYSTACK MICROFINANCE BANK"},
{"id": "9715878b-340a-4a8b-a3ff-2348ba4f449b", "createdAt": "2023-10-13T20:00:01.380Z", "updatedAt": "2023-10-13T20:00:01.380Z", "code": "000025", "name": "TITAN TRUST BANK"},
{"id": "83851039-649f-4b5b-b347-ee9856237a90", "createdAt": "2023-10-13T20:00:01.383Z", "updatedAt": "2023-10-13T20:00:01.383Z", "code": "090613", "name": "Total Trust Microfinance Bank"},
{"id": "64caf8ac-3d32-47ad-b2d9-b*******0042", "createdAt": "2023-10-13T20:00:01.386Z", "updatedAt": "2023-10-13T20:00:01.386Z", "code": "090146", "name": "TRIDENT MICROFINANCE BANK"},
{"id": "4b4b1b13-bfb7-4fb1-b6d2-c29f6ec8fad4", "createdAt": "2023-10-13T20:00:01.388Z", "updatedAt": "2023-10-13T20:00:01.388Z", "code": "090123", "name": "TRUSTBANC J6 MICROFINANCE BANK LIMITED"},
{"id": "fb8fb5ab-ea00-48c5-8b8b-427a07426df0", "createdAt": "2023-10-13T20:00:01.391Z", "updatedAt": "2023-10-13T20:00:01.391Z", "code": "090005", "name": "TRUSTBOND MORTGAGE BANK"},
{"id": "952e3354-03a6-4d07-8ccd-3217f99d0388", "createdAt": "2023-10-13T20:00:01.394Z", "updatedAt": "2023-10-13T20:00:01.394Z", "code": "090276", "name": "TRUSTFUND MICROFINANCE BANK"},
{"id": "371af9eb-f9d8-46d8-b6ba-7525247116b7", "createdAt": "2023-10-13T20:00:01.396Z", "updatedAt": "2023-10-13T20:00:01.396Z", "code": "090327", "name": "TRUST MICROFINANCE BANK"},
{"id": "7c7bd00a-6e52-4f79-8312-e8d2958247bc", "createdAt": "2023-10-13T20:00:01.399Z", "updatedAt": "2023-10-13T20:00:01.399Z", "code": "090315", "name": "U & C MICROFINANCE BANK"},
{"id": "c76699b6-ce62-4932-a3f4-202b6f2aa526", "createdAt": "2023-10-13T20:00:01.401Z", "updatedAt": "2023-10-13T20:00:01.401Z", "code": "090609", "name": "Ummah Microfinance Bank"},
{"id": "943b08a4-9fa8-41ea-b77b-d9bf156586a1", "createdAt": "2023-10-13T20:00:01.403Z", "updatedAt": "2023-10-13T20:00:01.403Z", "code": "090331", "name": "UNAAB MICROFINANCE BANK"},
{"id": "b3607769-413e-4c49-8b9f-e278944bb4ee", "createdAt": "2023-10-13T20:00:01.406Z", "updatedAt": "2023-10-13T20:00:01.406Z", "code": "090266", "name": "UNIBEN MICROFINANCE BANK"},
{"id": "b98cd1a6-f98f-4edd-8c14-21c43344b6dd", "createdAt": "2023-10-13T20:00:01.409Z", "updatedAt": "2023-10-13T20:00:01.409Z", "code": "90193", "name": "UNICAL MICROFINANCE BANK"},
{"id": "34873755-2277-4957-a2be-6850d059bbdf", "createdAt": "2023-10-13T20:00:01.411Z", "updatedAt": "2023-10-13T20:00:01.411Z", "code": "090193", "name": "UNICAL MICROFINANCE BANK"},
{"id": "83996c5a-6dd5-4bf6-9abc-6619d2117828", "createdAt": "2023-10-13T20:00:01.413Z", "updatedAt": "2023-10-13T20:00:01.413Z", "code": "000018", "name": "UNION BANK"},
{"id": "8d7cddb3-ef29-4d20-b093-25d4a7e2be02", "createdAt": "2023-10-13T20:00:01.416Z", "updatedAt": "2023-10-13T20:00:01.416Z", "code": "000004", "name": "UNITED BANK FOR AFRICA"},
{"id": "a9cfd138-15b6-4bd5-a0fd-359349ad71ac", "createdAt": "2023-10-13T20:00:01.418Z", "updatedAt": "2023-10-13T20:00:01.418Z", "code": "000011", "name": "UNITY BANK"},
{"id": "e3b9a3d3-4250-4015-86b9-7a1e5374f2c6", "createdAt": "2023-10-13T20:00:01.420Z", "updatedAt": "2023-10-13T20:00:01.420Z", "code": "090251", "name": "UNIVERSITY OF NIGERIA, NSUKKA MICROFINANCE BANK"},
{"id": "9d41b023-1896-4101-89c0-e1b6fe5244e6", "createdAt": "2023-10-13T20:00:01.422Z", "updatedAt": "2023-10-13T20:00:01.422Z", "code": "110009", "name": "VENTURE GARDEN NIGERIA LIMITED"},
{"id": "4b4414ec-6e69-4aac-bb3a-50f3b7a3cb76", "createdAt": "2023-10-13T20:00:01.425Z", "updatedAt": "2023-10-13T20:00:01.425Z", "code": "090110", "name": "VFD MFB"},
{"id": "b6ca6673-d32f-49c5-8fb0-22787db234fd", "createdAt": "2023-10-13T20:00:01.427Z", "updatedAt": "2023-10-13T20:00:01.427Z", "code": "090150", "name": "VIRTUE MICROFINANCE BANK"},
{"id": "1bcbcc74-53d1-435a-b61f-80c13896504f", "createdAt": "2023-10-13T20:00:01.429Z", "updatedAt": "2023-10-13T20:00:01.429Z", "code": "090139", "name": "VISA MICROFINANCE BANK"},
{"id": "495624af-653e-4f39-a3ca-b396809c1b36", "createdAt": "2023-10-13T20:00:01.431Z", "updatedAt": "2023-10-13T20:00:01.431Z", "code": "100012", "name": "VT NETWORKS"},
{"id": "cf957f86-3aec-4b3c-a83e-81e3c63792fc", "createdAt": "2023-10-13T20:00:01.434Z", "updatedAt": "2023-10-13T20:00:01.434Z", "code": "090590", "name": "WAYA MICROFINANCE BANK LTD"},
{"id": "5aaa4723-bb99-4ccd-a336-44348e91eca2", "createdAt": "2023-10-13T20:00:01.436Z", "updatedAt": "2023-10-13T20:00:01.436Z", "code": "000017", "name": "WEMA BANK"},
{"id": "7d83c227-8984-445e-b6db-a4aff9bca521", "createdAt": "2023-10-13T20:00:01.438Z", "updatedAt": "2023-10-13T20:00:01.438Z", "code": "090120", "name": "WETLAND  MICROFINANCE BANK"},
{"id": "3b45863b-eb34-45c2-a06a-6dfb9de57e01", "createdAt": "2023-10-13T20:00:01.440Z", "updatedAt": "2023-10-13T20:00:01.440Z", "code": "090419", "name": "WinView Bank"},
{"id": "cf678069-9bb3-48d5-9a00-63a6c3fbaa97", "createdAt": "2023-10-13T20:00:01.442Z", "updatedAt": "2023-10-13T20:00:01.442Z", "code": "090124", "name": "XSLNCE MICROFINANCE BANK"},
{"id": "86dbe3e0-dec8-4965-b8e1-f217327eff11", "createdAt": "2023-10-13T20:00:01.444Z", "updatedAt": "2023-10-13T20:00:01.444Z", "code": "090142", "name": "YES MICROFINANCE BANK"},
{"id": "d8a4e882-a11c-4ae8-b971-7903de0b16f3", "createdAt": "2023-10-13T20:00:01.447Z", "updatedAt": "2023-10-13T20:00:01.447Z", "code": "090252", "name": "YOBE MICROFINANCE  BANK"},
{"id": "2a28b78a-f453-44ed-a41e-fe12b09576b6", "createdAt": "2023-10-13T20:00:01.449Z", "updatedAt": "2023-10-13T20:00:01.449Z", "code": "000015", "name": "ZENITH BANK"},
{"id": "4d775500-ba80-4999-a99c-c0b5d251c87e", "createdAt": "2023-10-13T20:00:01.451Z", "updatedAt": "2023-10-13T20:00:01.451Z", "code": "100034", "name": "ZENITH EASY WALLET"},
{"id": "f3ac9f2c-549b-4493-a011-548f25ad0e63", "createdAt": "2023-10-13T20:00:01.453Z", "updatedAt": "2023-10-13T20:00:01.453Z", "code": "100018", "name": "ZENITH MOBILE"},
{"id": "a01a26cd-93a2-4979-a77a-c3296925ffb9", "createdAt": "2023-10-13T20:00:01.456Z", "updatedAt": "2023-10-13T20:00:01.456Z", "code": "100025", "name": "ZINTERNET - KONGAPAY"}
]
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- 358 banks in one response. There is **no `meta` block and no paging**,
  although the pagination page implies list endpoints page. `order` and
  `searchTerm` were not needed.
- Each entry: `id` (uuid), `createdAt`, `updatedAt`, `code`, `name`. The
  `code` is the `sortCode` that `/name/enquiry` and `/bank/credit` take.
- Codes are strings and are **not all 6 digits**: 353 are 6, four are 5
  (for example `90202` beside `090202`, both "ACCELEREX NETWORK LIMITED"),
  one is 4. Five names appear twice with different codes. The bank picker
  must key on `code`, never on `name`, and must not left-pad codes.
- Fintava's own bank is in the list as **`LOMA BANK`, code `090620`**. Other
  common ones: GTBANK PLC `000013`, ACCESS BANK `000014`, ZENITH BANK
  `000015`, FIRST BANK OF NIGERIA `000016`, UNITED BANK FOR AFRICA `000004`,
  OPAY `100004`, PALMPAY `100033`, KUDA `090267`, MONIEPOINT `090405`.
- Not charged (merchant balance unchanged).

### Requests and responses

#### GET /banks

Sent 2026-10-02 08:28:19 UTC, answered in 0.57 s.

```http
GET /api/dev/banks
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:20 GMT
content-type: application/json; charset=utf-8
content-length: 61655
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"f0d7-0NcHPKB7CuKCQg98KbB/Wqah6Ls"
cf-cache-status: DYNAMIC
```

`data` holds 358 entries (all of them below, one per line). The rest of the body:

```json
{
  "status": 200,
  "message": "bank lists fetched successfully"
}
```

<details><summary>All 358 entries</summary>

```json
{"id": "90d92fad-9d66-48a5-87b4-75d9e1291d49", "createdAt": "2023-10-13T20:00:00.170Z", "updatedAt": "2023-10-13T20:00:00.170Z", "code": "110005", "name": "3LINE CARD MANAGEMENT LIMITED"}
{"id": "ed9ddfe0-5b14-4c97-a9e8-de5389a918bf", "createdAt": "2023-10-13T20:00:00.176Z", "updatedAt": "2023-10-13T20:00:00.176Z", "code": "120001", "name": "9 PAYMENT SOLUTIONS BANK"}
{"id": "5cd7d06e-e59a-492c-9d7e-0a52d908dbcf", "createdAt": "2023-10-13T20:00:00.180Z", "updatedAt": "2023-10-13T20:00:00.180Z", "code": "050005", "name": "AAA FINANCE"}
{"id": "438ed5de-0acc-476e-96c6-94ccabf2a9af", "createdAt": "2023-10-13T20:00:00.185Z", "updatedAt": "2023-10-13T20:00:00.185Z", "code": "000112", "name": "ABank ABC"}
{"id": "1c027323-e7b4-43a5-acd5-1016e1d84ae4", "createdAt": "2023-10-13T20:00:00.189Z", "updatedAt": "2023-10-13T20:00:00.189Z", "code": "070010", "name": "ABBEY MORTGAGE BANK"}
{"id": "059f2dcd-6209-4019-8599-98a9cfae5346", "createdAt": "2023-10-13T20:00:00.234Z", "updatedAt": "2023-10-13T20:00:00.234Z", "code": "090270", "name": "AB MICROFINANCE BANK"}
{"id": "71102a67-541b-4a7d-a28b-8dda683086b7", "createdAt": "2023-10-13T20:00:00.266Z", "updatedAt": "2023-10-13T20:00:00.266Z", "code": "090260", "name": "ABOVE ONLY MICROFINANCE BANK"}
{"id": "9c5b7845-a76d-4e4a-9277-6b71e35bbbf5", "createdAt": "2023-10-13T20:00:00.297Z", "updatedAt": "2023-10-13T20:00:00.297Z", "code": "090197", "name": "ABU MICROFINANCE BANK"}
{"id": "da5e6132-29a8-4f36-9295-aa59cc9027c7", "createdAt": "2023-10-13T20:00:00.304Z", "updatedAt": "2023-10-13T20:00:00.304Z", "code": "90202", "name": "ACCELEREX NETWORK LIMITED"}
{"id": "586a673b-e118-4381-855f-eb9ab475cac3", "createdAt": "2023-10-13T20:00:00.307Z", "updatedAt": "2023-10-13T20:00:00.307Z", "code": "090202", "name": "ACCELEREX NETWORK LIMITED"}
{"id": "3257ee2c-3774-46ec-b88c-c3a44cbde297", "createdAt": "2023-10-13T20:00:00.310Z", "updatedAt": "2023-10-13T20:00:00.310Z", "code": "000014", "name": "ACCESS BANK"}
{"id": "b34eb6cb-c8f5-471b-8485-ecba113f4d90", "createdAt": "2023-10-13T20:00:00.314Z", "updatedAt": "2023-10-13T20:00:00.314Z", "code": "000005", "name": "ACCESS(DIAMOND) BANK"}
{"id": "605703ef-7445-45ff-8139-f449f2be3c81", "createdAt": "2023-10-13T20:00:00.320Z", "updatedAt": "2023-10-13T20:00:00.320Z", "code": "100013", "name": "ACCESS MONEY"}
{"id": "dd274573-c407-4243-9d66-5e48d3ff6ba0", "createdAt": "2023-10-13T20:00:00.325Z", "updatedAt": "2023-10-13T20:00:00.325Z", "code": "100052", "name": "ACCESS YELLO & BETA"}
{"id": "a141c37b-0365-4d77-a485-6cfe44c3ac40", "createdAt": "2023-10-13T20:00:00.330Z", "updatedAt": "2023-10-13T20:00:00.330Z", "code": "090134", "name": "ACCION MICROFINANCE BANK"}
{"id": "96c83cac-0ae5-4f6b-9f6c-c2738f1e3946", "createdAt": "2023-10-13T20:00:00.333Z", "updatedAt": "2023-10-13T20:00:00.333Z", "code": "090160", "name": "ADDOSSER MICROFINANCE BANK"}
{"id": "71ffbe59-09d9-4d95-b9e7-272a3bb3a6ac", "createdAt": "2023-10-13T20:00:00.338Z", "updatedAt": "2023-10-13T20:00:00.338Z", "code": "090268", "name": "ADEYEMI COLLEGE STAFF MICROFINANCE BANK"}
{"id": "5054087d-df16-4b4a-8d14-6060ad97a959", "createdAt": "2023-10-13T20:00:00.342Z", "updatedAt": "2023-10-13T20:00:00.342Z", "code": "090155", "name": "ADVANS LA FAYETTE  MICROFINANCE BANK"}
{"id": "e82e631d-110a-46cf-a485-41f70de72ea4", "createdAt": "2023-10-13T20:00:00.345Z", "updatedAt": "2023-10-13T20:00:00.345Z", "code": "90155", "name": "ADVANS LA FAYETTE  MICROFINANCE BANK"}
{"id": "34e746dc-9488-4eea-9b4b-31a31087cf72", "createdAt": "2023-10-13T20:00:00.350Z", "updatedAt": "2023-10-13T20:00:00.350Z", "code": "090292", "name": "AFEKHAFE MICROFINANCE BANK"}
{"id": "c274a087-cdd2-45c5-a2db-8c8dcecbb11d", "createdAt": "2023-10-13T20:00:00.355Z", "updatedAt": "2023-10-13T20:00:00.355Z", "code": "100028", "name": "AG MORTGAGE BANK"}
{"id": "acf1b9af-73f8-42ee-859e-8c40aa5ffbb2", "createdAt": "2023-10-13T20:00:00.360Z", "updatedAt": "2023-10-13T20:00:00.360Z", "code": "090371", "name": "AGOSASA MICROFINANCE BANK"}
{"id": "43a368d1-531f-4ed0-8c97-0575b56fbd66", "createdAt": "2023-10-13T20:00:00.362Z", "updatedAt": "2023-10-13T20:00:00.362Z", "code": "090608", "name": "Akpo Microfinance Bank"}
{"id": "9f2b085a-783c-4104-b531-073f04d24fdd", "createdAt": "2023-10-13T20:00:00.366Z", "updatedAt": "2023-10-13T20:00:00.366Z", "code": "090133", "name": "AL-BARAKAH MICROFINANCE BANK"}
{"id": "7b249a74-cd7e-4707-b2da-928f0baaa0b4", "createdAt": "2023-10-13T20:00:00.369Z", "updatedAt": "2023-10-13T20:00:00.369Z", "code": "090259", "name": "ALEKUN MICROFINANCE BANK"}
{"id": "5e598432-e823-437d-94d4-ac18238d0050", "createdAt": "2023-10-13T20:00:00.373Z", "updatedAt": "2023-10-13T20:00:00.373Z", "code": "090297", "name": "ALERT MICROFINANCE BANK"}
{"id": "98733c57-236c-452e-a82a-790f3027b4d2", "createdAt": "2023-10-13T20:00:00.376Z", "updatedAt": "2023-10-13T20:00:00.376Z", "code": "090277", "name": "AL-HAYAT MICROFINANCE BANK"}
{"id": "bd72faad-ea27-473a-9034-0f4b12f99af2", "createdAt": "2023-10-13T20:00:00.378Z", "updatedAt": "2023-10-13T20:00:00.378Z", "code": "090131", "name": "ALLWORKERS MICROFINANCE BANK"}
{"id": "f2e3e7ec-ecb4-4fcb-bcab-125245a8322a", "createdAt": "2023-10-13T20:00:00.381Z", "updatedAt": "2023-10-13T20:00:00.381Z", "code": "090169", "name": "ALPHA KAPITAL MICROFINANCE BANK"}
{"id": "f398bd9d-3359-4084-8220-14292a7f4316", "createdAt": "2023-10-13T20:00:00.384Z", "updatedAt": "2023-10-13T20:00:00.384Z", "code": "090394", "name": "AMAC MICROFINANCE BANK"}
{"id": "c681c03e-4189-4f9e-a389-4b1437b2e729", "createdAt": "2023-10-13T20:00:00.387Z", "updatedAt": "2023-10-13T20:00:00.387Z", "code": "090180", "name": "AMJU UNIQUE MICROFINANCE BANK"}
{"id": "f1559c2a-6cf4-4715-a019-fdde6ac31ed7", "createdAt": "2023-10-13T20:00:00.391Z", "updatedAt": "2023-10-13T20:00:00.391Z", "code": "090116", "name": "AMML MICROFINANCE BANK"}
{"id": "150db961-3193-4465-a43c-35d956c93e5f", "createdAt": "2023-10-13T20:00:00.395Z", "updatedAt": "2023-10-13T20:00:00.395Z", "code": "090610", "name": "AMOYE MICROFINANCE BANK"}
{"id": "df60512e-372d-4192-953d-b43ea8a8a584", "createdAt": "2023-10-13T20:00:00.398Z", "updatedAt": "2023-10-13T20:00:00.398Z", "code": "090143", "name": "APEKS MICROFINANCE BANK"}
{"id": "51cc7b8b-7bbe-47a9-98f6-5a48c8fc3357", "createdAt": "2023-10-13T20:00:00.401Z", "updatedAt": "2023-10-13T20:00:00.401Z", "code": "090376", "name": "APPLE MICROFINANCE BANK"}
{"id": "722d0a6a-c101-432a-b78a-a3b2cc5c0380", "createdAt": "2023-10-13T20:00:00.403Z", "updatedAt": "2023-10-13T20:00:00.403Z", "code": "090282", "name": "ARISE MICROFINANCE BANK"}
{"id": "eee2a920-cd4b-43a0-aaa0-b6b051935bf1", "createdAt": "2023-10-13T20:00:00.406Z", "updatedAt": "2023-10-13T20:00:00.406Z", "code": "090001", "name": "ASO SAVINGS"}
{"id": "a36a7ba0-964a-4c7e-aa7d-5a23f7109a3e", "createdAt": "2023-10-13T20:00:00.409Z", "updatedAt": "2023-10-13T20:00:00.409Z", "code": "090287", "name": "ASSETMATRIX MICROFINANCE BANK"}
{"id": "60a7b14f-b43a-47c8-8d90-f260da4fa8dc", "createdAt": "2023-10-13T20:00:00.415Z", "updatedAt": "2023-10-13T20:00:00.415Z", "code": "090172", "name": "ASTRAPOLARIS MICROFINANCE BANK"}
{"id": "540728db-c096-47b2-9770-8f86e443dd9c", "createdAt": "2023-10-13T20:00:00.418Z", "updatedAt": "2023-10-13T20:00:00.418Z", "code": "090264", "name": "AUCHI MICROFINANCE BANK"}
{"id": "8d34d196-3512-4861-89f9-9203c3579a95", "createdAt": "2023-10-13T20:00:00.421Z", "updatedAt": "2023-10-13T20:00:00.421Z", "code": "090600", "name": "AVE MARIA MICROFINANCE BANK LTD"}
{"id": "2f25c9fc-fe3c-46b8-a160-20cedd6554b4", "createdAt": "2023-10-13T20:00:00.424Z", "updatedAt": "2023-10-13T20:00:00.424Z", "code": "090188", "name": "BAINES CREDIT MICROFINANCE BANK"}
{"id": "95b0ff34-d5e0-49ca-81bb-9aec11faf55b", "createdAt": "2023-10-13T20:00:00.427Z", "updatedAt": "2023-10-13T20:00:00.427Z", "code": "090326", "name": "BALOGUN GAMBARI MICROFINANCE BANK"}
{"id": "807d48e0-bba1-4f6d-9bac-1bf0e65c675e", "createdAt": "2023-10-13T20:00:00.429Z", "updatedAt": "2023-10-13T20:00:00.429Z", "code": "090581", "name": "BANC CORP MICROFINANCE BANK LTD"}
{"id": "9979df6d-d23d-4057-a926-27190a7730a3", "createdAt": "2023-10-13T20:00:00.432Z", "updatedAt": "2023-10-13T20:00:00.432Z", "code": "090316", "name": "BAYERO UNIVERSITY MICROFINANCE BANK"}
{"id": "0bed1ff5-2578-4cec-91ef-739443e9ae08", "createdAt": "2023-10-13T20:00:00.435Z", "updatedAt": "2023-10-13T20:00:00.435Z", "code": "090127", "name": "BC KASH MICROFINANCE BANK"}
{"id": "00f6a3d2-d42e-42e3-ac98-d7308efe90e4", "createdAt": "2023-10-13T20:00:00.440Z", "updatedAt": "2023-10-13T20:00:00.440Z", "code": "090336", "name": "BIPC MICROFINANCE BANK"}
{"id": "1089919a-424b-47b5-8611-d54d8e62166d", "createdAt": "2023-10-13T20:00:00.442Z", "updatedAt": "2023-10-13T20:00:00.442Z", "code": "090117", "name": "BOCTRUST MICROFINANCE BANK LIMITED"}
{"id": "8e835e4c-bd6d-4a21-a649-1ab3fa26096c", "createdAt": "2023-10-13T20:00:00.445Z", "updatedAt": "2023-10-13T20:00:00.445Z", "code": "090395", "name": "BORGU  MICROFINANCE BANK"}
{"id": "0f1949be-ddbb-4a0d-8de0-2f8894d29130", "createdAt": "2023-10-13T20:00:00.448Z", "updatedAt": "2023-10-13T20:00:00.448Z", "code": "090176", "name": "BOSAK MICROFINANCE BANK"}
{"id": "075eb082-1468-4178-b620-b6660bed8ab1", "createdAt": "2023-10-13T20:00:00.451Z", "updatedAt": "2023-10-13T20:00:00.451Z", "code": "090148", "name": "BOWEN MICROFINANCE BANK"}
{"id": "c9853440-37d5-494e-978e-6fae1067d2b5", "createdAt": "2023-10-13T20:00:00.461Z", "updatedAt": "2023-10-13T20:00:00.461Z", "code": "050006", "name": "Branch International Financial Services"}
{"id": "fc4198b0-f00b-4d71-adc3-0e09897be7c7", "createdAt": "2023-10-13T20:00:00.466Z", "updatedAt": "2023-10-13T20:00:00.466Z", "code": "070015", "name": "BRENT MORTGAGE BANK"}
{"id": "76a56bf3-2a34-4a28-a83a-c94407908e5a", "createdAt": "2023-10-13T20:00:00.470Z", "updatedAt": "2023-10-13T20:00:00.470Z", "code": "090293", "name": "BRETHREN MICROFINANCE BANK"}
{"id": "eb884b19-ffbe-49e2-897a-3bd7f1bb8e81", "createdAt": "2023-10-13T20:00:00.474Z", "updatedAt": "2023-10-13T20:00:00.474Z", "code": "090393", "name": "BRIDGEWAY MICROFINANACE BANK"}
{"id": "7363d3e6-b702-42b9-a567-cdd08172b124", "createdAt": "2023-10-13T20:00:00.476Z", "updatedAt": "2023-10-13T20:00:00.476Z", "code": "090308", "name": "BRIGHTWAY MICROFINANCE BANK"}
{"id": "8d46617b-6dbe-4ed3-bfe0-b2c618e9edc7", "createdAt": "2023-10-13T20:00:00.483Z", "updatedAt": "2023-10-13T20:00:00.483Z", "code": "090568", "name": "BROADVIEW MICROFINANCE BANK LTD"}
{"id": "588f9f1f-d0f8-4fdb-b53f-3b32480f0c97", "createdAt": "2023-10-13T20:00:00.485Z", "updatedAt": "2023-10-13T20:00:00.485Z", "code": "090406", "name": "BUSINESS SUPPORT MICROFINANCE BANK"}
{"id": "a61d4830-5e51-4bbc-933e-ba2e96a33e72", "createdAt": "2023-10-13T20:00:00.489Z", "updatedAt": "2023-10-13T20:00:00.489Z", "code": "090415", "name": "Calabar Microfinance Bank"}
{"id": "6e2d3e08-4e32-4f5b-9c04-c787a07ff4a1", "createdAt": "2023-10-13T20:00:00.491Z", "updatedAt": "2023-10-13T20:00:00.491Z", "code": "100026", "name": "CARBON"}
{"id": "48a08796-18f6-4db9-94a9-0eff9f5687c6", "createdAt": "2023-10-13T20:00:00.494Z", "updatedAt": "2023-10-13T20:00:00.494Z", "code": "090360", "name": "CASHCONNECT MICROFINANCE BANK"}
{"id": "33021e86-9ff9-4851-9dd5-7b40a7be3b8f", "createdAt": "2023-10-13T20:00:00.499Z", "updatedAt": "2023-10-13T20:00:00.499Z", "code": "100005", "name": "CELLULANT"}
{"id": "6a50ccca-f9dc-4402-8010-5334da6bb7a0", "createdAt": "2023-10-13T20:00:00.504Z", "updatedAt": "2023-10-13T20:00:00.504Z", "code": "090154", "name": "CEMCS MICROFINANCE BANK"}
{"id": "f3a56ede-c9e9-4dcf-9ab5-43e9a0438dcb", "createdAt": "2023-10-13T20:00:00.511Z", "updatedAt": "2023-10-13T20:00:00.511Z", "code": "000028", "name": "Central Bank of Nigeria"}
{"id": "f0c849ee-6a7f-4ab7-a433-5d5171ed5d1e", "createdAt": "2023-10-13T20:00:00.518Z", "updatedAt": "2023-10-13T20:00:00.518Z", "code": "100015", "name": "CHAMS MOBILE"}
{"id": "50c1dc3e-9782-4ff1-abcf-04029db151c9", "createdAt": "2023-10-13T20:00:00.525Z", "updatedAt": "2023-10-13T20:00:00.525Z", "code": "090397", "name": "Chanelle Bank"}
{"id": "45f5223e-c274-4a85-8bd5-b04addfefb0d", "createdAt": "2023-10-13T20:00:00.530Z", "updatedAt": "2023-10-13T20:00:00.530Z", "code": "090416", "name": "Chibueze Microfinance Bank"}
{"id": "e0cf4613-eee8-4e8e-b6d9-df399c5b5b44", "createdAt": "2023-10-13T20:00:00.532Z", "updatedAt": "2023-10-13T20:00:00.532Z", "code": "090141", "name": "CHIKUM MICROFINANCE BANK"}
{"id": "4719c22d-cf1e-4e2f-a211-502638f14a15", "createdAt": "2023-10-13T20:00:00.536Z", "updatedAt": "2023-10-13T20:00:00.536Z", "code": "000009", "name": "CITI BANK"}
{"id": "50878c93-bf3f-43ea-b3a7-74042160b12e", "createdAt": "2023-10-13T20:00:00.539Z", "updatedAt": "2023-10-13T20:00:00.539Z", "code": "090144", "name": "CIT MICROFINANCE BANK"}
{"id": "4d9b9dc5-90fc-49cf-b039-d3cd1389b39f", "createdAt": "2023-10-13T20:00:00.541Z", "updatedAt": "2023-10-13T20:00:00.541Z", "code": "090374", "name": "COASTLINE MICROFINANCE BANK"}
{"id": "83581ff3-49e1-4e20-a517-cf49c9d5beda", "createdAt": "2023-10-13T20:00:00.544Z", "updatedAt": "2023-10-13T20:00:00.544Z", "code": "090130", "name": "CONSUMER MICROFINANCE BANK"}
{"id": "42e35d15-eb14-41e3-a52e-f32568032e49", "createdAt": "2023-10-13T20:00:00.547Z", "updatedAt": "2023-10-13T20:00:00.547Z", "code": "070021", "name": "COOP MORTGAGE BANK"}
{"id": "22a4f1a9-1a3d-4c15-98ce-9619d4b02fb3", "createdAt": "2023-10-13T20:00:00.550Z", "updatedAt": "2023-10-13T20:00:00.550Z", "code": "090365", "name": "CORESTEP MICROFINANCE BANK"}
{"id": "a7612640-cf13-4db9-9e9a-4a2091e15bb6", "createdAt": "2023-10-13T20:00:00.553Z", "updatedAt": "2023-10-13T20:00:00.553Z", "code": "060001", "name": "CORONATION MERCHANT BANK"}
{"id": "849f7c70-5f54-43b7-90a8-5aba5808d531", "createdAt": "2023-10-13T20:00:00.557Z", "updatedAt": "2023-10-13T20:00:00.557Z", "code": "070006", "name": "COVENANT MFB"}
{"id": "bf7631db-7ccd-4d51-a214-73769fda9a78", "createdAt": "2023-10-13T20:00:00.560Z", "updatedAt": "2023-10-13T20:00:00.560Z", "code": "090159", "name": "CREDIT AFRIQUE MICROFINANCE BANK"}
{"id": "d519267a-5da0-46e0-8ced-53e199852cba", "createdAt": "2023-10-13T20:00:00.564Z", "updatedAt": "2023-10-13T20:00:00.564Z", "code": "090611", "name": "Creditville MFB"}
{"id": "f6aae15a-aa05-49f4-8446-d3ce150f720b", "createdAt": "2023-10-13T20:00:00.567Z", "updatedAt": "2023-10-13T20:00:00.567Z", "code": "110014", "name": "CYBERSPACE LIMITED"}
{"id": "bd28bdb8-dc4f-4743-bdf3-c9368f2cc1e8", "createdAt": "2023-10-13T20:00:00.573Z", "updatedAt": "2023-10-13T20:00:00.573Z", "code": "090391", "name": "DAVODANI  MICROFINANCE BANK"}
{"id": "b73a9ba5-1a86-4bf1-869a-cd3ad268ee26", "createdAt": "2023-10-13T20:00:00.575Z", "updatedAt": "2023-10-13T20:00:00.575Z", "code": "090167", "name": "DAYLIGHT MICROFINANCE BANK"}
{"id": "118ae6d8-3ebb-4c40-a2d8-e3aaea0a401a", "createdAt": "2023-10-13T20:00:00.578Z", "updatedAt": "2023-10-13T20:00:00.578Z", "code": "050013", "name": "Dignity Finance"}
{"id": "19c2baa4-e6fe-458e-bd2f-e7de09990202", "createdAt": "2023-10-13T20:00:00.580Z", "updatedAt": "2023-10-13T20:00:00.580Z", "code": "090294", "name": "EAGLE FLIGHT MICROFINANCE BANK"}
{"id": "bbbc2279-5afb-4495-a199-60f434d0e07b", "createdAt": "2023-10-13T20:00:00.586Z", "updatedAt": "2023-10-13T20:00:00.586Z", "code": "100021", "name": "EARTHOLEUM"}
{"id": "e6a1ffbd-12f2-40a9-8af8-5a19e014ca1c", "createdAt": "2023-10-13T20:00:00.590Z", "updatedAt": "2023-10-13T20:00:00.590Z", "code": "090156", "name": "E-BARCS MICROFINANCE BANK"}
{"id": "ce2ecaea-d9ac-4afa-987d-e03f2f9f2f42", "createdAt": "2023-10-13T20:00:00.594Z", "updatedAt": "2023-10-13T20:00:00.594Z", "code": "000010", "name": "ECOBANK"}
{"id": "7dd71db5-ec53-4533-a88e-084b79757619", "createdAt": "2023-10-13T20:00:00.596Z", "updatedAt": "2023-10-13T20:00:00.596Z", "code": "100008", "name": "ECOBANK XPRESS ACCOUNT"}
{"id": "e478a1a8-d0ed-4bac-8fe3-89e74981d212", "createdAt": "2023-10-13T20:00:00.599Z", "updatedAt": "2023-10-13T20:00:00.599Z", "code": "100030", "name": "ECOMOBILE"}
{"id": "bbc86cc4-3ede-4b31-bd4b-4a3fe216664b", "createdAt": "2023-10-13T20:00:00.603Z", "updatedAt": "2023-10-13T20:00:00.603Z", "code": "090310", "name": "EDFIN MICROFINANCE BANK"}
{"id": "f5e20cf7-f722-43fd-b7c3-53d4952552e2", "createdAt": "2023-10-13T20:00:00.606Z", "updatedAt": "2023-10-13T20:00:00.606Z", "code": "090097", "name": "EKONDO MICROFINANCE BANK"}
{"id": "304714c8-b081-4d6d-a721-87035a958f90", "createdAt": "2023-10-13T20:00:00.609Z", "updatedAt": "2023-10-13T20:00:00.609Z", "code": "090389", "name": "EK-RELIABLE MICROFINANCE BANK"}
{"id": "0651c5f3-41ec-488b-86e8-f269de2a9fc1", "createdAt": "2023-10-13T20:00:00.611Z", "updatedAt": "2023-10-13T20:00:00.611Z", "code": "090273", "name": "EMERALD MICROFINANCE BANK"}
{"id": "e28a94c9-76d1-4a45-8522-d512b5e1f9e2", "createdAt": "2023-10-13T20:00:00.618Z", "updatedAt": "2023-10-13T20:00:00.618Z", "code": "090114", "name": "EMPIRE TRUST MICROFINANCE BANK"}
{"id": "4cf90df3-fad7-459a-8451-b2b9d9524f73", "createdAt": "2023-10-13T20:00:00.621Z", "updatedAt": "2023-10-13T20:00:00.621Z", "code": "050012", "name": "Enco Finance"}
{"id": "73293262-ee11-4c55-9324-607c6790d4f8", "createdAt": "2023-10-13T20:00:00.624Z", "updatedAt": "2023-10-13T20:00:00.624Z", "code": "000019", "name": "ENTERPRISE BANK"}
{"id": "345cc766-5e0f-4b87-bf82-e4eca8a506d7", "createdAt": "2023-10-13T20:00:00.626Z", "updatedAt": "2023-10-13T20:00:00.626Z", "code": "090189", "name": "ESAN MICROFINANCE BANK"}
{"id": "17087701-ebf3-473c-92cc-f3b334ae53be", "createdAt": "2023-10-13T20:00:00.630Z", "updatedAt": "2023-10-13T20:00:00.630Z", "code": "090166", "name": "ESO-E MICROFINANCE BANK"}
{"id": "279325fd-c40c-4e81-a218-9facc2dad455", "createdAt": "2023-10-13T20:00:00.633Z", "updatedAt": "2023-10-13T20:00:00.633Z", "code": "100006", "name": "eTRANZACT"}
{"id": "3348b964-602f-4af2-b879-8affc526f47f", "createdAt": "2023-10-13T20:00:00.639Z", "updatedAt": "2023-10-13T20:00:00.639Z", "code": "090304", "name": "EVANGEL MICROFINANCE BANK"}
{"id": "562b4ee4-5de2-44f4-993b-4f54bf2404e0", "createdAt": "2023-10-13T20:00:00.644Z", "updatedAt": "2023-10-13T20:00:00.644Z", "code": "090332", "name": "EVERGREEN MICROFINANCE BANK"}
{"id": "4ef899d4-4514-4d8a-95c2-9c1e7efe132a", "createdAt": "2023-10-13T20:00:00.649Z", "updatedAt": "2023-10-13T20:00:00.649Z", "code": "090572", "name": "EWT Microfinance Bank"}
{"id": "e694aadd-2a61-405e-a67f-34efbc8e06c1", "createdAt": "2023-10-13T20:00:00.660Z", "updatedAt": "2023-10-13T20:00:00.660Z", "code": "090328", "name": "EYOWO"}
{"id": "a2f8eddd-87a5-4c65-92f3-53f363434839", "createdAt": "2024-05-04T14:30:50.290Z", "updatedAt": "2024-05-04T14:30:50.290Z", "code": "090551", "name": "FAIRMONEY"}
{"id": "bcc38643-9926-46aa-9c35-e8f2a4ba2b46", "createdAt": "2023-10-13T20:00:00.663Z", "updatedAt": "2023-10-13T20:00:00.663Z", "code": "050009", "name": "FAST CREDIT"}
{"id": "5dd01fde-2085-4351-a9bc-a605f8a12bb0", "createdAt": "2023-10-13T20:00:00.667Z", "updatedAt": "2023-10-13T20:00:00.667Z", "code": "090179", "name": "FAST MICROFINANCE BANK"}
{"id": "e5da7de4-baad-491b-a051-b821b0e82e9d", "createdAt": "2023-10-13T20:00:00.670Z", "updatedAt": "2023-10-13T20:00:00.670Z", "code": "060002", "name": "FBNQUEST MERCHANT BANK"}
{"id": "92696dc7-dc94-437c-a03b-d60607cb94d2", "createdAt": "2023-10-13T20:00:00.675Z", "updatedAt": "2023-10-13T20:00:00.675Z", "code": "090409", "name": "FCMB MFB"}
{"id": "f9049c12-d2c0-454d-b94b-bd32d8e616c5", "createdAt": "2023-10-13T20:00:00.680Z", "updatedAt": "2023-10-13T20:00:00.680Z", "code": "100031", "name": "FCMB MOBILE"}
{"id": "68071d8b-fffc-486b-ab05-c671a58bb652", "createdAt": "2023-10-13T20:00:00.684Z", "updatedAt": "2023-10-13T20:00:00.684Z", "code": "090290", "name": "FCT MICROFINANCE BANK"}
{"id": "4db9937d-5c3d-44e0-a3f4-63b3578e9067", "createdAt": "2023-10-13T20:00:00.687Z", "updatedAt": "2023-10-13T20:00:00.687Z", "code": "090398", "name": "FEDERAL POLYTECHNIC NEKEDE MICROFINANCE BANK"}
{"id": "1311a8e3-9735-41b9-a403-1992a68852bc", "createdAt": "2023-10-13T20:00:00.694Z", "updatedAt": "2023-10-13T20:00:00.694Z", "code": "090318", "name": "FEDERAL UNIVERSITY DUTSE MICROFINANCE BANK"}
{"id": "a80c81b2-9b2b-4d3d-88e4-70dc5d32e342", "createdAt": "2023-10-13T20:00:00.698Z", "updatedAt": "2023-10-13T20:00:00.698Z", "code": "090298", "name": "FEDPOLY NASARAWA MICROFINANCE BANK"}
{"id": "ecfee0b4-5398-49b1-8d57-b4778ebf3d4a", "createdAt": "2023-10-13T20:00:00.704Z", "updatedAt": "2023-10-13T20:00:00.704Z", "code": "100001", "name": "FETS"}
{"id": "e35e0944-1434-444d-8fa7-36f7a0353057", "createdAt": "2023-10-13T20:00:00.709Z", "updatedAt": "2023-10-13T20:00:00.709Z", "code": "090153", "name": "FFS MICROFINANCE BANK"}
{"id": "bcc1cad3-a72b-4e22-b256-1072c2ea24df", "createdAt": "2023-10-13T20:00:00.737Z", "updatedAt": "2023-10-13T20:00:00.737Z", "code": "070026", "name": "FHA MORTGAGE BANK LTD"}
{"id": "c7bff190-db6f-4d68-9cab-f93cefc9c665", "createdAt": "2023-10-13T20:00:00.743Z", "updatedAt": "2023-10-13T20:00:00.743Z", "code": "000007", "name": "FIDELITY BANK"}
{"id": "e1363d22-b883-4f8a-b766-d74eea955873", "createdAt": "2023-10-13T20:00:00.746Z", "updatedAt": "2023-10-13T20:00:00.746Z", "code": "100019", "name": "FIDELITY MOBILE"}
{"id": "94c96afa-3e2d-474d-8ba5-d95f0b2defe6", "createdAt": "2023-10-13T20:00:00.750Z", "updatedAt": "2023-10-13T20:00:00.750Z", "code": "090126", "name": "FIDFUND MICROFINANCE Bank"}
{"id": "70f212c0-ee9d-48c7-8eb1-0410d0419a0a", "createdAt": "2023-10-13T20:00:00.753Z", "updatedAt": "2023-10-13T20:00:00.753Z", "code": "090111", "name": "FINATRUST MICROFINANCE BANK"}
{"id": "0fdc5a02-6581-4d32-8af9-67d39fbcd81b", "createdAt": "2023-10-13T20:00:00.759Z", "updatedAt": "2023-10-13T20:00:00.759Z", "code": "090400", "name": "FINCA MICROFINANCE BANK"}
{"id": "ae6a51d4-1b3c-4f50-8977-09c0e407e059", "createdAt": "2023-10-13T20:00:00.763Z", "updatedAt": "2023-10-13T20:00:00.763Z", "code": "090366", "name": "FIRMUS MICROFINANCE BANK"}
{"id": "d30ffd5c-7881-426b-88e0-666e95051f93", "createdAt": "2023-10-13T20:00:00.767Z", "updatedAt": "2023-10-13T20:00:00.767Z", "code": "110004", "name": "FIRST APPLE LIMITED"}
{"id": "2dbdc7fa-902a-482b-a96c-75e214d8088d", "createdAt": "2023-10-13T20:00:00.771Z", "updatedAt": "2023-10-13T20:00:00.771Z", "code": "000016", "name": "FIRST BANK OF NIGERIA"}
{"id": "967ae55b-4ff8-445c-bf0d-88f0bf0fcb68", "createdAt": "2023-10-13T20:00:00.776Z", "updatedAt": "2023-10-13T20:00:00.776Z", "code": "000003", "name": "FIRST CITY MONUMENT BANK"}
{"id": "5149ae58-715c-47c0-aa7e-cd90163fd616", "createdAt": "2023-10-13T20:00:00.780Z", "updatedAt": "2023-10-13T20:00:00.780Z", "code": "070014", "name": "FIRST GENERATION MORTGAGE BANK"}
{"id": "8e9abd45-101e-4131-809d-5ca10df06fb3", "createdAt": "2023-10-13T20:00:00.787Z", "updatedAt": "2023-10-13T20:00:00.787Z", "code": "090575", "name": "FIRSTMIDAS MICROFINANCE BANK LTD"}
{"id": "8703b05f-827b-4ea7-b9bc-217c7a1b740b", "createdAt": "2023-10-13T20:00:00.792Z", "updatedAt": "2023-10-13T20:00:00.792Z", "code": "100014", "name": "FIRSTMONIE WALLET"}
{"id": "e41e7ebf-3e49-41e8-9041-526682dc749e", "createdAt": "2023-10-13T20:00:00.796Z", "updatedAt": "2023-10-13T20:00:00.796Z", "code": "090163", "name": "FIRST MULTIPLE MFB"}
{"id": "293b2c34-5351-408f-9810-e20104473b97", "createdAt": "2023-10-13T20:00:00.803Z", "updatedAt": "2023-10-13T20:00:00.803Z", "code": "090285", "name": "FIRST OPTION MICROFINANCE BANK"}
{"id": "c32d2e3d-4cf6-404f-a976-181b2cf6858f", "createdAt": "2023-10-13T20:00:00.806Z", "updatedAt": "2023-10-13T20:00:00.806Z", "code": "090164", "name": "FIRST ROYAL MICROFINANCE BANK"}
{"id": "0ba19637-133e-437b-abdd-d8e792bf45d2", "createdAt": "2023-10-13T20:00:00.810Z", "updatedAt": "2023-10-13T20:00:00.810Z", "code": "090107", "name": "FIRST TRUST MORTGAGE BANK PLC"}
{"id": "d292ae92-983d-4287-a1af-2764eb814f6e", "createdAt": "2023-10-13T20:00:00.815Z", "updatedAt": "2023-10-13T20:00:00.815Z", "code": "090614", "name": "Flourish MFB"}
{"id": "58e57283-4b51-4f53-a3be-ba0c8b5f9bd6", "createdAt": "2023-10-13T20:00:00.818Z", "updatedAt": "2023-10-13T20:00:00.818Z", "code": "110002", "name": "FLUTTERWAVE TECHNOLOGY SOLUTIONS LIMITED"}
{"id": "1d16d6f0-bc29-4b4f-877b-c6ac94be3cd6", "createdAt": "2023-10-13T20:00:00.821Z", "updatedAt": "2023-10-13T20:00:00.821Z", "code": "070002", "name": "FORTIS MICROFINANCE BANK"}
{"id": "043b64ab-f4b5-471a-b96e-c475df089fda", "createdAt": "2023-10-13T20:00:00.824Z", "updatedAt": "2023-10-13T20:00:00.824Z", "code": "100016", "name": "FORTIS MOBILE"}
{"id": "82955d9b-e84c-4047-a97c-c40a5d5bd1ff", "createdAt": "2023-10-13T20:00:00.828Z", "updatedAt": "2023-10-13T20:00:00.828Z", "code": "400001", "name": "FSDH"}
{"id": "b4ee7f68-c5dc-4deb-8dc1-1b646e1a500c", "createdAt": "2023-10-13T20:00:00.832Z", "updatedAt": "2023-10-13T20:00:00.832Z", "code": "090145", "name": "FULLRANGE MICROFINANCE BANK"}
{"id": "83f47c63-a69b-4432-9c30-fc1b25097fc2", "createdAt": "2023-10-13T20:00:00.839Z", "updatedAt": "2023-10-13T20:00:00.839Z", "code": "050010", "name": "FUNDQUEST FINANCIAL SERVICES"}
{"id": "a7ffb265-a289-48d8-8fd6-6e1f491a00dc", "createdAt": "2023-10-13T20:00:00.846Z", "updatedAt": "2023-10-13T20:00:00.846Z", "code": "090158", "name": "FUTO MICROFINANCE BANK"}
{"id": "99f71303-3364-4d80-8420-868668594d48", "createdAt": "2023-10-13T20:00:00.850Z", "updatedAt": "2023-10-13T20:00:00.850Z", "code": "090591", "name": "Gabsyn MFB"}
{"id": "e4b1e5fe-01ac-4bd3-abe5-dec1d058864a", "createdAt": "2023-10-13T20:00:00.862Z", "updatedAt": "2023-10-13T20:00:00.862Z", "code": "090168", "name": "GASHUA MICROFINANCE BANK"}
{"id": "2ed21d95-f16e-4ed3-b7ec-a2fcae02f372", "createdAt": "2023-10-13T20:00:00.871Z", "updatedAt": "2023-10-13T20:00:00.871Z", "code": "070009", "name": "GATEWAY MORTGAGE BANK"}
{"id": "cb7bf38f-ee8a-466c-a795-ccda685e0dbc", "createdAt": "2023-10-13T20:00:00.879Z", "updatedAt": "2023-10-13T20:00:00.879Z", "code": "090579", "name": "GBEDE Microfinance Bank"}
{"id": "21c66fb2-50af-4012-be74-81c28197c6c3", "createdAt": "2023-10-13T20:00:00.884Z", "updatedAt": "2023-10-13T20:00:00.884Z", "code": "090411", "name": "GiGinya Microfinance Bank"}
{"id": "93f68b59-7205-476a-9ca9-7390988c3c7d", "createdAt": "2023-10-13T20:00:00.888Z", "updatedAt": "2023-10-13T20:00:00.888Z", "code": "090186", "name": "GIREI MICROFINANACE BANK"}
{"id": "74895d06-10f1-4646-8e53-cec799618cea", "createdAt": "2023-10-13T20:00:00.893Z", "updatedAt": "2023-10-13T20:00:00.893Z", "code": "000027", "name": "GLOBUS BANK"}
{"id": "2c774729-69a2-4e83-92f8-3bae4b25fd74", "createdAt": "2023-10-13T20:00:00.896Z", "updatedAt": "2023-10-13T20:00:00.896Z", "code": "090278", "name": "GLORY MICROFINANCE BANK"}
{"id": "a55a46ef-76bb-4896-80ea-40eb8ad27772", "createdAt": "2023-10-13T20:00:00.901Z", "updatedAt": "2023-10-13T20:00:00.901Z", "code": "090408", "name": "GMB MICROFINANCE BANK"}
{"id": "b78332c4-8f56-4e19-a78f-7694c1943444", "createdAt": "2023-10-13T20:00:00.904Z", "updatedAt": "2023-10-13T20:00:00.904Z", "code": "090574", "name": "GOLDMAN MICROFINANCE BANK LTD"}
{"id": "3367b63b-d68d-423d-8e79-4402e39d6626", "createdAt": "2023-10-13T20:00:00.908Z", "updatedAt": "2023-10-13T20:00:00.908Z", "code": "090586", "name": "GOMBE MICROFINANCE BANK LTD"}
{"id": "6907bbf7-d4db-403e-9669-777e3411078d", "createdAt": "2023-10-13T20:00:00.912Z", "updatedAt": "2023-10-13T20:00:00.912Z", "code": "090122", "name": "GOWANS MICROFINANCE BANK"}
{"id": "6731d2e7-6fd7-4a51-a171-743d6b693f08", "createdAt": "2023-10-13T20:00:00.920Z", "updatedAt": "2023-10-13T20:00:00.920Z", "code": "090599", "name": "Greenacres MFB"}
{"id": "7342d620-bac2-4305-bace-f59522c18b94", "createdAt": "2023-10-13T20:00:00.924Z", "updatedAt": "2023-10-13T20:00:00.924Z", "code": "090178", "name": "GREENBANK MICROFINANCE BANK"}
{"id": "f2c64025-8667-4c98-80db-e7ca8ebe0ab6", "createdAt": "2023-10-13T20:00:00.927Z", "updatedAt": "2023-10-13T20:00:00.927Z", "code": "090269", "name": "GREENVILLE MICROFINANCE BANK"}
{"id": "ad5f10b1-c2e4-47ae-91ea-b894ac220ff0", "createdAt": "2023-10-13T20:00:00.929Z", "updatedAt": "2023-10-13T20:00:00.929Z", "code": "090195", "name": "GROOMING MICROFINANCE BANK"}
{"id": "97ec2202-f3b2-4841-aef2-173f917d18cb", "createdAt": "2023-10-13T20:00:00.933Z", "updatedAt": "2023-10-13T20:00:00.933Z", "code": "000013", "name": "GTBANK PLC"}
{"id": "3bf3b556-b8c2-402c-8f03-4510a9145cd5", "createdAt": "2023-10-13T20:00:00.940Z", "updatedAt": "2023-10-13T20:00:00.940Z", "code": "090385", "name": "GTI MICROFINANCE BANK"}
{"id": "3bf9ac3b-d204-4c61-8bef-4bdcc26ec5c3", "createdAt": "2023-10-13T20:00:00.944Z", "updatedAt": "2023-10-13T20:00:00.944Z", "code": "100009", "name": "GT MOBILE"}
{"id": "2bd04d20-340b-4a3d-86a6-fdf98d09699d", "createdAt": "2023-10-13T20:00:00.946Z", "updatedAt": "2023-10-13T20:00:00.946Z", "code": "090147", "name": "HACKMAN MICROFINANCE BANK"}
{"id": "55e33413-f195-47c7-ac2e-77bbfb8d80d7", "createdAt": "2023-10-13T20:00:00.949Z", "updatedAt": "2023-10-13T20:00:00.949Z", "code": "070017", "name": "HAGGAI MORTGAGE BANK LIMITED"}
{"id": "589a2614-a40e-4b49-b010-bcd183abea46", "createdAt": "2023-10-13T20:00:00.955Z", "updatedAt": "2023-10-13T20:00:00.955Z", "code": "090121", "name": "HASAL MICROFINANCE BANK"}
{"id": "d59c9a98-321e-4944-ab16-920cac1609c0", "createdAt": "2023-10-13T20:00:00.960Z", "updatedAt": "2023-10-13T20:00:00.960Z", "code": "090363", "name": "HEADWAY MICROFINANCE BANK"}
{"id": "ad61edd6-812b-4878-9bf1-3144f89f610f", "createdAt": "2023-10-13T20:00:00.962Z", "updatedAt": "2023-10-13T20:00:00.962Z", "code": "100017", "name": "HEDONMARK"}
{"id": "38cff360-7a03-4a21-a63a-62ca74e4a069", "createdAt": "2023-10-13T20:00:00.964Z", "updatedAt": "2023-10-13T20:00:00.964Z", "code": "000020", "name": "HERITAGE BANK"}
{"id": "18bc9596-4eb5-4d6c-9dcb-a92c8f51936e", "createdAt": "2023-10-13T20:00:00.966Z", "updatedAt": "2023-10-13T20:00:00.966Z", "code": "120002", "name": "HOPEPSB"}
{"id": "71c929b3-09af-4df6-89a4-44758c0c3548", "createdAt": "2023-10-13T20:00:00.968Z", "updatedAt": "2023-10-13T20:00:00.968Z", "code": "090598", "name": "IBA MFB"}
{"id": "4ab57a1c-cc7b-4065-81c9-d20f273942a6", "createdAt": "2023-10-13T20:00:00.971Z", "updatedAt": "2023-10-13T20:00:00.971Z", "code": "090118", "name": "IBILE MICROFINANCE BANK"}
{"id": "e5daa513-d739-46e6-888f-82db7e5c0650", "createdAt": "2023-10-13T20:00:00.973Z", "updatedAt": "2023-10-13T20:00:00.973Z", "code": "090324", "name": "IKENNE MICROFINANCE BANK"}
{"id": "7053cde5-02b1-4545-b64b-8210899fb474", "createdAt": "2023-10-13T20:00:00.976Z", "updatedAt": "2023-10-13T20:00:00.976Z", "code": "090279", "name": "IKIRE MICROFINANCE BANK"}
{"id": "47b4128f-7ece-489f-98e9-54e242b9f157", "createdAt": "2023-10-13T20:00:00.979Z", "updatedAt": "2023-10-13T20:00:00.979Z", "code": "090275", "name": "IKIRE MICROFINANCE BANK"}
{"id": "9fd647a7-cb79-47a1-8441-5d14340665e2", "createdAt": "2023-10-13T20:00:00.981Z", "updatedAt": "2023-10-13T20:00:00.981Z", "code": "090571", "name": "ILARO POLY MICROFINANCE BANK LTD"}
{"id": "99750a4a-334f-4a02-b676-83a0ae12f6cd", "createdAt": "2023-10-13T20:00:00.983Z", "updatedAt": "2023-10-13T20:00:00.983Z", "code": "090370", "name": "ILISAN MICROFINANCE BANK"}
{"id": "009baa3e-03d5-4da0-bec0-77aaae0ecdad", "createdAt": "2023-10-13T20:00:00.985Z", "updatedAt": "2023-10-13T20:00:00.985Z", "code": "090258", "name": "IMO STATE MICROFINANCE BANK"}
{"id": "2f809e85-0437-4546-b313-c0748dc2adce", "createdAt": "2023-10-13T20:00:00.988Z", "updatedAt": "2023-10-13T20:00:00.988Z", "code": "090417", "name": "Imowo Microfinance Bank"}
{"id": "46a5548a-7946-420a-90ca-01310bcd63dd", "createdAt": "2023-10-13T20:00:00.990Z", "updatedAt": "2023-10-13T20:00:00.990Z", "code": "100024", "name": "IMPERIAL HOMES MORTGAGE BANK"}
{"id": "62670a79-6603-414b-b594-ba4fe17eb791", "createdAt": "2023-10-13T20:00:00.992Z", "updatedAt": "2023-10-13T20:00:00.992Z", "code": "090157", "name": "INFINITY MICROFINANCE BANK"}
{"id": "a05352a2-76ff-4321-967b-9bb92d683efe", "createdAt": "2023-10-13T20:00:00.994Z", "updatedAt": "2023-10-13T20:00:00.994Z", "code": "070016", "name": "INFINITY TRUST MORTGAGE BANK"}
{"id": "84d8064c-e0cc-4333-b2cd-3f7d0ed9c5dc", "createdAt": "2023-10-13T20:00:00.999Z", "updatedAt": "2023-10-13T20:00:00.999Z", "code": "100029", "name": "INNOVECTIVES KESH"}
{"id": "db341cf7-b0ec-41cf-a6ea-1807c7ed85f6", "createdAt": "2023-10-13T20:00:01.001Z", "updatedAt": "2023-10-13T20:00:01.001Z", "code": "100027", "name": "INTELLIFIN"}
{"id": "970ce5c7-b45f-4d81-bd85-be1be447b5fd", "createdAt": "2023-10-13T20:00:01.004Z", "updatedAt": "2023-10-13T20:00:01.004Z", "code": "090386", "name": "INTERLAND MICROFINANCE BANK"}
{"id": "c4a3cab5-fc46-447a-bca4-8e580bbe656e", "createdAt": "2023-10-13T20:00:01.006Z", "updatedAt": "2023-10-13T20:00:01.006Z", "code": "110003", "name": "INTERSWITCH LIMITED"}
{"id": "3b21e7f9-5f17-430f-acb6-445b51460f0a", "createdAt": "2023-10-13T20:00:01.009Z", "updatedAt": "2023-10-13T20:00:01.009Z", "code": "090149", "name": "IRL MICROFINANCE BANK"}
{"id": "d0792c05-fee2-4610-a85b-c2b6ff96250e", "createdAt": "2023-10-13T20:00:01.012Z", "updatedAt": "2023-10-13T20:00:01.012Z", "code": "090377", "name": "ISALEOYO MICROFINANCE BANK"}
{"id": "553de8f9-1043-4bb1-94f5-4b7393b5001b", "createdAt": "2023-10-13T20:00:01.014Z", "updatedAt": "2023-10-13T20:00:01.014Z", "code": "090584", "name": "ISLAND MICROFINANCE BANK LTD"}
{"id": "d2bcdf0d-c62f-444d-838f-d354566dc05b", "createdAt": "2023-10-13T20:00:01.016Z", "updatedAt": "2023-10-13T20:00:01.016Z", "code": "090578", "name": "IWADE MICROFINANCE BANK LTD"}
{"id": "a6303cde-4fbe-4187-9aaf-28528bbb0656", "createdAt": "2023-10-13T20:00:01.018Z", "updatedAt": "2023-10-13T20:00:01.018Z", "code": "090570", "name": "IYAMOYE MICROFINANCE BANK LTD"}
{"id": "12c87604-1e09-4d12-8cb9-a1c02b919315", "createdAt": "2023-10-13T20:00:01.023Z", "updatedAt": "2023-10-13T20:00:01.023Z", "code": "000006", "name": "JAIZ BANK"}
{"id": "7019f32a-1525-452c-89ea-7223c540b6a9", "createdAt": "2023-10-13T20:00:01.026Z", "updatedAt": "2023-10-13T20:00:01.026Z", "code": "090003", "name": "JUBILEE LIFE"}
{"id": "4b0da1ff-d642-4456-87b2-b1f0205dea60", "createdAt": "2023-10-13T20:00:01.028Z", "updatedAt": "2023-10-13T20:00:01.028Z", "code": "090320", "name": "KADPOLY MICROFINANCE BANK"}
{"id": "897e6d64-0856-4f8d-a838-5c5df745f2d9", "createdAt": "2023-10-13T20:00:01.031Z", "updatedAt": "2023-10-13T20:00:01.031Z", "code": "090592", "name": "Kano Poly MFB"}
{"id": "7ccf0c4c-8426-4d00-ae07-09cec0597b2e", "createdAt": "2023-10-13T20:00:01.033Z", "updatedAt": "2023-10-13T20:00:01.033Z", "code": "090191", "name": "KCMB MICROFINANCE BANK"}
{"id": "46bfdbd3-1cbe-4792-9b79-3c69011bc90c", "createdAt": "2023-10-13T20:00:01.035Z", "updatedAt": "2023-10-13T20:00:01.035Z", "code": "100036", "name": "KEGOW(CHAMSMOBILE)"}
{"id": "a4793956-3663-4615-bee7-761e32169ecd", "createdAt": "2023-10-13T20:00:01.038Z", "updatedAt": "2023-10-13T20:00:01.038Z", "code": "090602", "name": "KENECHUKWU MICROFINANCE BANK"}
{"id": "7ec1bc0d-a5b1-4a43-aba9-6d5de28aaf87", "createdAt": "2023-10-13T20:00:01.040Z", "updatedAt": "2023-10-13T20:00:01.040Z", "code": "000002", "name": "KEYSTONE BANK"}
{"id": "97bcafe7-62a1-41e0-8bab-d94cd899f82b", "createdAt": "2023-10-13T20:00:01.042Z", "updatedAt": "2023-10-13T20:00:01.042Z", "code": "090299", "name": "KONTAGORA MICROFINANCE BANK"}
{"id": "15b5aa40-a92c-493e-8573-aa497c8cdee5", "createdAt": "2023-10-13T20:00:01.045Z", "updatedAt": "2023-10-13T20:00:01.045Z", "code": "090380", "name": "KREDI MONEY MICROFINANCE BANK"}
{"id": "0e9e673f-10b5-42b3-bec5-193fd2cb8043", "createdAt": "2023-10-13T20:00:01.047Z", "updatedAt": "2023-10-13T20:00:01.047Z", "code": "090267", "name": "KUDA MICROFINANCE BANK"}
{"id": "070414cf-a264-447f-ba7f-0f462d8cb612", "createdAt": "2023-10-13T20:00:01.050Z", "updatedAt": "2023-10-13T20:00:01.050Z", "code": "070012", "name": "LAGOS BUILDING AND INVESTMENT COMPANY"}
{"id": "76cfb0fe-c837-4fc4-8a7f-a2b394f53bd0", "createdAt": "2023-10-13T20:00:01.055Z", "updatedAt": "2023-10-13T20:00:01.055Z", "code": "090422", "name": "Landgold  Microfinance Bank"}
{"id": "21b5460a-59f1-4b31-ba46-fa93631795be", "createdAt": "2023-10-13T20:00:01.058Z", "updatedAt": "2023-10-13T20:00:01.058Z", "code": "090177", "name": "LAPO MICROFINANCE BANK"}
{"id": "86ef9555-b141-4802-86a3-f5421b751bdf", "createdAt": "2023-10-13T20:00:01.060Z", "updatedAt": "2023-10-13T20:00:01.060Z", "code": "090271", "name": "LAVENDER MICROFINANCE BANK"}
{"id": "89aa73ef-9306-444b-924e-8a83533757a4", "createdAt": "2023-10-13T20:00:01.063Z", "updatedAt": "2023-10-13T20:00:01.063Z", "code": "110044", "name": "Leadremit Limited"}
{"id": "b7454037-564a-4ef5-be60-c11db112f181", "createdAt": "2023-10-13T20:00:01.065Z", "updatedAt": "2023-10-13T20:00:01.065Z", "code": "090372", "name": "LEGEND MICROFINANCE BANK"}
{"id": "a497de5b-f7bb-4ccb-b223-0ebb5ca2e167", "createdAt": "2023-10-13T20:00:01.067Z", "updatedAt": "2023-10-13T20:00:01.067Z", "code": "090420", "name": "LETSHEGO MICROFINANCE BANK"}
{"id": "b615a277-71a4-4fe4-a627-b9aba63172cb", "createdAt": "2023-10-13T20:00:01.070Z", "updatedAt": "2023-10-13T20:00:01.070Z", "code": "070007", "name": "LIVINGTRUST MORTGAGE BANK PLC"}
{"id": "44a994e0-00cd-45c0-9649-449b3db0a9d9", "createdAt": "2024-05-10T16:32:58.173Z", "updatedAt": "2024-05-10T16:32:58.173Z", "code": "090620", "name": "LOMA BANK"}
{"id": "d5e2d55d-e325-4f45-b25a-cff9085d6b13", "createdAt": "2023-10-13T20:00:01.072Z", "updatedAt": "2023-10-13T20:00:01.072Z", "code": "090265", "name": "LOVONUS MICROFINANCE BANK"}
{"id": "41a78c59-1720-4314-ab15-068574e57549", "createdAt": "2023-10-13T20:00:01.075Z", "updatedAt": "2023-10-13T20:00:01.075Z", "code": "100035", "name": "M36"}
{"id": "ac3ee1ea-0241-473e-9653-0e37d4763453", "createdAt": "2023-10-13T20:00:01.077Z", "updatedAt": "2023-10-13T20:00:01.077Z", "code": "090603", "name": "Macrod MFB"}
{"id": "f48f65cf-160b-49ae-ac13-44c9c17caad1", "createdAt": "2023-10-13T20:00:01.079Z", "updatedAt": "2023-10-13T20:00:01.079Z", "code": "090323", "name": "MAINLAND MICROFINANCE BANK"}
{"id": "25a176bd-0c80-4515-99e8-515249ee08ab", "createdAt": "2023-10-13T20:00:01.081Z", "updatedAt": "2023-10-13T20:00:01.081Z", "code": "090171", "name": "MAINSTREET MICROFINANCE BANK"}
{"id": "f6f4bc0e-7b57-45fe-a43d-68309ba8b255", "createdAt": "2023-10-13T20:00:01.084Z", "updatedAt": "2023-10-13T20:00:01.084Z", "code": "090174", "name": "MALACHY MICROFINANCE BANK"}
{"id": "ea14106b-af2a-44f9-9455-30b2dfbc0bff", "createdAt": "2023-10-13T20:00:01.086Z", "updatedAt": "2023-10-13T20:00:01.086Z", "code": "090383", "name": "MANNY MICROFINANCE BANK"}
{"id": "231154be-5718-45b9-b713-59d00351c1b6", "createdAt": "2023-10-13T20:00:01.088Z", "updatedAt": "2023-10-13T20:00:01.088Z", "code": "090410", "name": "MARITIME MICROFINANCE BANK"}
{"id": "b9198492-8db6-4ab3-a005-196cb9b256f7", "createdAt": "2023-10-13T20:00:01.091Z", "updatedAt": "2023-10-13T20:00:01.091Z", "code": "090321", "name": "MAYFAIR MICROFINANCE BANK"}
{"id": "700ccce9-1986-4ccc-9a45-951a2c6088c6", "createdAt": "2023-10-13T20:00:01.093Z", "updatedAt": "2023-10-13T20:00:01.093Z", "code": "070019", "name": "MAYFRESH MORTGAGE BANK"}
{"id": "8660483f-77bd-4bad-a7c3-1fca1509c400", "createdAt": "2023-10-13T20:00:01.095Z", "updatedAt": "2023-10-13T20:00:01.095Z", "code": "090612", "name": "Medef MFB"}
{"id": "b166940e-3212-400c-b058-5605a6d2d89a", "createdAt": "2023-10-13T20:00:01.097Z", "updatedAt": "2023-10-13T20:00:01.097Z", "code": "090280", "name": "MEGAPRAISE MICROFINANCE BANK"}
{"id": "b8f02ee3-61dd-47c8-a673-8ac62b1ece2c", "createdAt": "2023-10-13T20:00:01.100Z", "updatedAt": "2023-10-13T20:00:01.100Z", "code": "090589", "name": "MERCURY MICROFINANCE BANK"}
{"id": "753e011d-18bb-4cad-96c4-054b378ced6a", "createdAt": "2023-10-13T20:00:01.102Z", "updatedAt": "2023-10-13T20:00:01.102Z", "code": "090587", "name": "Microbiz MFB"}
{"id": "76d04caf-7aa0-46ec-931a-127df73acf45", "createdAt": "2023-10-13T20:00:01.105Z", "updatedAt": "2023-10-13T20:00:01.105Z", "code": "090136", "name": "MICROCRED MICROFINANCE BANK"}
{"id": "4cd85706-30de-41f8-96fb-339cba86b6d0", "createdAt": "2023-10-13T20:00:01.107Z", "updatedAt": "2023-10-13T20:00:01.107Z", "code": "090113", "name": "MICROVIS MICROFINANCE BANK"}
{"id": "187887ee-68b2-441c-bf91-4db86f6583d1", "createdAt": "2023-10-13T20:00:01.109Z", "updatedAt": "2023-10-13T20:00:01.109Z", "code": "090192", "name": "MIDLAND MICROFINANCE BANK"}
{"id": "51c68791-80b4-4b9b-bf43-2b7f1cc673f5", "createdAt": "2023-10-13T20:00:01.111Z", "updatedAt": "2023-10-13T20:00:01.111Z", "code": "090281", "name": "MINT-FINEX MFB"}
{"id": "cea978de-7774-4adc-811e-1d6133af04c1", "createdAt": "2023-10-13T20:00:01.114Z", "updatedAt": "2023-10-13T20:00:01.114Z", "code": "090455", "name": "MKOBO MICROFINANCE BANK LTD"}
{"id": "94a7e8a0-804f-4134-815e-b13a570e51af", "createdAt": "2023-10-13T20:00:01.116Z", "updatedAt": "2023-10-13T20:00:01.116Z", "code": "100011", "name": "MKUDI"}
{"id": "322b2cee-e838-4b7c-a190-26b2c7260b6e", "createdAt": "2023-10-13T20:00:01.119Z", "updatedAt": "2023-10-13T20:00:01.119Z", "code": "090362", "name": "MOLUSI MICROFINANCE BANK"}
{"id": "2a16685a-8d93-4ede-8e4b-8f2073c6a30b", "createdAt": "2023-10-13T20:00:01.122Z", "updatedAt": "2023-10-13T20:00:01.122Z", "code": "100020", "name": "MONEY BOX"}
{"id": "640d452e-de46-4e33-a5a1-528e0589c3fa", "createdAt": "2023-10-13T20:00:01.124Z", "updatedAt": "2023-10-13T20:00:01.124Z", "code": "090129", "name": "MONEY TRUST MICROFINANCE BANK"}
{"id": "a6911dec-3352-43e4-9ef2-8838d0a1f637", "createdAt": "2023-10-13T20:00:01.299Z", "updatedAt": "2023-10-13T20:00:01.299Z", "code": "090405", "name": "MONIEPOINT MICROFINANCE BANK"}
{"id": "afd517ca-8a38-4040-aaac-e51bdd561eed", "createdAt": "2023-10-13T20:00:01.127Z", "updatedAt": "2023-10-13T20:00:01.127Z", "code": "090392", "name": "MOZFIN MICROFINANCE BANK"}
{"id": "c3ff60d6-13ad-4c29-975d-18529920a848", "createdAt": "2023-10-13T20:00:01.130Z", "updatedAt": "2023-10-13T20:00:01.130Z", "code": "090190", "name": "MUTUAL BENEFITS MICROFINANCE BANK"}
{"id": "118d511d-a142-4026-ab25-4affb007957b", "createdAt": "2023-10-13T20:00:01.132Z", "updatedAt": "2023-10-13T20:00:01.132Z", "code": "090151", "name": "MUTUAL TRUST MICROFINANCE BANK"}
{"id": "9698f97c-c37d-49f6-b7a9-28a85fcab148", "createdAt": "2023-10-13T20:00:01.135Z", "updatedAt": "2023-10-13T20:00:01.135Z", "code": "090152", "name": "NAGARTA MICROFINANCE BANK"}
{"id": "2df09c7b-285f-4d88-8d6d-b334a84f8958", "createdAt": "2023-10-13T20:00:01.137Z", "updatedAt": "2023-10-13T20:00:01.137Z", "code": "code", "name": "name"}
{"id": "ddae0ff6-cec3-4e2c-a67e-f*******9796", "createdAt": "2023-10-13T20:00:01.140Z", "updatedAt": "2023-10-13T20:00:01.140Z", "code": "090128", "name": "NDIORAH MICROFINANCE BANK"}
{"id": "9baf628d-7aa9-4004-a630-9e1702192ef6", "createdAt": "2023-10-13T20:00:01.143Z", "updatedAt": "2023-10-13T20:00:01.143Z", "code": "090329", "name": "NEPTUNE MICROFINANCE BANK"}
{"id": "5d3cd937-47c5-458d-a4d3-eeaa5a29a9bc", "createdAt": "2023-10-13T20:00:01.145Z", "updatedAt": "2023-10-13T20:00:01.145Z", "code": "090205", "name": "NEW DAWN MICROFINANCE BANK"}
{"id": "eacd870b-7fe5-410c-95a2-2239f75d664e", "createdAt": "2023-10-13T20:00:01.148Z", "updatedAt": "2023-10-13T20:00:01.148Z", "code": "090378", "name": "NEW GOLDEN PASTURES MICROFINANCE BANK"}
{"id": "da3dda1a-7bc9-4f1b-9772-76d0b606a3ab", "createdAt": "2023-10-13T20:00:01.155Z", "updatedAt": "2023-10-13T20:00:01.155Z", "code": "090108", "name": "NEW PRUDENTIAL BANK"}
{"id": "d26f7932-f005-4c67-9299-f4cb88763d44", "createdAt": "2023-10-13T20:00:01.158Z", "updatedAt": "2023-10-13T20:00:01.158Z", "code": "090263", "name": "NIGERIAN NAVY MICROFINANCE BANK"}
{"id": "6e800dce-2583-4dfe-a81e-f9385769629f", "createdAt": "2023-10-13T20:00:01.161Z", "updatedAt": "2023-10-13T20:00:01.161Z", "code": "999999", "name": "NIP VIRTUAL BANK"}
{"id": "57b0b579-04ac-403a-89e1-e5152ab8d084", "createdAt": "2023-10-13T20:00:01.164Z", "updatedAt": "2023-10-13T20:00:01.164Z", "code": "090194", "name": "NIRSAL NATIONAL MICROFINANCE BANK"}
{"id": "b167ad36-17ff-44d3-b2bc-64db392290ea", "createdAt": "2023-10-13T20:00:01.166Z", "updatedAt": "2023-10-13T20:00:01.166Z", "code": "090283", "name": "NNEW WOMEN MICROFINANCE BANK"}
{"id": "a224d0d9-f06c-4fb8-b8d2-ac249a378178", "createdAt": "2023-10-13T20:00:01.169Z", "updatedAt": "2023-10-13T20:00:01.169Z", "code": "060003", "name": "NOVA MERCHANT BANK"}
{"id": "1ed99782-8ba4-4136-bc0d-83f3c4c2aa10", "createdAt": "2023-10-13T20:00:01.171Z", "updatedAt": "2023-10-13T20:00:01.171Z", "code": "100032", "name": "NOWNOW DIGITAL SYSTEMS LIMITED"}
{"id": "e68b7cf7-9b0c-4f16-8bd7-734a625b0963", "createdAt": "2023-10-13T20:00:01.174Z", "updatedAt": "2023-10-13T20:00:01.174Z", "code": "070001", "name": "NPF MICROFINANCE BANK"}
{"id": "92cc4211-4484-4273-8193-429ff9facf82", "createdAt": "2023-10-13T20:00:01.176Z", "updatedAt": "2023-10-13T20:00:01.176Z", "code": "090364", "name": "NUTURE MICROFINANCE BANK"}
{"id": "63d24db3-bd29-48b5-99a6-6c2175119f3f", "createdAt": "2023-10-13T20:00:01.179Z", "updatedAt": "2023-10-13T20:00:01.179Z", "code": "090399", "name": "NWANNEGADI MICROFINANCE BANK"}
{"id": "5bf52bbb-7969-4795-95a5-86a8d41787b5", "createdAt": "2023-10-13T20:00:01.182Z", "updatedAt": "2023-10-13T20:00:01.182Z", "code": "090345", "name": "OAU MICROFINANCE BANK LTD"}
{"id": "00814f35-70c4-4f07-ad35-df037c73510a", "createdAt": "2023-10-13T20:00:01.185Z", "updatedAt": "2023-10-13T20:00:01.185Z", "code": "090333", "name": "OCHE MICROFINANCE BANK"}
{"id": "1a158132-0994-4ba3-81e4-1b69bf2dfdc0", "createdAt": "2023-10-13T20:00:01.188Z", "updatedAt": "2023-10-13T20:00:01.188Z", "code": "090576", "name": "OCTOPUS MICROFINANCE BANK LTD"}
{"id": "6d4cf56b-b9d4-46de-82d0-e32dba4f5b1d", "createdAt": "2023-10-13T20:00:01.191Z", "updatedAt": "2023-10-13T20:00:01.191Z", "code": "090119", "name": "OHAFIA MICROFINANCE BANK"}
{"id": "3da1d689-1cb1-4a7c-b477-8db676ecfc88", "createdAt": "2023-10-13T20:00:01.194Z", "updatedAt": "2023-10-13T20:00:01.194Z", "code": "090161", "name": "OKPOGA MICROFINANCE BANK"}
{"id": "3d886ac1-b8ca-44d2-b509-1f2ebcd32d1e", "createdAt": "2023-10-13T20:00:01.196Z", "updatedAt": "2023-10-13T20:00:01.196Z", "code": "090272", "name": "OLABISI ONABANJO UNIVERSITY MICROFINANCE"}
{"id": "1e5990a6-0d53-4e5e-89a6-29a4ebab0b20", "createdAt": "2023-10-13T20:00:01.199Z", "updatedAt": "2023-10-13T20:00:01.199Z", "code": "090404", "name": "OLOWOLAGBA MICROFINANCE BANK"}
{"id": "235478ad-1e8d-426f-a5a8-dca2b38b333f", "createdAt": "2023-10-13T20:00:01.202Z", "updatedAt": "2023-10-13T20:00:01.202Z", "code": "090295", "name": "OMIYE MICROFINANCE BANK"}
{"id": "3fcda460-a19d-476c-be2f-f447314dfd18", "createdAt": "2023-10-13T20:00:01.204Z", "updatedAt": "2023-10-13T20:00:01.204Z", "code": "100004", "name": "OPAY"}
{"id": "b13e9165-efe3-4883-bab4-919ddeb1cfc0", "createdAt": "2023-10-13T20:00:01.206Z", "updatedAt": "2023-10-13T20:00:01.206Z", "code": "000036", "name": "OPTIMUS BANK"}
{"id": "f7c1c018-8ff5-400a-83a8-f3e7a384b074", "createdAt": "2023-10-13T20:00:01.209Z", "updatedAt": "2023-10-13T20:00:01.209Z", "code": "090588", "name": "Orisun MFB"}
{"id": "2152860a-7452-483a-879c-8ffa4570e6bd", "createdAt": "2023-10-13T20:00:01.212Z", "updatedAt": "2023-10-13T20:00:01.212Z", "code": "090396", "name": "OSCOTECH MICROFINANCE BANK"}
{"id": "736536d8-d74e-4ae8-979f-50c1db3c9837", "createdAt": "2023-10-13T20:00:01.216Z", "updatedAt": "2023-10-13T20:00:01.216Z", "code": "090580", "name": "OTECH MICROFINANCE BANK LTD"}
{"id": "d4929787-c09e-4b8d-9e13-0a26d1929ce8", "createdAt": "2023-10-13T20:00:01.218Z", "updatedAt": "2023-10-13T20:00:01.218Z", "code": "100002", "name": "PAGA"}
{"id": "ddaa0ec8-6c61-45d9-a248-ad7c3936d3e2", "createdAt": "2023-10-13T20:00:01.221Z", "updatedAt": "2023-10-13T20:00:01.221Z", "code": "070008", "name": "PAGE MFBank"}
{"id": "315def57-50bc-418e-a2d4-0949b701230f", "createdAt": "2023-10-13T20:00:01.224Z", "updatedAt": "2023-10-13T20:00:01.224Z", "code": "100033", "name": "PALMPAY"}
{"id": "aedebfa5-c48f-4d7b-9fbc-f9950a7ee8a7", "createdAt": "2023-10-13T20:00:01.227Z", "updatedAt": "2023-10-13T20:00:01.227Z", "code": "090004", "name": "PARALLEX"}
{"id": "2e57dde9-876a-4dc5-9112-514cbd555857", "createdAt": "2023-10-13T20:00:01.230Z", "updatedAt": "2023-10-13T20:00:01.230Z", "code": "100003", "name": "PARKWAY-READYCASH"}
{"id": "9b35e707-c9f0-4cb6-9568-87458faf85aa", "createdAt": "2023-10-13T20:00:01.233Z", "updatedAt": "2023-10-13T20:00:01.233Z", "code": "090317", "name": "PATRICKGOLD MICROFINANCE BANK"}
{"id": "05683ee3-d80f-4e4e-9d65-bb05dc30969c", "createdAt": "2023-10-13T20:00:01.236Z", "updatedAt": "2023-10-13T20:00:01.236Z", "code": "110001", "name": "PAYATTITUDE ONLINE"}
{"id": "8a205a18-efd1-4662-8072-77a91150cbba", "createdAt": "2023-10-13T20:00:01.239Z", "updatedAt": "2023-10-13T20:00:01.239Z", "code": "110006", "name": "PAYSTACK PAYMENT LIMITED"}
{"id": "e71be235-d4f2-4df1-80c3-e90f2267247e", "createdAt": "2023-10-13T20:00:01.242Z", "updatedAt": "2023-10-13T20:00:01.242Z", "code": "090402", "name": "Peace Microfinance Bank"}
{"id": "86f46021-3601-4ea6-8415-69e526e6d4c4", "createdAt": "2023-10-13T20:00:01.244Z", "updatedAt": "2023-10-13T20:00:01.244Z", "code": "090137", "name": "PECANTRUST MICROFINANCE BANK"}
{"id": "643d54ff-67d6-4dca-a0fb-bedfd7a7de6f", "createdAt": "2023-10-13T20:00:01.246Z", "updatedAt": "2023-10-13T20:00:01.246Z", "code": "090196", "name": "PENNYWISE MICROFINANCE BANK"}
{"id": "7f0a9719-bcb2-4302-941f-09d228cd776e", "createdAt": "2023-10-13T20:00:01.248Z", "updatedAt": "2023-10-13T20:00:01.248Z", "code": "090135", "name": "PERSONAL TRUST MICROFINANCE BANK"}
{"id": "4e849f28-ee83-4285-85d2-50da7b867c61", "createdAt": "2023-10-13T20:00:01.250Z", "updatedAt": "2023-10-13T20:00:01.250Z", "code": "90165", "name": "PETRA MICROFINANCE BANK"}
{"id": "fdd38041-4071-4ca9-8266-6a942804724d", "createdAt": "2023-10-13T20:00:01.253Z", "updatedAt": "2023-10-13T20:00:01.253Z", "code": "090165", "name": "PETRA MICROFINANCE BANK"}
{"id": "294acecd-9316-4b99-bd63-fa5843afae62", "createdAt": "2023-10-13T20:00:01.255Z", "updatedAt": "2023-10-13T20:00:01.255Z", "code": "090289", "name": "PILLAR MICROFINANCE BANK"}
{"id": "b0a4ed68-c7ee-4a0b-a0db-26ab7d1ba1c0", "createdAt": "2023-10-13T20:00:01.258Z", "updatedAt": "2023-10-13T20:00:01.258Z", "code": "070013", "name": "PLATINUM MORTGAGE BANK"}
{"id": "79903355-7515-4d0b-a18d-08209e1853b8", "createdAt": "2023-10-13T20:00:01.260Z", "updatedAt": "2023-10-13T20:00:01.260Z", "code": "000008", "name": "POLARIS BANK"}
{"id": "53468e46-e480-4ddf-8517-5efa9a233927", "createdAt": "2023-10-13T20:00:01.263Z", "updatedAt": "2023-10-13T20:00:01.263Z", "code": "090296", "name": "POLYUNWANA MICROFINANCE BANK"}
{"id": "2f322799-5561-4cfb-af84-cb35754e3742", "createdAt": "2023-10-13T20:00:01.265Z", "updatedAt": "2023-10-13T20:00:01.265Z", "code": "090412", "name": "Preeminent Microfinance Bank"}
{"id": "5ef16b36-5af6-4823-bda4-06f2ce97136b", "createdAt": "2023-10-13T20:00:01.267Z", "updatedAt": "2023-10-13T20:00:01.267Z", "code": "090274", "name": "PRESTIGE MICROFINANCE BANK"}
{"id": "62286fc1-d43e-4518-947d-f44c2a48c2de", "createdAt": "2023-10-13T20:00:01.270Z", "updatedAt": "2023-10-13T20:00:01.270Z", "code": "000023", "name": "PROVIDUS BANK"}
{"id": "1bbdfc17-e0da-49fb-b51e-c623b0e5c3cb", "createdAt": "2023-10-13T20:00:01.272Z", "updatedAt": "2023-10-13T20:00:01.272Z", "code": "090303", "name": "PURPLEMONEY MICROFINANCE BANK"}
{"id": "36f80000-28e7-481c-b58b-ea4767d6b939", "createdAt": "2023-10-13T20:00:01.275Z", "updatedAt": "2023-10-13T20:00:01.275Z", "code": "090569", "name": "QUBE MICROFINANCE BANK LTD"}
{"id": "f02c6b22-6fcc-4e8e-9899-310601c7aacd", "createdAt": "2023-10-13T20:00:01.277Z", "updatedAt": "2023-10-13T20:00:01.277Z", "code": "090261", "name": "QUICKFUND MICROFINANCE BANK"}
{"id": "da2fb3d7-5a5d-4fab-a617-29b32f2784ea", "createdAt": "2023-10-13T20:00:01.280Z", "updatedAt": "2023-10-13T20:00:01.280Z", "code": "090170", "name": "RAHAMA MFB"}
{"id": "d4ee853e-7f9f-43d1-ac22-750257be64b7", "createdAt": "2023-10-13T20:00:01.282Z", "updatedAt": "2023-10-13T20:00:01.282Z", "code": "000024", "name": "RAND MERCHANT BANK"}
{"id": "b3108c6d-1555-42c6-90e4-6ed6e137a2a2", "createdAt": "2023-10-13T20:00:01.284Z", "updatedAt": "2023-10-13T20:00:01.284Z", "code": "070011", "name": "REFUGE MORTGAGE BANK"}
{"id": "ac555105-0611-426f-9e01-3d134b0644da", "createdAt": "2023-10-13T20:00:01.287Z", "updatedAt": "2023-10-13T20:00:01.287Z", "code": "090125", "name": "REGENT MICROFINANCE BANK"}
{"id": "c7693deb-10d3-4204-912f-1c49ed613c45", "createdAt": "2023-10-13T20:00:01.289Z", "updatedAt": "2023-10-13T20:00:01.289Z", "code": "090173", "name": "RELIANCE MICROFINANCE BANK"}
{"id": "5690436c-f23f-44cb-9c70-49b0a893ab8c", "createdAt": "2023-10-13T20:00:01.292Z", "updatedAt": "2023-10-13T20:00:01.292Z", "code": "090198", "name": "RENMONEY MICROFINANCE BANK"}
{"id": "ce47652f-0dff-432e-b08f-a500a4ddb1a5", "createdAt": "2023-10-13T20:00:01.294Z", "updatedAt": "2023-10-13T20:00:01.294Z", "code": "090322", "name": "REPHIDIM MICROFINANCE BANK"}
{"id": "52f2bcec-1cac-4d83-9b50-1ae551f89d19", "createdAt": "2023-10-13T20:00:01.296Z", "updatedAt": "2023-10-13T20:00:01.296Z", "code": "090132", "name": "RICHWAY MICROFINANCE BANK"}
{"id": "e1fbd2fc-0a57-4b65-aff8-04b0bc4dc420", "createdAt": "2023-10-13T20:00:01.302Z", "updatedAt": "2023-10-13T20:00:01.302Z", "code": "090138", "name": "ROYAL EXCHANGE MICROFINANCE BANK"}
{"id": "a5834614-2e29-4d61-8935-a97100ba01d4", "createdAt": "2023-10-13T20:00:01.304Z", "updatedAt": "2023-10-13T20:00:01.304Z", "code": "090175", "name": "RUBIES MICROFINANCE BANK"}
{"id": "ced1d262-7c6e-4653-9185-944b54e1673d", "createdAt": "2023-10-13T20:00:01.306Z", "updatedAt": "2023-10-13T20:00:01.306Z", "code": "090286", "name": "SAFE HAVEN MICROFINANCE BANK"}
{"id": "7d598730-82d0-4088-975b-609a39e9d8a2", "createdAt": "2023-10-13T20:00:01.309Z", "updatedAt": "2023-10-13T20:00:01.309Z", "code": "090006", "name": "SAFETRUST"}
{"id": "29a07824-60e7-4fbc-99f5-a62f2197d0a8", "createdAt": "2023-10-13T20:00:01.311Z", "updatedAt": "2023-10-13T20:00:01.311Z", "code": "090140", "name": "SAGAMU MICROFINANCE BANK"}
{"id": "b1a661f5-e385-4922-b394-09425ee0e05d", "createdAt": "2023-10-13T20:00:01.314Z", "updatedAt": "2023-10-13T20:00:01.314Z", "code": "090112", "name": "SEED CAPITAL MICROFINANCE BANK"}
{"id": "d2d21ffe-9de6-4437-93a7-7c51275a664e", "createdAt": "2023-10-13T20:00:01.316Z", "updatedAt": "2023-10-13T20:00:01.316Z", "code": "090369", "name": "SEEDVEST MICROFINANCE BANK"}
{"id": "e840ac51-d684-4009-b696-92f84b7fed69", "createdAt": "2023-10-13T20:00:01.318Z", "updatedAt": "2023-10-13T20:00:01.318Z", "code": "090401", "name": "SHERPERD TRUST MICROFINANCE BANK"}
{"id": "390a9f21-f120-4fc1-abc7-bf81177f9661", "createdAt": "2023-10-13T20:00:01.320Z", "updatedAt": "2023-10-13T20:00:01.320Z", "code": "000034", "name": "Signature Bank"}
{"id": "0a7ff782-8078-4622-a850-8bd2f10c54de", "createdAt": "2023-10-13T20:00:01.323Z", "updatedAt": "2023-10-13T20:00:01.323Z", "code": "090573", "name": "SNOW MFB"}
{"id": "d477d857-add7-43f9-a6fa-e9f042efd17f", "createdAt": "2023-10-13T20:00:01.325Z", "updatedAt": "2023-10-13T20:00:01.325Z", "code": "090325", "name": "SPARKLE"}
{"id": "ab38102e-d134-43f0-b327-9c5d0f11b5b7", "createdAt": "2023-10-13T20:00:01.328Z", "updatedAt": "2023-10-13T20:00:01.328Z", "code": "000012", "name": "STANBIC IBTC BANK"}
{"id": "c6904a1a-40a4-4bf0-ab6b-90ce378d34ac", "createdAt": "2023-10-13T20:00:01.331Z", "updatedAt": "2023-10-13T20:00:01.331Z", "code": "100007", "name": "STANBIC IBTC @Ease WALLET"}
{"id": "b29a622a-351b-4a2a-8bca-9c37878aaaf6", "createdAt": "2023-10-13T20:00:01.333Z", "updatedAt": "2023-10-13T20:00:01.333Z", "code": "000021", "name": "STANDARD CHARTERED BANK"}
{"id": "710d7496-ffbb-4411-8d4b-1ab2b4499b61", "createdAt": "2023-10-13T20:00:01.336Z", "updatedAt": "2023-10-13T20:00:01.336Z", "code": "090162", "name": "STANFORD MICROFINANCE BANK"}
{"id": "a153f024-f6d1-4ef5-b06d-f7a273f8ef72", "createdAt": "2023-10-13T20:00:01.339Z", "updatedAt": "2023-10-13T20:00:01.339Z", "code": "090583", "name": "STATESIDE MFB"}
{"id": "10c9d1c5-31fc-46e8-be95-efcf7344a69d", "createdAt": "2023-10-13T20:00:01.341Z", "updatedAt": "2023-10-13T20:00:01.341Z", "code": "090262", "name": "STELLAS MICROFINANCE BANK"}
{"id": "ca7c441a-1a4a-4c6b-bcd4-ca76b9165c0a", "createdAt": "2023-10-13T20:00:01.344Z", "updatedAt": "2023-10-13T20:00:01.344Z", "code": "000001", "name": "STERLING BANK"}
{"id": "3ffd3caf-d50c-4bda-aacc-152e87e8437f", "createdAt": "2023-10-13T20:00:01.347Z", "updatedAt": "2023-10-13T20:00:01.347Z", "code": "100022", "name": "STERLING MOBILE"}
{"id": "7b9dc58d-8321-40e3-8afe-6357d8849d0f", "createdAt": "2023-10-13T20:00:01.349Z", "updatedAt": "2023-10-13T20:00:01.349Z", "code": "090305", "name": "SULSPAP MICROFINANCE BANK"}
{"id": "23aaa344-56bc-4aeb-99d9-0bc8296bc8b4", "createdAt": "2023-10-13T20:00:01.353Z", "updatedAt": "2023-10-13T20:00:01.353Z", "code": "090302", "name": "Sunbeam Microfinance Bank"}
{"id": "508ed125-c342-4a93-9f00-9ecedafc6be5", "createdAt": "2023-10-13T20:00:01.355Z", "updatedAt": "2023-10-13T20:00:01.355Z", "code": "000022", "name": "SUNTRUST BANK"}
{"id": "9bb425ab-a746-4c1f-96d6-3870f9641dee", "createdAt": "2023-10-13T20:00:01.358Z", "updatedAt": "2023-10-13T20:00:01.358Z", "code": "100023", "name": "TAGPAY"}
{"id": "9a31f934-5d3a-41d3-b792-98d3e035f796", "createdAt": "2023-10-13T20:00:01.360Z", "updatedAt": "2023-10-13T20:00:01.360Z", "code": "000026", "name": "TAJ BANK"}
{"id": "a10cf3a8-78f2-472e-9d5f-47e327ca7adb", "createdAt": "2023-10-13T20:00:01.364Z", "updatedAt": "2023-10-13T20:00:01.364Z", "code": "090593", "name": "TASUED MICROFINANCE BANK LTD"}
{"id": "83c535be-3dbd-4491-8574-a9597660a70e", "createdAt": "2023-10-13T20:00:01.367Z", "updatedAt": "2023-10-13T20:00:01.367Z", "code": "090115", "name": "TCF MICROFINANCE BANK"}
{"id": "0fe79725-b8c2-47ae-ba09-bd1e93316ca2", "createdAt": "2023-10-13T20:00:01.369Z", "updatedAt": "2023-10-13T20:00:01.369Z", "code": "110007", "name": "TEAMAPT LIMITED"}
{"id": "e3fa7356-983a-4017-af5f-a48ec00b2fc2", "createdAt": "2023-10-13T20:00:01.372Z", "updatedAt": "2023-10-13T20:00:01.372Z", "code": "100010", "name": "TEASY MOBILE"}
{"id": "ff292560-3478-459c-b1c9-2603a3842c40", "createdAt": "2023-10-13T20:00:01.375Z", "updatedAt": "2023-10-13T20:00:01.375Z", "code": "050007", "name": "Tekla Finance Ltd"}
{"id": "e72ce10c-575f-4dbf-868e-a56fd1d0b1f3", "createdAt": "2023-10-13T20:00:01.378Z", "updatedAt": "2023-10-13T20:00:01.378Z", "code": "090373", "name": "THINK FINANCE MICROFINANCE BANK"}
{"id": "48ea2023-2aa6-403f-b595-cf66b512ecdd", "createdAt": "2024-04-15T08:50:09.959Z", "updatedAt": "2024-04-15T08:50:09.959Z", "code": "100039", "name": "TITAN-PAYSTACK MICROFINANCE BANK"}
{"id": "9715878b-340a-4a8b-a3ff-2348ba4f449b", "createdAt": "2023-10-13T20:00:01.380Z", "updatedAt": "2023-10-13T20:00:01.380Z", "code": "000025", "name": "TITAN TRUST BANK"}
{"id": "83851039-649f-4b5b-b347-ee9856237a90", "createdAt": "2023-10-13T20:00:01.383Z", "updatedAt": "2023-10-13T20:00:01.383Z", "code": "090613", "name": "Total Trust Microfinance Bank"}
{"id": "64caf8ac-3d32-47ad-b2d9-b*******0042", "createdAt": "2023-10-13T20:00:01.386Z", "updatedAt": "2023-10-13T20:00:01.386Z", "code": "090146", "name": "TRIDENT MICROFINANCE BANK"}
{"id": "4b4b1b13-bfb7-4fb1-b6d2-c29f6ec8fad4", "createdAt": "2023-10-13T20:00:01.388Z", "updatedAt": "2023-10-13T20:00:01.388Z", "code": "090123", "name": "TRUSTBANC J6 MICROFINANCE BANK LIMITED"}
{"id": "fb8fb5ab-ea00-48c5-8b8b-427a07426df0", "createdAt": "2023-10-13T20:00:01.391Z", "updatedAt": "2023-10-13T20:00:01.391Z", "code": "090005", "name": "TRUSTBOND MORTGAGE BANK"}
{"id": "952e3354-03a6-4d07-8ccd-3217f99d0388", "createdAt": "2023-10-13T20:00:01.394Z", "updatedAt": "2023-10-13T20:00:01.394Z", "code": "090276", "name": "TRUSTFUND MICROFINANCE BANK"}
{"id": "371af9eb-f9d8-46d8-b6ba-7525247116b7", "createdAt": "2023-10-13T20:00:01.396Z", "updatedAt": "2023-10-13T20:00:01.396Z", "code": "090327", "name": "TRUST MICROFINANCE BANK"}
{"id": "7c7bd00a-6e52-4f79-8312-e8d2958247bc", "createdAt": "2023-10-13T20:00:01.399Z", "updatedAt": "2023-10-13T20:00:01.399Z", "code": "090315", "name": "U & C MICROFINANCE BANK"}
{"id": "c76699b6-ce62-4932-a3f4-202b6f2aa526", "createdAt": "2023-10-13T20:00:01.401Z", "updatedAt": "2023-10-13T20:00:01.401Z", "code": "090609", "name": "Ummah Microfinance Bank"}
{"id": "943b08a4-9fa8-41ea-b77b-d9bf156586a1", "createdAt": "2023-10-13T20:00:01.403Z", "updatedAt": "2023-10-13T20:00:01.403Z", "code": "090331", "name": "UNAAB MICROFINANCE BANK"}
{"id": "b3607769-413e-4c49-8b9f-e278944bb4ee", "createdAt": "2023-10-13T20:00:01.406Z", "updatedAt": "2023-10-13T20:00:01.406Z", "code": "090266", "name": "UNIBEN MICROFINANCE BANK"}
{"id": "b98cd1a6-f98f-4edd-8c14-21c43344b6dd", "createdAt": "2023-10-13T20:00:01.409Z", "updatedAt": "2023-10-13T20:00:01.409Z", "code": "90193", "name": "UNICAL MICROFINANCE BANK"}
{"id": "34873755-2277-4957-a2be-6850d059bbdf", "createdAt": "2023-10-13T20:00:01.411Z", "updatedAt": "2023-10-13T20:00:01.411Z", "code": "090193", "name": "UNICAL MICROFINANCE BANK"}
{"id": "83996c5a-6dd5-4bf6-9abc-6619d2117828", "createdAt": "2023-10-13T20:00:01.413Z", "updatedAt": "2023-10-13T20:00:01.413Z", "code": "000018", "name": "UNION BANK"}
{"id": "8d7cddb3-ef29-4d20-b093-25d4a7e2be02", "createdAt": "2023-10-13T20:00:01.416Z", "updatedAt": "2023-10-13T20:00:01.416Z", "code": "000004", "name": "UNITED BANK FOR AFRICA"}
{"id": "a9cfd138-15b6-4bd5-a0fd-359349ad71ac", "createdAt": "2023-10-13T20:00:01.418Z", "updatedAt": "2023-10-13T20:00:01.418Z", "code": "000011", "name": "UNITY BANK"}
{"id": "e3b9a3d3-4250-4015-86b9-7a1e5374f2c6", "createdAt": "2023-10-13T20:00:01.420Z", "updatedAt": "2023-10-13T20:00:01.420Z", "code": "090251", "name": "UNIVERSITY OF NIGERIA, NSUKKA MICROFINANCE BANK"}
{"id": "9d41b023-1896-4101-89c0-e1b6fe5244e6", "createdAt": "2023-10-13T20:00:01.422Z", "updatedAt": "2023-10-13T20:00:01.422Z", "code": "110009", "name": "VENTURE GARDEN NIGERIA LIMITED"}
{"id": "4b4414ec-6e69-4aac-bb3a-50f3b7a3cb76", "createdAt": "2023-10-13T20:00:01.425Z", "updatedAt": "2023-10-13T20:00:01.425Z", "code": "090110", "name": "VFD MFB"}
{"id": "b6ca6673-d32f-49c5-8fb0-22787db234fd", "createdAt": "2023-10-13T20:00:01.427Z", "updatedAt": "2023-10-13T20:00:01.427Z", "code": "090150", "name": "VIRTUE MICROFINANCE BANK"}
{"id": "1bcbcc74-53d1-435a-b61f-80c13896504f", "createdAt": "2023-10-13T20:00:01.429Z", "updatedAt": "2023-10-13T20:00:01.429Z", "code": "090139", "name": "VISA MICROFINANCE BANK"}
{"id": "495624af-653e-4f39-a3ca-b396809c1b36", "createdAt": "2023-10-13T20:00:01.431Z", "updatedAt": "2023-10-13T20:00:01.431Z", "code": "100012", "name": "VT NETWORKS"}
{"id": "cf957f86-3aec-4b3c-a83e-81e3c63792fc", "createdAt": "2023-10-13T20:00:01.434Z", "updatedAt": "2023-10-13T20:00:01.434Z", "code": "090590", "name": "WAYA MICROFINANCE BANK LTD"}
{"id": "5aaa4723-bb99-4ccd-a336-44348e91eca2", "createdAt": "2023-10-13T20:00:01.436Z", "updatedAt": "2023-10-13T20:00:01.436Z", "code": "000017", "name": "WEMA BANK"}
{"id": "7d83c227-8984-445e-b6db-a4aff9bca521", "createdAt": "2023-10-13T20:00:01.438Z", "updatedAt": "2023-10-13T20:00:01.438Z", "code": "090120", "name": "WETLAND  MICROFINANCE BANK"}
{"id": "3b45863b-eb34-45c2-a06a-6dfb9de57e01", "createdAt": "2023-10-13T20:00:01.440Z", "updatedAt": "2023-10-13T20:00:01.440Z", "code": "090419", "name": "WinView Bank"}
{"id": "cf678069-9bb3-48d5-9a00-63a6c3fbaa97", "createdAt": "2023-10-13T20:00:01.442Z", "updatedAt": "2023-10-13T20:00:01.442Z", "code": "090124", "name": "XSLNCE MICROFINANCE BANK"}
{"id": "86dbe3e0-dec8-4965-b8e1-f217327eff11", "createdAt": "2023-10-13T20:00:01.444Z", "updatedAt": "2023-10-13T20:00:01.444Z", "code": "090142", "name": "YES MICROFINANCE BANK"}
{"id": "d8a4e882-a11c-4ae8-b971-7903de0b16f3", "createdAt": "2023-10-13T20:00:01.447Z", "updatedAt": "2023-10-13T20:00:01.447Z", "code": "090252", "name": "YOBE MICROFINANCE  BANK"}
{"id": "2a28b78a-f453-44ed-a41e-fe12b09576b6", "createdAt": "2023-10-13T20:00:01.449Z", "updatedAt": "2023-10-13T20:00:01.449Z", "code": "000015", "name": "ZENITH BANK"}
{"id": "4d775500-ba80-4999-a99c-c0b5d251c87e", "createdAt": "2023-10-13T20:00:01.451Z", "updatedAt": "2023-10-13T20:00:01.451Z", "code": "100034", "name": "ZENITH EASY WALLET"}
{"id": "f3ac9f2c-549b-4493-a011-548f25ad0e63", "createdAt": "2023-10-13T20:00:01.453Z", "updatedAt": "2023-10-13T20:00:01.453Z", "code": "100018", "name": "ZENITH MOBILE"}
{"id": "a01a26cd-93a2-4979-a77a-c3296925ffb9", "createdAt": "2023-10-13T20:00:01.456Z", "updatedAt": "2023-10-13T20:00:01.456Z", "code": "100025", "name": "ZINTERNET - KONGAPAY"}
```

</details>
