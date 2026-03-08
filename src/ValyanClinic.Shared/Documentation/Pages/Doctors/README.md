# 👨‍⚕️ Pagina Medici - Documentație Completă

## 📋 Cuprins rapid

| Tip utilizator | Fișier | Și descriere |
|---|---|---|
| 👤 Utilizator | [README.USER.md](./README.USER.md) | Ghid utilizator - cum adaug, caut, editez, șterg medici |
| 🛡️ Administrator | [README.ADMIN.md](./README.ADMIN.md) | Ghid administrator - configurare, monitoring, backup |
| 👨‍💻 Developer | [README.DEVELOPER.md](./README.DEVELOPER.md) | Ghid developer - arhitectură, implementare, testing |
| 🔌 API | [API-ENDPOINTS.md](./API-ENDPOINTS.md) | Referință API completă cu exemple |
| ❓ FAQ | [FAQ.md](./FAQ.md) | 26 întrebări și răspunsuri frecvente |
| 🔧 Troubleshooting | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Diagnostic cu pași și soluții |
| 📝 Changelog | [CHANGELOG.md](./CHANGELOG.md) | Versioning, planificare, upgrade |

---

## 🚀 Start rapid

### Utilizator?
1. Deschide [README.USER.md](./README.USER.md)
2. Caută secțiunea cu acțiunea dorită
3. Urmărește pașii cu imagini

### Admin?
1. Deschide [README.ADMIN.md](./README.ADMIN.md)
2. Check secțiunile "Permisiuni", "Monitoring", "Configurare"
3. Consultă GDPR & Securitate

### Developer?
1. Deschide [README.DEVELOPER.md](./README.DEVELOPER.md)
2. Check "Structura fișierelor" și "Arhitectură"
3. Consultă "Implementare", "Testing", "Roadmap"

---

## 📊 Informații pagina Doctors

### Ce faci pe pagina asta?

| Acțiune | Descriere |
|---------|-----------|
| ➕ **Adaug medic** | Formular cu validare, cascading dropdowns |
| 🔍 **Caut medic** | După nume, CNP, email, cod medical |
| 📋 **Filtrez** | După specialitate, departament, status activ |
| ✏️ **Editez date** | Formă pre-populată cu validare |
| 👁️ **Vizualizez detalii** | Modal read-only cu historic |
| 🗑️ **Șterg medic** | Soft/hard delete cu constrain-uri |
| 📊 **Exporter Excel** | Export customizabil cu coloane |
| 📞 **Statistici** | Total, activi, per specialitate |

### Structura directory-ului documentației

```
Documentation/Pages/Doctors/
├── README.md                      ← Ești aici
├── README.USER.md                 ← Ghid utilizator
├── README.ADMIN.md                ← Ghid administrator
├── README.DEVELOPER.md            ← Ghid developer
├── API-ENDPOINTS.md               ← Referință API
├── FAQ.md                         ← Întrebări frecvente
├── TROUBLESHOOTING.md             ← Diagnostic și soluții
└── CHANGELOG.md                   ← Versioning și planificare
```

---

## 🎯 Pasi folosire după rol

### 1️⃣ Pentru Utilizatori
```
1. Intri pe pagina /doctors
2. Vezz lista medicilor clinicii tale
3. Cauta după nume sau specialitate
4. Click "➕ Adaug" pentru nou medic
5. Completeaza formular + "Salvează"
6. Editeaza / Sterge după nevoe
```

### 2️⃣ Pentru Administratori
```
1. Merge la Admin Panel > Permisiuni
2. Setează role > modul "Doctors" cu Level 3-4
3. Monitoreaza pagina în Real-time
4. Check Audit trail pentru schimbări
5. Backup periodic database
```

### 3️⃣ Pentru Developeri
```
1. Clone repository ( git clone ... )
2. Setup VS Code + terminal PowerShell
3. Read README.DEVELOPER.md > "Structura"
4. Instalează dependencies (npm install)
5. Start dev server (npm run dev)
6. Acceseaza http://localhost:5173/doctors
7. Check browser console (F12) pentru erori
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

### Cautam răspuns la:

<details>
<summary><b>❌ Pagina nu încarcă</b></summary>

Mergă la [TROUBLESHOOTING.md → 1. Pagina nu se încarcă](./TROUBLESHOOTING.md#1-pagina-nu-se-încarcă)
</details>

<details>
<summary><b>❓ Cum adaug medic nou?</b></summary>

Mergă la [README.USER.md → Adăugare medic](./README.USER.md#-adăugare-medic-nou)
</details>

<details>
<summary><b>🔌 Care sunt endpoint-urile API?</b></summary>

Mergă la [API-ENDPOINTS.md](./API-ENDPOINTS.md)
</details>

<details>
<summary><b>🐛 Ce să fac dacă formul nu submit-a?</b></summary>

Mergă la [TROUBLESHOOTING.md → 4. Error la creare/editare](./TROUBLESHOOTING.md#4-error-la-creare-sau-editare)
</details>

<details>
<summary><b>🧑‍💻 Cum functionează cascading dropdowns?</b></summary>

Mergă la [README.DEVELOPER.md → Frontend Implementation](./README.DEVELOPER.md#frontend-implementation)
</details>

<details>
<summary><b>📊 Care sunt permisiuni-urile necesare?</b></summary>

Mergă la [README.ADMIN.md → Configurare Permisiuni](./README.ADMIN.md#configurare-permisiuni)
</details>

<details>
<summary><b>❓ FAQ generice</b></summary>

Mergă la [FAQ.md](./FAQ.md) pentru 26 Q&A
</details>

---

## 🏗️ Arhitectură - Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React + TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│  DoctorsListPage                                            │
│  ├── Syncfusion Grid (server-side pagination)              │
│  ├── DoctorFormModal (create/edit)                         │
│  ├── useDoctors hook (TanStack Query)                      │
│  ├── FormInput, FormSelect, FormDatePicker                 │
│  └── Validație cu Zod                                      │
├─────────────────────────────────────────────────────────────┤
│                 Axios Instance (JWT + interceptors)         │
├─────────────────────────────────────────────────────────────┤
│  API Layer: /api/doctors (6 endpoints)                      │
├─────────────────────────────────────────────────────────────┤
│              Server (ASP.NET Core + C#)                     │
├─────────────────────────────────────────────────────────────┤
│  DoctorsController (REST endpoints)                         │
│  ├── GetDoctors (list paginat cu filtre)                   │
│  ├── GetDoctorById (detalii)                               │
│  ├── GetLookup (dropdown list)                             │
│  ├── CreateDoctor (validare + email duplicate check)       │
│  ├── UpdateDoctor (cu clinic isolation)                    │
│  └── DeleteDoctor (soft delete)                            │
├─────────────────────────────────────────────────────────────┤
│  CQRS Handlers (MediatR)                                    │
│  ├── CreateDoctorCommandHandler                            │
│  ├── UpdateDoctorCommandHandler                            │
│  ├── DeleteDoctorCommandHandler                            │
│  ├── GetDoctorsQueryHandler                                │
│  └── GetDoctorByIdQueryHandler                             │
├─────────────────────────────────────────────────────────────┤
│  Repository + Specifications                                │
│  └── IDoctorRepository (advanced filtering)                │
├─────────────────────────────────────────────────────────────┤
│  Entity Framework Core (SQL Server)                         │
├─────────────────────────────────────────────────────────────┤
│  Baza date: Doctors tabel cu relații                        │
│  ├── Clinic (multi-tenant isolation)                        │
│  ├── Department, Specialties, MedicalTitles               │
│  └── Soft delete flag (isDeleted)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Permisiuni minime

| Rol | Module | Level | Acces |
|-----|--------|-------|-------|
| Receptionist | Doctors | 2 | Create, Edit |
| Doctor | Doctors | 3 | + Delete |
| Admin | Doctors | 4 | All + Config |

---

## 🎓 Concept key

### Cascading Dropdowns  
Specialitate (nivel 1) → Subspecialitate (nivel 2)
Selectează specialitate → automata fill subspecialități
```
Cardiologie (spec)
  ├─ Interventional
  └─ Non-invasive

Neurologie (spec)
  ├─ Adult
  └─ Pediatric
```

### Supervisor Doctor
Relație recursivă - doctor poate fi supervised de alt doctor
```
Dr. Ion (department head)
  ├─ Dr. Andrei (supervised by Ion)
  │   ├─ Dr. Mircea (supervised by Andrei)
  │   └─ Dr. Alina (supervised by Andrei)
  └─ Dr. Elena (supervised by Ion)
```

### Licență Medical (CMR)
- **Licență** = aviz de lucru din Colegiul Medicilor Români
- **Număr** = identificator unic
- **Expiry** = data expirare
- **Validare** = alert dacă scade sub 60 zile

### Soft Delete
Doctor nu se șterge din DB
Se marchează `isDeleted = true`
Stay în logs pentru audit trail
Hard delete doar dacă no consultații/prescripții

---

## 💬 Support & Feedback

| Canal | Adresă |
|-------|--------|
| 📧 Documentație | docs@valyan-clinic.local |
| 🐙 Bugs | GitHub Issues `#doctors-page` |
| 💬 Feedback | feedback@valyan-clinic.ro |
| 💬 Slack | #documentation channel |

---

## 📚 Resurse externe

- [React Hooks](https://react.dev/reference/react)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev)
- [Syncfusion Grid](https://www.syncfusion.com/react-components/react-grid)
- [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/)
- [MediatR Pattern](https://github.com/jbogard/MediatR)

---

**© 2025 ValyanClinic. Documentație interioară - confidențial.**

*Ultima actualizare: 2025-03-08*  
*Versiune: 1.0.0*
