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
2. Creează baza de date și rulează migrările din `src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/` (în ordine numerică)
3. Configurează connection string în `appsettings.json` sau user-secrets
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

## Documentație

Documentația per-pagină (utilizator, admin, developer) se află în
`src/ValyanClinic.Shared/Documentation/Pages/`
