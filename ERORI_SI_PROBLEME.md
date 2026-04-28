# Raport Erori și Probleme - ValyanClinic CMS

> Generat: 2026-03-28 | Analiză completă: 60+ fișiere

---

## CRITICE (blochează funcționarea)

### 1. Handler `--migrate` lipsă în Program.cs
**Fișier:** `src/ValyanClinic.API/Program.cs` (liniile 189–205)
**Problemă:** `migrate.ps1` apelează `dotnet run -- --migrate`, dar Program.cs gestionează doar `--export-openapi`. Clasa `DatabaseMigrator` există, dar nu este invocată niciodată.
**Rezolvare:** Adaugă bloc `if (args.Contains("--migrate"))` care invocă `DatabaseMigrator.RunAsync()`.

---

### 2. JWT Secret gol în appsettings.json
**Fișier:** `src/ValyanClinic.API/appsettings.json` (linia 7)
**Problemă:** `"Secret": ""` — token signing aruncă excepție la primul request de autentificare.
**Rezolvare:** Setează un secret puternic (min. 32 caractere) în `appsettings.Development.json` sau variabilă de mediu.

---

### 3. Connection string gol în appsettings.json
**Fișier:** `src/ValyanClinic.API/appsettings.json` (linia 3)
**Problemă:** `"DefaultConnection": ""` — `DapperContext` aruncă `InvalidOperationException` la primul acces DB.
**Rezolvare:** Completează connection string-ul cu datele SQL Server locale/producție.

---

### 4. Syncfusion License Key lipsă
**Fișier:** `src/ValyanClinic.API/appsettings.json` (linia 15) + `client/src/main.tsx` (linia 28)
**Problemă:** `"LicenseKey": ""` și `VITE_SYNCFUSION_LICENSE` nedefinit — componentele Syncfusion (grid, calendar) afișează watermark sau nu funcționează.
**Rezolvare:** Adaugă cheia în `appsettings.json` și în fișierul `.env.local` din client.

---

### 5. Content Security Policy blochează totul
**Fișier:** `src/ValyanClinic.API/Program.cs` (linia 218)
**Problemă:** `"default-src 'none'"` blochează toate resursele — CSS, JS, fonturi. UI-ul este complet nefuncțional.
**Rezolvare:** Înlocuiește cu o politică CSP completă care permite sursele necesare aplicației.

---

## ÎNALTĂ SEVERITATE

### 6. Cale de stocare hardcodată Windows
**Fișier:** `src/ValyanClinic.API/appsettings.json` (linia 19)
**Problemă:** `"BasePath": "C:\\ValyanClinicStorage"` — nu funcționează pe Linux/Mac/Docker.
**Rezolvare:** Folosește cale relativă sau variabilă de mediu (`%STORAGE_PATH%`).

---

### 7. Vulnerabilitate XXE în parsarea XML (CNAS)
**Fișier:** `src/ValyanClinic.Infrastructure/Services/CnasNomenclatorService.cs` (liniile 207–211, 279–283)
**Problemă:** `XmlReader.Create()` fără `DtdProcessing = DtdProcessing.Prohibit` — expus la XML bomb / XXE.
**Rezolvare:** Adaugă `DtdProcessing = DtdProcessing.Prohibit` în `XmlReaderSettings`.

---

### 8. URL-uri API hardcodate în frontend
**Fișier:** `client/vite.config.ts` (linia 12)
**Problemă:** `['http://localhost:5008', 'https://localhost:7051']` — nu se poate configura pentru staging/producție.
**Rezolvare:** Citește URL-ul din variabile de mediu Vite (`VITE_API_URL`).

---

### 9. Lipsă seed date admin inițial
**Fișier:** Directorul `Database/Migrations/`
**Problemă:** Migrările creează schema, dar nu există utilizator admin implicit — aplicația nu poate fi accesată după setup fără INSERT manual în baza de date.
**Rezolvare:** Adaugă migrare `0030_SeedAdminUser.sql` cu un user admin implicit.

---

## SEVERITATE MEDIE

### 10. Interceptor Axios nu reface requestul după refresh token
**Fișier:** `client/src/api/axiosInstance.ts` (liniile 33–70)
**Problemă:** Requestul original eșuat cu 401 este pus în coadă, dar nu este refăcut după obținerea noului token. Utilizatorul primește eroare 401 deși tokenul a fost reînnoit.
**Rezolvare:** Reface requestul original cu noul `Authorization` header după refresh reușit.

---

### 11. Rate limiter afectează health check endpoints
**Fișier:** `src/ValyanClinic.API/Program.cs` (liniile 145–155)
**Problemă:** Rate limiter global se aplică și pe `/health/*` — monitorizarea Kubernetes/Docker poate fi blocată.
**Rezolvare:** Exclude `/health/*` din rate limiting cu `EnableRateLimiting(false)` pe health endpoints.

---

### 12. Endpoint logout permite acces anonim
**Fișier:** `src/ValyanClinic.API/Controllers/AuthController.cs` (linia 84)
**Problemă:** `[AllowAnonymous]` pe logout permite oricui să revoce orice token fără autentificare.
**Rezolvare:** Înlocuiește `[AllowAnonymous]` cu `[Authorize]`.

---

### 13. JWT parsing în frontend fără gestionare erori
**Fișier:** `client/src/App.tsx` (liniile 13–22)
**Problemă:** `atob()` și `JSON.parse()` aruncă excepție dacă tokenul stocat este corupt — aplicația nu pornește.
**Rezolvare:** Înfășoară în `try/catch` și curăță localStorage dacă tokenul e invalid.

---

### 14. Stocare BasePath fără validare
**Fișier:** `src/ValyanClinic.Infrastructure/Configuration/StorageOptions.cs` (linia 10)
**Problemă:** `BasePath` implicit string gol — erori silențioase la upload fișiere medicale.
**Rezolvare:** Adaugă validare cu `[Required]` sau excepție explicită la startup dacă BasePath e gol.

---

### 15. Dimensiune maximă request body nesetată
**Fișier:** `src/ValyanClinic.API/Program.cs`
**Problemă:** Nicio limită `MaxRequestBodySize` pe Kestrel — upload-uri mari pot provoca epuizare memorie (DoS).
**Rezolvare:** Setează `options.Limits.MaxRequestBodySize` în configurarea Kestrel.

---

### 16. Mesaje de eroare backend expuse direct utilizatorilor
**Fișier:** `client/src/api/axiosInstance.ts` (liniile 76–80)
**Problemă:** Erori SQL sau stack traces pot ajunge vizibile în UI.
**Rezolvare:** Afișează mesaje generice utilizatorilor; loghează detaliile doar pe server.

---

## DOCUMENTAȚIE LIPSĂ

### 17. Lipsă fișier `appsettings.example.json`
**Problemă:** Dezvoltatorii noi nu știu ce valori trebuie configurate.
**Rezolvare:** Creează `appsettings.Development.example.json` cu toate cheile documentate și valori placeholder.

---

### 18. Lipsă `.env.example` în client
**Problemă:** `VITE_SYNCFUSION_LICENSE` și `VITE_API_URL` nu sunt documentate nicăieri.
**Rezolvare:** Creează `client/.env.example` cu toate variabilele de mediu necesare.

---

### 19. Generator OpenAPI schema rulează doar pe Windows
**Fișier:** `generate-openapi.ps1`
**Problemă:** Schema TypeScript a clientului se generează printr-un script PowerShell Windows-only. Prima compilare pe Linux/Mac eșuează.
**Rezolvare:** Adaugă script alternativ `generate-openapi.sh` sau documentează pasul explicit în README.

---

## ASPECTE POZITIVE (implementate corect)

- Pattern CQRS/MediatR cu separare clară a responsabilităților
- Validare input cu FluentValidation pe toate comenzile
- JWT cu Refresh Token rotation
- BCrypt pentru hashing parole cu work factor configurabil
- Protecție SSRF la validarea URL-urilor CNAS
- Tranzacții per-script în migrări
- Correlation IDs pentru request tracing
- Rate limiting pentru protecție brute-force
- TypeScript strict mode activat
- API Versioning implementat

---

## REZUMAT

| Severitate | Nr. probleme |
|------------|-------------|
| Critice    | 5           |
| Înaltă     | 4           |
| Medie      | 7           |
| Documentație | 3         |
| **Total**  | **19**      |
