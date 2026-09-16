# ValyanClinic

Aplicație de management pentru cabinet medical — pneumologie.

## Tech Stack

- **Backend:** .NET 10, Dapper, SQL Server, MediatR, FluentValidation
- **Frontend:** React 19, TypeScript, Vite, Zustand, TanStack Query, Syncfusion
- **Teste:** xUnit, Respawn, Vitest, Playwright

## Cerințe

- .NET 10 SDK
- SQL Server (Express sau Developer)
- Node.js 22+

## Pornire

1. Clonează repo-ul
2. Configurează secretele locale — `appsettings.json` NU le conține, iar aplicația
   refuză să pornească fără ele:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<server>;Database=ValyanClinic;Trusted_Connection=True;Encrypt=False;MultipleActiveResultSets=True" --project src/ValyanClinic.API
```

```bash
dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 64 | tr -d '
')" --project src/ValyanClinic.API
```

   `Jwt:Secret` trebuie să aibă minimum 32 de bytes (cerință HMAC-SHA256); validarea
   rulează la pornire. În afara mediului de development, folosiți variabile de mediu
   (`ConnectionStrings__DefaultConnection`, `Jwt__Secret`) sau Key Vault.

3. Creează baza de date și rulează migrările: `./migrate.ps1`
4. Backend: `cd src/ValyanClinic.API && dotnet run`
5. Frontend: `cd client && npm install && npm run dev`
6. Deschide `http://localhost:5173`

## Teste

```bash
# Unit tests backend
dotnet test tests/ValyanClinic.Tests

# Integration tests (necesită SQL Server)
dotnet test tests/ValyanClinic.IntegrationTests

# Unit tests frontend
cd client && npm run test:unit

# E2E tests (necesită aplicația pornită)
cd client && npm run test:e2e
```

## API Documentation

În modul Development, Swagger UI este disponibil la `http://localhost:5049/swagger`.

## Contract Testing (Backend ↔ Frontend)

Schema OpenAPI este generată automat din backend și tipurile TypeScript sunt derivate din ea.
Astfel, orice modificare de DTO pe backend este prinsă la compile time pe frontend.

```powershell
# Din rădăcina soluției — după orice modificare de DTO pe backend:
.\generate-openapi.ps1

# Apoi în client/
npm run check:api   # regenerează schema.d.ts + tsc --noEmit
```

Fișierele generate (`openapi/openapi-v1.json` și `client/src/api/generated/schema.d.ts`) sunt commituite
în repo. Dacă uiți să rulezi scriptul după o modificare de DTO, CI-ul (`contract` job) va pica.

## Documentație

Documentația per-pagină (utilizator, admin, developer) se află în
`src/ValyanClinic.Shared/Documentation/Pages/`
