# 🏥 Pagina Personal Medical - Dokumentacija Completa

## 📋 Cuprins rapid

| Tip utilizator | Fișier | Descriere |
|---|---|---|
| 👤 Utilizator | [README.USER.md](./README.USER.md) | Ghid utilizator - cum adaug, caut, editez, șterg staff |
| 🛡️ Administrator | [README.ADMIN.md](./README.ADMIN.md) | Ghid administrator - configurare, monitoring, backup |
| 👨‍💻 Developer | [README.DEVELOPER.md](./README.DEVELOPER.md) | Ghid developer - arhitectură, implementare, testing |
| 🔌 API | [API-ENDPOINTS.md](./API-ENDPOINTS.md) | Referință API completă cu exemple |
| ❓ FAQ | [FAQ.md](./FAQ.md) | 50 întrebări și răspunsuri frecvente |
| 🔧 Troubleshooting | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Diagnostic cu pași și soluții |
| 📝 Changelog | [CHANGELOG.md](./CHANGELOG.md) | Versioning, planificare, upgrade |

---

## 🚀 Start rapid

### Utilizator?
1. Deschide [README.USER.md](./README.USER.md)
2. Caută secțiunea cu acțiunea dorită (adaug, edita, șterge)
3. Urmărește pașii cu exemple

### Admin?
1. Deschide [README.ADMIN.md](./README.ADMIN.md)
2. Check "Permisiuni", "Monitoring", "Configurare"
3. Consultă GDPR & Backup/Recovery

### Developer?
1. Deschide [README.DEVELOPER.md](./README.DEVELOPER.md)
2. Check "Structura fișierelor" și "Arhitectură"
3. Consultă "Implementare", "Testing", "Roadmap"

---

## 📊 Informații pagina Medical Staff

### Ce faci pe pagina asta?

| Acțiune | Descriere |
|---------|-----------|
| ➕ **Adaug staff** | Formular cu validare, dropdowns |
| 🔍 **Caut staff** | După nume, CNP, email, titlu |
| 📋 **Filtrez** | După departament, titlu, status |
| ✏️ **Editez date** | Formă pre-populată |
| 👁️ **Vizualizez detalii** | Modal read-only cu audit log |
| 🗑️ **Șterg staff** | Soft/hard delete cu constrain |
| 📊 **Exporter Excel** | Export customizabil cu coloane |
| 📈 **Statistici** | Total, activi, per departament |

### Cine e "personal medical"?

```
Staff medical NON-DOCTOR:
  - Asistenți medicali
  - Infirmieri / Infirmiere
  - Moașe
  - Flebotomisti
  - Laboranți
  - Tehnicheni medical
  - Specialiști auxiliari
```

---

## 🎯 Pasi folosire după rol

### 1️⃣ Pentru Utilizatori
```
1. Intri pe pagina /medicalStaff
2. Vezz lista staff clinic
3. Cauta după nume, email, titlu
4. Click "➕ Adaug" pentru nou staff
5. Completeaza formular + "Salvează"
6. Editeaza / Sterge după nevoe
```

### 2️⃣ Pentru Administratori
```
1. Merge la Admin Panel > Permisiuni
2. Setează role > modul "MedicalStaff" Level 3-4
3. Monitoreaza real-time dashboard
4. Check Audit trail pentru schimbări
5. Backup periodic database
```

### 3️⃣ Pentru Developeri
```
1. Clone repository
2. Setup VS Code + PowerShell terminal
3. Read README.DEVELOPER.md > "Structura"
4. npm install (frontend dependencies)
5. npm run dev → localhost:5173/medicalStaff
6. Check console (F12) pentru debug info
```

---

## 📱 Statistici pagina

| Metric | Valoare |
|--------|---------|
| **Pagini documentație** | 8 fișiere |
| **Cuvinte totale** | ~45,000 |
| **Secțiuni** | 70+ |
| **Exemple cod** | 20+ |
| **Diagrame** | 4+ |
| **Endpoints API** | 6 |
| **Tabele date** | 15+ |

---

## 🔗 Navigare directă

<details>
<summary><b>❌ Pagina nu încarcă</b></summary>

Mergă la [TROUBLESHOOTING.md → 1. Pagina nu se încarcă](./TROUBLESHOOTING.md#1-pagina-nu-se-încarcă)
</details>

<details>
<summary><b>❓ Cum adaug staff nou?</b></summary>

Mergă la [README.USER.md → Adăugare staff](./README.USER.md#-adăugare-staff-medical-nou)
</details>

<details>
<summary><b>🔌 Care sunt endpoint-urile API?</b></summary>

Mergă la [API-ENDPOINTS.md](./API-ENDPOINTS.md)
</details>

<details>
<summary><b>🐛 De ce formul nu submit-a?</b></summary>

Mergă la [TROUBLESHOOTING.md → 4. Error la creare/editare](./TROUBLESHOOTING.md#4-error-la-creare-sau-editare)
</details>

<details>
<summary><b>🧑‍💻 Cum merge Dapper repository?</b></summary>

Mergă la [README.DEVELOPER.md → Backend Implementation](./README.DEVELOPER.md#backend-implementation)
</details>

<details>
<summary><b>📊 Care sunt permisiuni necesare?</b></summary>

Mergă la [README.ADMIN.md → Configurare Permisiuni](./README.ADMIN.md#configurare-permisiuni)
</details>

<details>
<summary><b>❓ FAQ generice</b></summary>

Mergă la [FAQ.md](./FAQ.md) pentru 50 Q&A
</details>

---

## 🏗️ Arhitectură - Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Client (React + TypeScript)                 │
├─────────────────────────────────────────────────────────────┤
│  MedicalStaffListPage                                       │
│  ├── Syncfusion Grid (server-side pagination)              │
│  ├── MedicalStaffFormModal (create/edit)                   │
│  ├── useMedicalStaffList hook (TanStack Query)             │
│  ├── FormInput, FormSelect, FormPhoneInput                 │
│  └── Validație cu Zod                                      │
├─────────────────────────────────────────────────────────────┤
│              Axios Instance (JWT + interceptors)            │
├─────────────────────────────────────────────────────────────┤
│  API Layer: /api/medicalStaff (6 endpoints)                │
├─────────────────────────────────────────────────────────────┤
│           Server (ASP.NET Core + C#)                        │
├─────────────────────────────────────────────────────────────┤
│  MedicalStaffController (REST endpoints)                    │
│  ├── GetAll (list paginat cu filtre)                       │
│  ├── GetById (detalii)                                      │
│  ├── GetLookup (dropdown list)                             │
│  ├── Create (validare + email duplicate)                   │
│  ├── Update (cu clinic isolation)                          │
│  └── Delete (soft delete)                                  │
├─────────────────────────────────────────────────────────────┤
│  CQRS Handlers (MediatR)                                    │
│  ├── CreateMedicalStaffCommandHandler                       │
│  ├── UpdateMedicalStaffCommandHandler                       │
│  ├── DeleteMedicalStaffCommandHandler                       │
│  ├── GetMedicalStaffListQueryHandler                        │
│  └── GetMedicalStaffByIdQueryHandler                        │
├─────────────────────────────────────────────────────────────┤
│  IMedicalStaffRepository (Dapper-based)                     │
│  ├── GetPagedAsync (stored procedures)                      │
│  ├── CreateAsync                                            │
│  ├── UpdateAsync                                            │
│  └── DeleteAsync                                            │
├─────────────────────────────────────────────────────────────┤
│  Stored Procedures (T-SQL)                                  │
│  └── sp_MedicalStaff_GetPaged, Create, Update, Delete      │
├─────────────────────────────────────────────────────────────┤
│  SQL Server Database                                        │
│  └── MedicalStaffMember table + indexes                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Permisiuni minime

| Rol | Module | Level | Acces |
|-----|--------|-------|-------|
| Receptionist | MedicalStaff | 2 | Create, Edit |
| Doctor | MedicalStaff | 3 | + Delete |
| Admin | MedicalStaff | 4 | All + Config |

---

## 🎓 Concepte key

### Soft Delete Strategy
Staff nu se șterge din DB
Se marchează `isDeleted = true`
Stay în logs pentru audit trail
Hard delete doar dacă no consultații/pacienți

### Multi-tenant Isolation
Fiecare staff = tied la ClinicId
Staff din Clinica A NU visible în Clinica B
User vede nur staff din clinica sa

### Supervisor Doctor
Relație: staff → doctor supervizor
Optional (null permis)
Ajută tracking responsibility

### Medical Titles
Non-doctor titles: Asistent, Infirmier, etc.
Auto-filtrate în form (relevante nur non-doctors)

---

## 💬 Support & Feedback

| Canal | Adresă |
|-------|--------|
| 📧 Documentație | docs@valyan-clinic.local |
| 🐙 Bugs | GitHub Issues `#medical-staff-page` |
| 💬 Feedback | feedback@valyan-clinic.ro |
| 💬 Slack | #documentation channel |

---

## 📚 Resurse externe

- [React Hooks](https://react.dev/reference/react)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev)
- [Syncfusion Grid](https://www.syncfusion.com/react-components/react-grid)
- [Dapper ORM](https://github.com/DapperLib/Dapper)
- [MediatR Pattern](https://github.com/jbogard/MediatR)
- [T-SQL Stored Procedures](https://learn.microsoft.com/en-us/sql/relational-databases/stored-procedures/stored-procedures-database-engine)

---

**© 2025 ValyanClinic. Dokumentație interioară - confidențial.**

*Ultima actualizare: 2025-03-08*  
*Versiune: 1.0.0*
