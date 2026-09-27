# Modul financiar — Pasul 0: Analiză

> Stare: **analiză, fără cod**. Implementarea începe după confirmarea deciziilor din §6.

---

## 1. Stack și convenții existente (de respectat 1:1)

| Aspect | Ce există | Implicație pentru modulul financiar |
|---|---|---|
| Arhitectură | Clean Architecture + vertical slices MediatR (`Features/{X}/Commands|Queries/{Action}/`) | Slice-uri noi: `Tariffs`, `ConsultationServices`, `Invoices`, `Payments`, `FiscalReceipts` |
| Acces date | Dapper **exclusiv prin SP-uri**, constante în `Infrastructure/Data/StoredProcedures/*Procedures.cs` | Toată logica financiară (numerotare, blocare, idempotență) în SP-uri, în tranzacție |
| Erori business | `THROW 5xxxx` în SP → `SqlException` → `Result<T>` în handler; coduri în `SqlErrorCodes.cs` | Range nou rezervat: **50600–50699** |
| Validare | FluentValidation (BE) + Zod (FE) | Pereche pentru fiecare comandă |
| Migrări | DbUp, 2 faze: `Scripts/Migrations/NNNN_*.sql` (o singură dată) + `Scripts/StoredProcedures/*.sql` (re-rulate). Ultima: `0051_CreatePrescriptions.sql` | Migrări noi de la `0052`. **DbUp e forward-only, nu există scripturi Down în repo** (vezi D20) |
| Numerotare | Precedent: `Prescription_Issue` + `PrescriptionSeriesCounters` cu `UPDLOCK, HOLDLOCK` în tranzacție | Același pattern pentru seriile de facturi → fără goluri, thread-safe |
| Audit | `dbo.AuditLogs` (EntityType, EntityId, Action, OldValues/NewValues JSON, ChangedBy) scris din SP | Scris din SP pentru tarife, documente, plăți, storno, reconciliere bon |
| Auth | JWT (access în memorie) + refresh HttpOnly; `[HasAccess(ModuleCodes.X, AccessLevel.Read/Write/Full)]`; FE `useHasAccess()` + `MODULE` | Modulele `invoices` și `payments` **sunt deja seed-uite** (0011) și definite în `ModuleCodes` / `MODULE` |
| Roluri | `admin`, `doctor`, `nurse`, `receptionist`, `clinic_manager` (0008) + permisiuni per rol/modul + override per user | Drepturile se configurează prin matricea existentă, nu prin roluri hardcodate |
| PDF | QuestPDF (Community), `IPrescriptionPdfGenerator` → `PrescriptionPdfGenerator` | `IInvoicePdfGenerator` după același model |
| Setări | Opțiuni tehnice în `appsettings` + `IOptions<T>`; setări business în BD (`SecuritySettings`, rând unic) | Setări fiscale/serii în BD, editabile din UI |
| UI | React 19 + Syncfusion (via `AppDataGrid`, `Form*`) + Bootstrap + CSS Modules; TanStack Query; RHF + Zod | Pagini noi după pattern-ul ListPage existent |
| Teste | xUnit + NSubstitute (unit), integration tests pe BD reală (connection string gol implicit), Vitest, Playwright | Teste handler/validator + integration pe SP-urile critice (numerotare, idempotență, blocare) |
| Sume | `DECIMAL(10,2)` folosit la Synevo; nicio sumă financiară încă | `DECIMAL(18,2)` pentru sume, `DECIMAL(10,3)` pentru cantitate, C# `decimal` |

## 2. Entități existente relevante

| Entitate | Tabel / cod | Relevant |
|---|---|---|
| Pacient | `Patients` (0014/0016): FirstName, LastName, `Cnp NCHAR(13)`, Address, Email, Phone, RowVersion | Client PF pe factură (snapshot). Fără CUI — PJ se introduce la emitere |
| Consultație | `Consultations` (0031 + extinderi): PatientId, DoctorId, AppointmentId, Date, `StatusId`, fără RowVersion, **fără câmpuri financiare** | Se leagă liniile de servicii, plățile, documentele |
| Medic / Utilizator | `Doctors` (MedicalCode = parafă), `Users` (RoleId, DoctorId / MedicalStaffId) | Operator plată/emitere = `Users.Id` din `ICurrentUser` |
| Clinică (furnizor) | `Clinics`: Name, `FiscalCode` (CUI), `TradeRegisterNumber`, Address/City/County, `BankName`, `BankAccount` (IBAN), LogoPath | Date furnizor pe factură. **Lipsește flag-ul „plătitor TVA”** |
| Tipuri investigații | `InvestigationTypeDefinitions` (0036): Spirometry, DLCO, Oximetry, ECG, SixMWT, Bronchoscopy etc. | Fără preț. Propun legătură opțională serviciu → tip investigație (sugestie automată de linie) |
| Analize Synevo | `Analyses` cu `Price DECIMAL(10,2)` | Prețuri de laborator extern — **nu** se refolosesc ca tarife ale cabinetului |
| Schelete financiare | `Features/Invoices` și `Features/Payments`: foldere **goale**; `InvoiceProcedures.cs`: constante **fără SP-uri**; FE `InvoicesListPage` = placeholder „coming soon”; `features/payments` gol | Se înlocuiesc/completează; nu există schemă de preluat |

Nu există: tabele de tarife, TVA, facturi, plăți, bonuri, serii de facturi, metode de plată.

## 3. Ciclul de viață actual al consultației

Statusuri (`ConsultationStatuses`, `ConsultationStatusIds.cs`):

| Cod | Id | Cine îl setează azi |
|---|---|---|
| `INLUCRU` | `C2000000-…-0001` | Creare consultație |
| `FINALIZATA` | `C2000000-…-0002` | Butonul „Finalizează Consultație” → `PUT /Consultations/{id}` cu `statusId = completed` |
| `BLOCATA` | `C2000000-…-0003` | **Nimeni** — seed-uit, dar nicio acțiune nu îl setează |

Comportament:
- **FE**: `isEditable = !isLocked && !isFinalized` → după finalizare formularul e read-only (rămân „Scrisoare medicală” și „Tipărește”).
- **BE**: `Consultation_Update`, `Consultation_Delete`, upsert anamneză/examen, investigații, analize recomandate, medicație → blochează **doar `BLOCATA`** (`THROW 50021`). `FINALIZATA` **nu** e protejată pe server — prin API se poate modifica sau redeschide.

Concluzie: `BLOCATA` e locul natural pentru „facturat”. Emiterea primului document fiscal setează `BLOCATA` în aceeași tranzacție. SP-urile noi pentru liniile de servicii respectă același guard.

## 4. Model de date propus (schiță pentru validare, nu final)

```
VatRates                 Code, Name, Percent DECIMAL(5,2), UblCategoryCode (S/E/O…),
                         ExemptionReasonCode, ExemptionReasonText, IsActive
ServiceCategories        Code, Name (Consultații / Investigații paraclinice / Proceduri / Alte servicii)
MedicalServices          ClinicId, Code (UQ per clinică), Name, CategoryId, DurationMinutes?,
                         InvestigationTypeCode?, IsActive, audit, RowVersion
MedicalServicePrices     ServiceId, Price DECIMAL(18,2), VatRateId, ValidFrom, ValidTo?  ← versionare
ConsultationServices     ConsultationId, ServiceId + SNAPSHOT: Code, Name, UnitPrice, VatRateId,
                         VatPercent, VatCategoryCode, Quantity DECIMAL(10,3), LineTotal DECIMAL(18,2)
PaymentMethods           NUMERAR / CARD / TRANSFER (nomenclator)
Payments                 ConsultationId, Amount, PaidAt, CreatedBy (operator), IdempotencyKey, IsCancelled
PaymentTenders           PaymentId, PaymentMethodId, Amount        ← plată mixtă numerar + card
InvoiceSeries            ClinicId, Series, LastNumber, IsDefault, IsActive (+ serie storno opțională)
Invoices                 ConsultationId, Series, Number, IssueDate, TypeCode, OriginalInvoiceId?,
                         StatusId, snapshot furnizor, CustomerType (PF/PJ) + snapshot client,
                         TotalNet, TotalVat, Total, Currency 'RON', IdempotencyKey,
                         câmpuri e-Factura rezervate (nefolosite acum)
InvoiceLines             snapshot din ConsultationServices
FiscalReceipts           PaymentId (UQ), ConsultationId, IdempotencyKey, StatusId, ReceiptNumber,
                         PrintedAt, Amount, DeviceSerial, LastError, DeviceResponse
FiscalReceiptLines       snapshot linii
FiscalReceiptEvents      istoric tranziții de stare (cine / când / ce a răspuns aparatul)
FiscalSettings           mapare VatRate → grupă TVA aparat, PaymentMethod → tip plată aparat
Clinics                  + IsVatPayer BIT
```

Reguli de calcul: `LineTotal = ROUND(UnitPrice × Quantity, 2)` (half away from zero, la fel ca aparatul pe fiecare linie); `Total = SUM(LineTotal)`. Aceeași sumă apare pe consultație, factură și bon, fără rotunjiri suplimentare. Statusul de plată (`NEPLATIT` / `PARTIAL` / `PLATIT`) se calculează la citire din `Total` vs `SUM(Payments)`, deci nu poate ajunge desincronizat.

## 5. Bon fiscal — arhitectură și variante de comunicare

### Fiscal bridge (propunere)
- .NET 10 Worker Service instalat ca **Windows Service** pe PC-ul de recepție. Kestrel ascultă **doar pe `127.0.0.1:{port}`**. Autentificare cu token (generat la instalare, stocat cu DPAPI). CORS permis doar pentru originea ValyanClinic.
- Expune `GET /status`, `POST /receipts` (jobId = FiscalReceiptId), `GET /receipts/{jobId}`, `POST /receipts/{jobId}/cancel-open`.
- **Jurnal local persistent** per jobId (pași: started → items → paid → closed + nr. bon). Un retry cu același jobId **nu tipărește din nou**: întoarce rezultatul din jurnal sau pornește reconcilierea. Asta elimină cea mai mare parte din cazurile „necunoscut”.
- `IFiscalPrinter` → `MockFiscalPrinter` (dev, teste, scenarii de eroare simulate) și `DatecsFiscalPrinter` (peste un transport Serial/TCP).

Flux: FE „Încasează” → BE creează `Payment` + `FiscalReceipt(PENDING)` într-o tranzacție (idempotent) → FE trimite jobul la bridge → bridge verifică întâi starea aparatului (hârtie, capac, bon deschis) → tipărește → FE raportează rezultatul la BE. Dacă se pierde răspunsul: `UNKNOWN` → reconciliere (interogare jurnal bridge + ultimul nr. bon din aparat + confirmare utilizator). Niciodată un bon nou automat.

Stări: `PENDING` → `PRINTING` → `PRINTED` | `FAILED` (aparat offline / hârtie / capac: rămâne reluabil **manual**) | `UNKNOWN` → `CONFIRMED_PRINTED` / `CONFIRMED_NOT_PRINTED`.

### Variante de comunicare cu aparatul

| | a) Protocol direct Datecs (cadre binare) | b) FiscalNet (fișiere / comenzi text) |
|---|---|---|
| Cost | Zero licențe | Licență per stație (de verificat) |
| Control / erori | Status sincron la fiecare comandă (hârtie, capac, bon deschis) → tratare precisă a erorilor cerute | Răspuns asincron prin fișier; detaliu de status dependent de FiscalNet |
| Efort | Mare: framing, checksum, secvență, NAK/SYN, diferențe între generații (DP-25/05/150 vs modelele „X”) | Mic: formatul de comenzi e documentat de furnizor |
| Dependențe | Doar driverul USB→COM | Încă o aplicație de instalat, actualizat și monitorizat |
| Risc | Comenzi neverificate până la testul pe aparat real | Comportament la erori mai opac |

**Recomandare:** (a), cu transport abstractizat, **condiționat** de obținerea manualului de programare pentru modelul exact. Dacă FiscalNet e deja instalat și licențiat la cabinet, (b) se livrează mai repede și e o alegere rezonabilă. De verificat și dacă Datecs oferă un driver/SDK oficial pentru modelul respectiv. În cod, orice comandă neverificată pe aparat se marchează `// NEVERIFICAT PE APARAT`.

## 6. Decizii deschise — propunerea mea pentru fiecare

Deja confirmate de tine: **bon la încasare numerar/card, factură la cerere**; **fără CNAS**; **emite recepția**.

| # | Decizie | Propunere |
|---|---|---|
| D1 | Factură emisă după bon | Factura referențiază bonul (nr./dată) și nu generează o a doua încasare. Plata prin transfer (PJ) = factură fără bon. **De validat cu contabilul** |
| D2 | Statut TVA cabinet + regim servicii | Flag nou `Clinics.IsVatPayer`. Seed doar un regim „Scutit fără drept de deducere” (probabil art. 292 Cod fiscal — **de validat cu contabilul**). Celelalte cote se introduc din UI, nu din cod |
| D3 | Preț cu sau fără TVA | Prețul din nomenclator e **preț final** (TVA inclus, dacă există), fiindcă vindem către persoane fizice |
| D4 | Versionare tarife | La modificarea prețului se închide versiunea curentă (`ValidTo`) și se deschide una nouă (`ValidFrom` = data aleasă, implicit azi). Fără suprapuneri, verificat în SP sub lock. Regimul TVA e versionat odată cu prețul |
| D5 | Cine adaugă servicii pe consultație | Medicul (în consultație) și recepția (la încasare), până la primul document fiscal. Adăugare manuală, cu sugestie din investigațiile efectuate |
| D6 | Momentul blocării | Emiterea primului document (bon sau factură) → `BLOCATA`. Emiterea cere consultație `FINALIZATA` și minimum o linie |
| D7 | Plată parțială vs. bon | V1: bonul acoperă întotdeauna **soldul integral** (numerar + card mixt pe același bon). Plățile parțiale se înregistrează pe metode fără bon (transfer). Alternativa „bon de avans cu linie generică” doar dacă o cere contabilul |
| D8 | Storno / corecție | Factură storno în aceeași serie, cantități negative, `OriginalInvoiceId`. Factura de corecție are liniile ei, precompletate și editabile în dialog; consultația rămâne blocată. Storno de bon (retur pe aparat) **în afara V1** |
| D9 | Numerotare | Serii configurabile per clinică; contor incrementat cu `UPDLOCK, HOLDLOCK` în aceeași tranzacție cu insert-ul, deci rollback-ul nu lasă goluri. Fără resetare anuală (configurabilă ulterior) |
| D10 | Idempotență | Cheie generată de client la deschiderea dialogului + `UNIQUE(ClinicId, IdempotencyKey)`. Retry cu aceeași cheie întoarce documentul existent (200). Unicitate business: o singură factură activă (nestornată) per consultație (index filtrat) și un bon per plată (`UNIQUE PaymentId`) |
| D11 | Date client | PF: nume obligatoriu, adresă opțională, CNP **doar la bifare explicită** (GDPR). PJ: CUI, denumire, adresă obligatorii, Reg. Com. opțional. Snapshot pe factură, fără tabel `Customers` în V1 |
| D12 | e-Factura | Model de date compatibil UBL/CIUS-RO (TypeCode 380/381, coduri categorie TVA, motiv scutire, cod județ ISO, unitate de măsură), **fără transmitere**. **De validat cu contabilul** obligațiile curente B2B/B2C |
| D13 | Drepturi | Modul nou `tariffs`. Matricea implicită e în tabelul de mai jos |
| D14 | Acces recepție la consultație | Ecranul de încasare citește doar antetul și liniile de servicii, prin endpoint-uri din modulul `invoices`/`payments`, **fără date clinice** (minimizare GDPR) |
| D15 | Topologie deployment | Presupun: API + BD pe server/PC în LAN, browserul de la recepție apelează bridge-ul pe `localhost`. **Confirmă** dacă serverul e în cloud; atunci aș propune bridge cu conexiune outbound (SignalR) către BE |
| D16 | Configurare fiscală | Pe PC-ul de recepție, în config-ul bridge-ului: model, port COM / IP, baud, cod și parolă operator (secretele nu ajung în BD central). În BD, editabile din UI: mapare TVA → grupă aparat, metodă plată → tip plată aparat, port bridge |
| D17 | Variantă comunicare | (a) protocol direct — vezi §5. Depinde de modelul exact |
| D18 | Migrări reversibile | DbUp rămâne forward-only. Pentru fiecare migrare nouă adaug `Scripts/Rollback/NNNN_Rollback_*.sql` (exclus din DbUp, rulat manual). Migrările sunt doar aditive; singura modificare pe tabele existente = `ADD COLUMN Clinics.IsVatPayer` |
| D19 | UI | (1) Pagina „Tarife” (admin). (2) Tab nou „Servicii & plată” în consultație. (3) Pagina „Încasări” pentru recepție: consultații finalizate neîncasate, încasare, bon, factură, reconciliere. (4) Lista „Facturi” (PDF, storno). (5) Setări: serii + mapări fiscale |

Matricea de drepturi implicită (D13), ajustabilă din pagina de permisiuni existentă:

| Acțiune | Modul / nivel | Admin | Manager | Recepție | Medic | Asistentă |
|---|---|---|---|---|---|---|
| Vizualizare tarife | tariffs Read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modificare tarife | tariffs Write/Full | ✓ | ✓ | – | – | – |
| Servicii pe consultație | consultations Write | ✓ | – | ✓* | ✓ | – |
| Încasare + bon | payments Write | ✓ | ✓ | ✓ | – | – |
| Emitere factură | invoices Write | ✓ | ✓ | ✓ | – | – |
| Storno | invoices Full | ✓ | ✓ | – | – | – |
| Reconciliere bon „necunoscut” | payments Write (auditat) | ✓ | ✓ | ✓ | – | – |

\* doar prin ecranul de încasare (D14)

## 7. Probleme existente descoperite (nu le rezolv fără acord)

1. `FINALIZATA` nu e protejată pe server — doar FE o tratează ca read-only. Nu afectează facturarea, fiindcă blocarea se face prin `BLOCATA`. raspuns: trebuie protejata si pe server
2. `BLOCATA` nu e setată nicăieri azi. Devine starea „facturat”. raspuns: starea blocata ramane si se adauga starea facturat
3. `Consultations` nu are `RowVersion`. Concurența pe emitere se tratează cu `UPDLOCK` în SP. raspuns: fa cum spune la best practices
4. Scheletele `Features/Invoices`, `Features/Payments` și `InvoiceProcedures.cs` sunt goale sau orfane. Le înlocuiesc cu implementarea reală. Raspuns: inlocuieste cu implementarea reala
5. `copilot-instructions.md` §9 descrie tabele `Invoices`/`Payments` care nu există în BD — sunt aspiraționale.

## 8. Plan pe etape (după confirmare, un commit per etapă)

1. **Schema BD**: migrări 0052+ (nomenclatoare, tarife versionate, linii consultație, plăți, facturi, serii, bonuri, setări, permisiuni) + SP-uri + scripturi rollback.
2. **BE tarife + servicii pe consultație** + teste (snapshot preț, total 100 + 50 = 150, blocare).
3. **BE plăți + facturi** (emitere, numerotare, idempotență, PDF QuestPDF, storno) + teste.
4. **UI tarife**.
5. **UI servicii pe consultație + încasări + facturi + setări**.
6. **Integrare fiscală**: `IFiscalPrinter`, Mock, bridge Windows Service, `DatecsFiscalPrinter` (marcat neverificat), mașina de stări + reconciliere în BE/FE + teste pe Mock pentru toate scenariile de eroare.
7. **Finalizare**: E2E, documentație `Documentation/Pages/*`, rezumat mock / de validat.

## 9. Ce am nevoie de la tine înainte de implementare

1. Confirmare sau corecții pe D1–D19.
2. **Modelul exact al casei de marcat** (ex. DP-25, DP-05, DP-150, DP-25X, DP-150X), conexiunea (USB / serial / LAN) și dacă FiscalNet e deja instalat/licențiat.
3. Topologia de deployment (D15).
4. Statutul TVA al cabinetului (plătitor sau nu) — sau confirmarea că îl stabilim cu contabilul și pornim cu regimul „scutit” parametrizabil.
5. Opțional: lista inițială de servicii și prețuri pentru seed-ul de dev.
