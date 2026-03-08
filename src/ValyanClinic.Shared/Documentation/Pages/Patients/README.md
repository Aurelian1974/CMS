# 📚 Documentația Paginii Pacienți - ValyanClinic

## 📖 Ghiduri disponibile

Pagina de gestionare a pacienților este documentată pentru **trei tipuri de utilizatori**:

### 👤 [README.USER.md](README.USER.md) - **Ghid Utilizator**
*Pentru doctori, asistente medicale și recepționiste*

Cuprinde:
- 📋 Cum să adaugi un pacient nou
- 🔍 Căutare și filtrare
- ✏️ Editare date pacient
- 🗑️ Ștergere pacient
- 📊 Vizualizare detalii și istoric
- 📤 Export Excel
- 🆘 Troubleshooting

**Timp de citire:** ~8-12 min

---

### 🛡️ [README.ADMIN.md](README.ADMIN.md) - **Ghid Administrator**
*Pentru administratori IT și manageri clinici*

Cuprinde:
- 🔧 Configurare accese (permisiuni per rol)
- 📊 Monitoring și statistici
- 🔍 Audit trail (cine a modificat ce și când)
- 🗑️ Backup și disaster recovery
- ⚡ Optimizare performanță
- 📋 Checklist administrativ

**Timp de citire:** ~12-15 min

---

### 👨‍💻 [README.DEVELOPER.md](README.DEVELOPER.md) - **Ghid Developer**
*Pentru ingineri software și arhitecți*

Cuprinde:
- 📁 Structura fișierelor
- 🔧 Tech stack (React, TypeScript, Zod, Syncfusion)
- 📊 Flow management date
- 💡 Implementare frontend (hooks, components, state)
- 🔐 Implementare backend (C#, MediatR, Repository pattern)
- 🧪 Testing strategies
- 🚀 Features viitoare

**Timp de citire:** ~25-35 min

---

## 🎯 Quick Start

**Sunt doctor și trebuie să adaug un pacient nou?**  
→ Deschide [README.USER.md](README.USER.md#-cum-să-adaugi-un-pacient-nou)

**Sunt receptionist și trebuie să caut un pacient?**  
→ Deschide [README.USER.md](README.USER.md#-căutare-și-filtrare)

**Sunt administrator și trebuie să configurez accesele?**  
→ Deschide [README.ADMIN.md](README.ADMIN.md#-configurare-permisiuni)

**Sunt developer și trebuie să modific codul?**  
→ Deschide [README.DEVELOPER.md](README.DEVELOPER.md)

---

## 📊 Informații generale

| Aspect | Detalii |
|--------|---------|
| **URL** | `/patients` |
| **Roluri cu acces** | Admin, Doctor, Receptionist, Clinic Manager |
| **Acțiuni disponibile** | Create, Read, Update, Delete, Export |
| **Filtre** | Nume, Gen, Gr. sanguină, Medic, Alergii, Status |
| **Paginare** | Server-side (20 rânduri/pagină default) |
| **Sortare** | După: Nume, CNP, Vârstă, Status, Data înregistrării |
| **Export** | Excel (XLSX cu date complete) |
| **Statistici** | Total pacienți, Activi, Cu alergii |
| **Validare** | Schema Zod (frontend) + FluentValidation (backend) |

---

## 🔍 Funcionalități principale

✅ **Listare paginată** - Server-side cu filtrare
✅ **Creare pacient** - Modal form cu validări
✅ **Editare** - Modificare date și alergii  
✅ **Ștergere** - Soft delete cu confirmare
✅ **Căutare** - Full-text search pe nume, CNP, email
✅ **Filtrare avansată** - Gen, grupă sanguină, medic, alergii, status
✅ **Detalii pacient** - Modal read-only cu info medicale complete
✅ **Export** - Excel cu date pacient și alergii
✅ **Statistici** - Dashboard cu numere și grafice
✅ **Audit** - Log complet de modificări

---

## 📁 Structura fișierelor

### Frontend

```
client/src/features/patients/
├── pages/
│   ├── PatientsListPage.tsx        # Pagina principală
│   ├── PatientsListPage.module.scss # Stiluri
│   ├── PatientFormPage.tsx         # Placeholder (redirect)
│   └── PatientDetailPage.tsx       # Detalii pacient
├── components/
│   ├── PatientFormModal/           # Modal creare/editare
│   ├── PatientDetailModal/         # Modal read-only
│   └── AddressAutocomplete/        # Autocomplete adresă
├── hooks/
│   └── usePatients.ts              # Query + mutations
├── schemas/
│   └── patient.schema.ts           # Zod validare
├── types/
│   └── patient.types.ts            # TypeScript types
└── index.ts                        # Export public
```

### Backend

```
src/ValyanClinic.Application/Features/Patients/
├── Queries/
│   └── GetPatients/
│       ├── GetPatientsQuery.cs
│       └── GetPatientsQueryHandler.cs
├── Commands/
│   ├── CreatePatient/
│   ├── UpdatePatient/
│   └── DeletePatient/
├── DTOs/
│   ├── PatientListDto.cs
│   ├── PatientDetailDto.cs
│   └── PatientStatsDto.cs
└── Interfaces/
    └── IPatientRepository.cs

src/ValyanClinic.API/Controllers/
└── PatientsController.cs
```

---

## 🔐 Permisiuni

| Acțiune | Read | Write | Delete | Export |
|---------|------|-------|--------|--------|
| **View lista** | ✓ | - | - | - |
| **View detalii** | ✓ | - | - | - |
| **Creare** | ✓ | ✓ | - | - |
| **Editare** | ✓ | ✓ | - | - |
| **Ștergere** | ✓ | - | ✓ | - |
| **Export** | ✓ | - | - | ✓ |

**Rol default per acțiune:**
- Doctor: Read + Write + Delete
- Receptionist: Read + Write
- Nurse: Read
- Admin: Read + Write + Delete + Export

---

## 🔄 Flow-uri principale

### Adăugare pacient nou

```
User click "Pacient nou"
    ↓
Modal formular se deschide
    ↓
User completează: Nume, CNP, Date contact, Gen, Alergii, etc.
    ↓
Validare client-side (Zod): Email format, CNP valid, etc.
    ↓
User click "Salvează"
    ↓
Frontend → Backend: POST /api/patients
    ↓
Backend: Validare server-side + Insert în DB
    ↓
Response: Success → Refresh lista
    ↓
Toast mesaj: "Pacient adăugat cu succes"
```

### Căutare și filtrare

```
User scrie în search box
    ↓
Debounce 500ms
    ↓
API call: GET /api/patients?search=...&page=1
    ↓
Server filtrează + pagină
    ↓
Rezultate se afișează în tabel
    ↓
User vede: Pacient + Gen + Grup sanguină + Alergii + Medic
```

### Editare pacient

```
User click buton edit pe rând
    ↓
Modal se deschide cu date curente
    ↓
User修改 campuri
    ↓
Click "Salvează modificări"
    ↓
Frontend → Backend: PUT /api/patients/{id}
    ↓
Backend: Validare + Update
    ↓
Response: Success → Refresh rând din tabel
```

---

## 📊 Date și modele

### PatientDto (Response list)

```typescript
interface PatientDto {
  id: string;
  fullName: string;
  cnp: string;                    // Cod numeric personal
  age: number;                    // Calculat din birthDate
  genderName: string;             // M / F
  bloodTypeName: string;          // O+, A-, etc.
  allergyCount: number;           // Num alergii
  allergyMaxSeverity: string;     // Critical / High / Medium / Low
  primaryDoctorName: string;      // Medic primar
  phoneNumber: string;
  email?: string;
  isInsured: boolean;
  insuranceExpiry?: date;
  isActive: boolean;
  createdAt: datetime;
}
```

### PatientFormData (Create/Update)

```typescript
interface PatientFormData {
  fullName: string;
  cnp: string;                    // Validare format: ^[0-9]{13}$
  birthDate: Date;
  genderId: Guid;
  bloodTypeId: Guid;
  phoneNumber: string;
  secondaryPhone?: string;
  email?: string;
  // Adresă
  address: string;
  city: string;
  county: string;                 // Județ
  postalCode?: string;
  // Asigurare
  isInsured: boolean;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  // Medici
  primaryDoctorId: Guid;
  // Sănătate
  chronicDiseases?: string;
  allergies: Array<{
    allergyTypeId: Guid;
    allergySeverityId: Guid;
    allergenName: string;
  }>;
  notes?: string;
  isActive: boolean;
}
```

---

## 📈 Statistici disponibile

```typescript
interface PatientStatsDto {
  totalPatients: number;          // Total
  activePatients: number;         // Activi
  patientsWithAllergies: number;  // Cu alergii
  lastAddedCount: number;         // Adăugați ultima săptămână
  mostCommonBloodType: string;
  genderDistribution: {
    male: number;
    female: number;
  };
}
```

---

## 📞 Suport și contact

### Pentru utilizatori
📧 **support@valyan-clinic.ro**  
📞 +40 (XXX) XXX-XXXX  
⏰ Luni-Vineri 09:00-17:00

### Pentru administratori
📧 **admin-support@valyan-clinic.local**  
📞 +40 (XXX) XXX-XXXX  
⏰ 24/7 on-call

### Pentru developeri
📧 **tech-team@valyan-clinic.local**  
🐙 GitHub Issues: `/ValyanClinic/issues`

---

## 🚀 Roadmap

**v1.1 (Q2 2025):**
- ☐ Sincronizare pacient cu CNAS
- ☐ Document manager (imagini medicale)
- ☐ Genetic history tracking

**v1.2 (Q3 2025):**
- ☐ AI-powered duplicate detection
- ☐ GDPR data export
- ☐ Multi-language form

---

**© 2025 ValyanClinic. Documentație internă.**
