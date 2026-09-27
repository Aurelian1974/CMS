# API — Modulul financiar

Toate rutele ValyanClinic sunt sub `/api/v1`, cer JWT și răspund cu `ApiResponse<T>`. Coloana „Acces" = `[HasAccess(modul, nivel)]`.

## Tarife — `Tariffs`

| Metodă | Rută | Acces | Descriere |
|---|---|---|---|
| GET | `/Tariffs?search&categoryId&isActive&page&pageSize&sortBy&sortDir` | tariffs Read | Listă paginată + statistici |
| GET | `/Tariffs/lookups` | tariffs Read | Categorii, regimuri TVA, metode de plată, serii facturi |
| GET | `/Tariffs/{id}` | tariffs Read | Detaliu + istoric prețuri |
| POST | `/Tariffs` | tariffs Write | Serviciu nou cu preț inițial |
| PUT | `/Tariffs/{id}` | tariffs Write | Actualizare (RowVersion) |
| PATCH | `/Tariffs/{id}/active` | tariffs Write | Activare / dezactivare |
| POST | `/Tariffs/{id}/prices` | tariffs Write | Preț nou (versiune) |
| GET | `/Tariffs/vat-rates` | tariffs Read | Regimuri TVA |
| POST / PUT | `/Tariffs/vat-rates[/{id}]` | tariffs Full | Creare / modificare regim TVA |

## Servicii din fișa consultației — `ConsultationServices`

| Metodă | Rută | Acces |
|---|---|---|
| GET | `/ConsultationServices/by-consultation/{consultationId}` | consultations Read |
| POST | `/ConsultationServices` `{ consultationId, medicalServiceId, quantity }` | consultations Write |
| PUT | `/ConsultationServices/{id}` `{ quantity }` | consultations Write |
| DELETE | `/ConsultationServices/{id}` | consultations Write |

## Încasări — `Billing`

| Metodă | Rută | Acces | Descriere |
|---|---|---|---|
| GET | `/Billing/consultations?search&paymentStatus&dateFrom&dateTo&page&pageSize` | payments Read | Listă + statistici |
| GET | `/Billing/consultations/{id}` | payments Read | Linii, plăți, bonuri, facturi, flag-uri CanEditServices / CanCollect / CanInvoice |
| POST | `/Billing/consultations/{id}/services` | payments Write | Linie nouă (recepție) |
| PUT / DELETE | `/Billing/services/{id}` | payments Write | Cantitate / eliminare |
| POST | `/Billing/consultations/{id}/payments` `{ idempotencyKey, tenders[{paymentMethodId, amount}], notes }` | payments Write | 201 creată, 200 duplicat (aceeași cheie) |
| POST | `/Billing/payments/{id}/cancel` `{ reason }` | payments Write | |
| GET | `/Billing/fiscal-receipts/{id}` | payments Read | Detaliu bon (linii cu grupa TVA, plăți cu codul aparatului, evenimente) |
| POST | `/Billing/fiscal-receipts/{id}/start` | payments Write | PENDING/FAILED → PRINTING |
| POST | `/Billing/fiscal-receipts/{id}/result` `{ statusCode: PRINTED\|FAILED\|UNKNOWN, receiptNumber, … }` | payments Write | Rezultatul de la bridge |
| POST | `/Billing/fiscal-receipts/{id}/reconcile` `{ wasPrinted, receiptNumber, note }` | payments Write | UNKNOWN/PRINTING → PRINTED/FAILED |

## Facturi — `Invoices`

| Metodă | Rută | Acces |
|---|---|---|
| GET | `/Invoices?search&statusId&dateFrom&dateTo&page&pageSize&sortBy&sortDir` | invoices Read |
| GET | `/Invoices/{id}` | invoices Read |
| GET | `/Invoices/{id}/pdf` | invoices Read |
| POST | `/Invoices` `{ consultationId, idempotencyKey, seriesId, customer…, includeCnp, lines? }` | invoices Write |
| POST | `/Invoices/{id}/storno` `{ idempotencyKey, reason }` | invoices **Full** |

## Setări financiare — `FinancialSettings`

| Metodă | Rută | Acces |
|---|---|---|
| GET | `/FinancialSettings/fiscal` | payments Read |
| PUT | `/FinancialSettings/fiscal` | invoices Full |
| GET | `/FinancialSettings/invoice-series` | invoices Read |
| POST | `/FinancialSettings/invoice-series` | invoices Full |
| PUT | `/FinancialSettings/invoice-series/{id}` `{ isDefault, isActive }` | invoices Full |

## Coduri de eroare (THROW în SP → 400 / 404 / 409)

| Cod | Semnificație |
|---|---|
| 50600 / 50601 | Consultația nu e finalizată / e blocată pentru servicii |
| 50602 – 50604 | Fără servicii / cantitate invalidă / linie inexistentă |
| 50610 – 50618 | Tarife și regimuri TVA (cod duplicat, preț invalid, concurență, …) |
| 50620 – 50629 | Facturi (există deja, corecție nepermisă, date furnizor incomplete, serie, client, …) |
| 50630 – 50635 | Plăți (depășire rest, deja achitat, bon doar pe toată suma, anulare interzisă, metodă) |
| 50640 – 50645 | Bonuri (tranziție invalidă, mapare lipsă, număr obligatoriu, nerezolvat, emitere dezactivată) |

## Fiscal bridge (local, `http://127.0.0.1:5199`)

Antet obligatoriu (în afară de health): `X-Bridge-Token`.

| Metodă | Rută | Răspuns |
|---|---|---|
| GET | `/api/health` | `{ status, version }` |
| GET | `/api/status` | `{ isConnected, isReady, paperOut, coverOpen, fiscalReceiptOpen, serialNumber, model, problems[] }` |
| POST | `/api/receipts` `{ jobId, lines[{name, unitPrice, quantity, taxGroup}], tenders[{paymentCode, amount}] }` | `{ outcome: Printed\|Failed\|Unknown, receiptNumber, deviceSerialNumber, printedAt, errorMessage, deviceResponse, isReplay }`; 400 = cerere invalidă, 409 = alt conținut pentru același job |
| GET | `/api/receipts/{jobId}` | Intrarea din jurnal; 404 = bridge-ul nu a primit jobul |
| POST | `/api/device/cancel-open-receipt` | `{ cancelled }` |
