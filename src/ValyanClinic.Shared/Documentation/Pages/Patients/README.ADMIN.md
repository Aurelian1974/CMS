# 🛡️ Ghid Administrator - Pagina Pacienți

## Prezentare generală

Pagina de pacienți este o componentă core care gestionează baza de date cu fișele medicale. Administratorii trebuie să configureze accesul, monitorizeze integritatea datelor și asigure complianța GDPR.

---

## 🔧 Configurare accese (Permisiuni)

### Setări permisiuni per rol

```
Admin Panel > Permissions > Module: Patients
```

**Nivele de acces:**

| Nivel | Descriere | Capacitate |
|-------|-----------|-----------|
| **0 - No Access** | ❌ Nici citire | Fără acces |
| **1 - Read** | 👁️ Doar vizualizare | View list, details |
| **2 - Write** | ✏️ Create + Edit | Create, Edit, Add allergies |
| **3 - Delete** | 🗑️ Full access | Create, Edit, Delete |
| **4 - Admin** | 👑 Control total | +Export, Audit, Config |

### Configurare per rol

#### Doctor
```
Patients module: Level 3 (Delete)
  → Citire + Creare + Editare + Ștergere propriilor pacienți
```

#### Receptionist
```
Patients module: Level 2 (Write)
  → Citire + Creare (fără ștergere)
  → Creează sesiuni următoare (nu editează medicale)
```

#### Nurse (Infirmieră)
```
Patients module: Level 1 (Read)
  → Doar vizualizare
  → Nu poate crea/modifica
```

#### Clinic Manager
```
Patients module: Level 4 (Admin)
  → Acces total
  → Export + Statistici
  → Gestiune copii de backup
```

---

## 📊 Monitoring și statistici

### Dashboard Admin

```
Admin Panel > Patients > Statistics
```

**Metrici importante:**

| Metrica | Normalitate | Alertă |
|---------|------------|--------|
| **Total pacienți** | Stabil pe luni | ↓ Scădere > 10% |
| **Activi** | ~90-95% din total | < 80% |
| **Cu alergii** | ~25-35% | > 50% (check data quality) |
| **Înregistrați astazi** | 5-20 | > 100 (check spam) |
| **Duplicați potențiali** | 0 | > 5 (run dedup job) |

### Log audit

```
Admin Panel > Audit > Patients
```

**Înregistrează:**
- ✓ Cine a creat/editat pacient
- ✓ Ce s-a modificat (field delta)
- ✓ Timestamp exact
- ✓ IP address utilizator

**Exemplu log:**
```
[2025-03-08 14:32:15] User: Dr. Ion Popescu (ion@clinic.ro)
Action: CREATE
Patient: "Mariana Vasilescu" (CNP: 2850315...)
IP: 192.168.1.100

[2025-03-08 15:45:22] User: Receptionist Maria (maria@clinic.ro)
Action: UPDATE
Patient: "Mariana Vasilescu"
Changes:
  - phoneNumber: "0721..." → "0722..."
  - email: null → "mariana.v@email.com"
IP: 192.168.1.102
```

---

## 🔍 Data Quality Checks

### Duplicate detection

```
Admin Panel > Tools > Find Duplicates
```

**Algoritm:**
- Egal: CNP (100% match)
- Probabil: Nume similar + dată naștere
- Posibil: Aceeași adresă + telefon

**Rezultat:**
```
Found 3 potential duplicates:
1. "Ion Popescu" + "Ioan Popescu" (97% similar)
2. "Maria Vasilescu" + "Mary Vasilescu" (94% similar)
3. "Vasile Ionescu" + "Vasile Ionescu II" (Same CNP!)
```

**Acțiuni:**
- Merge: Combinează 2 pacienți (datele se unesc)
- Mark as Different: Confirmă că sunt persoane diferite
- Manual Review: Examină și decide

### Data integrity checks

```
Nightly job (00:00): /api/patients/validate
```

**Validări:**

```
✓ CNP format: Exact 13 caractere numerice
✓ Email: Format valid (dacă prezent)
✓ Telefon: 10+ cifre (dacă prezent)
✓ Dată naștere: În trecut, după 1900
✓ Dată asigurare: Nu poate fi în trecut (dacă isInsured=true)
✓ Fără CNP duplicate
✓ Nume: Nu vacuumă, min 2 caractere
✓ Alergii: Tip + Severitate valid
```

**Raport erori:**
- Email notificare zilnic
- Admin dashboard: "Data Quality Score"

---

## 🗑️ Soft Delete & Hard Delete

### Soft Delete (Dezactivare)

```
Patient.IsActive = false
```

**Efect:**
- ❌ Nu apare în liste (filter isActive=true)
- ✓ História se păstrează
- ✓ Se pot consulta detalii
- ✓ Poate fi reactivat

**Command:**
```bash
PATCH /api/patients/{id}/deactivate
```

### Hard Delete (Ștergere permanentă)

```
DELETE FROM Patients WHERE id = @id
```

**Condiții hard delete:**
- ☐ Pacient fără consultații
- ☐ Pacient fără prescripții
- ☐ Pacient fără facturi
- ☐ Admin permissioning required
- ☐ Audit trail trebuie salvat ÎNAINTE de ștergere

**Proces sigur:**
```
1. Export audit trail (zvuci)
2. Backup DB snapshot
3. Execute DELETE
4. Log hard delete: "User X deleted patient Y at Z"
```

---

## 📊 Backup și recovery

### Backup automat

```
Schedule: Nightly (22:00)
Retention: 30 GB (rolling)
Location: /backups/patients/
```

**Conținut backup:**
- Tables: Patients, PatientAllergies, PatientAudit
- Indexes: Preserved
- Relationships: Intact

### Recovery plan

**Scenariul 1: Restaurare pacient ștert accidental**

```
1. Detectare: Audit trail show hard delete
2. Identify: Find recent backup ÎNAINTE de ștergere
3. Restore: Partial restore din backup
4. Verify: Check data integrity
5. Notify: Medic + HR
6. Document: Incident report
```

**Scenariul 2: Data corruption**

```
1. Alert: Data quality check flags issue
2. Isolate: Disable affected patients (isActive=false)
3. Restore: Full DB restore din recent backup
4. Verify: Data integrity checks pass
5. Communicate: Alert tous users
```

---

## ⚡ Optimizare performanță

### Indexing

**Indexuri existente:**
```sql
CREATE INDEX ix_patients_clinic_active ON Patients(ClinicId, IsActive)
CREATE INDEX ix_patients_cnp ON Patients(CNP) UNIQUE
CREATE INDEX ix_patients_search ON Patients(FullName, BirthDate)
CREATE INDEX ix_patient_allergies_patient ON PatientAllergies(PatientId)
```

**Ad-hoc indexing:**
```sql
-- Dacă search e slow:
CREATE INDEX ix_patients_fullname_collate 
  ON Patients(FullName COLLATE Latin1_General_CI_AS)

-- Monitor index usage:
SELECT * FROM sys.dm_db_index_usage_stats
WHERE database_id = DB_ID() AND object_id = OBJECT_ID('Patients')
```

### Query optimization

**N+1 problem — AVOID:**
```csharp
// ❌ BAD: 1 query + loop = N queries
var patients = await _repo.GetAllAsync();
foreach (var p in patients) {
    var allergies = await _repo.GetAllergiesAsync(p.Id); // N queries!
}
```

**Include relations:**
```csharp
// ✅ GOOD: 1 query with eager loading
var patients = await _context.Patients
    .Include(p => p.Allergies)
    .ToListAsync();
```

### Pagination discipline

```
Always paginate list responses!
Default: 20 items/page
Max: 1000 items/page
```

---

## 🔐 GDPR Compliance

### Data export (GDPR Article 15)

```
Endpoint: GET /api/patients/{id}/export-gdpr
Response: ZIP cu fișe medicale complete
```

**Conținut:** - Informații personale
- Contactă
- Date medicale
- Alergii
- Historique consultații
- Scan documente (PDF)

### Data deletion (GDPR Article 17)

```
Endpoint: DELETE /api/patients/{id}?reason=gdpr_request
```

**Process:**
1. Verificationare request (email + identity)
2. Check lawful basis continuare
3. Anonymize/delete pe escalade
4. Conservare minimal audit data (legit interest)
5. Confirmă-le utilizator în 30 zile

---

## 🎯 Checklist administrativ

- [ ] Permisiuni configurate per rol
- [ ] Audit logging activat
- [ ] Backup-uri testate (restore test)
- [ ] Data quality checks running
- [ ] GDPR policy docum approved
- [ ] Duplicate detection set up
- [ ] Export feature available
- [ ] Rate limiting configured (API)
- [ ] Encryption at rest enabled
- [ ] Disaster recovery plan documented

---

## 📋 Configurare appsettings.json

```json
{
  "PatientsSettings": {
    "PageSize": {
      "Default": 20,
      "Max": 1000
    },
    "Validation": {
      "CnpRequired": true,
      "EmailRequired": false,
      "AllergyRequired": false
    },
    "Export": {
      "Enabled": true,
      "MaxRecords": 10000,
      "FileFormat": "xlsx"
    },
    "Audit": {
      "Enabled": true,
      "LogChanges": true,
      "RetentionDays": 365
    },
    "SoftDelete": {
      "Enabled": true,
      "HardDeleteAllowed": false,
      "MinDaysBeforeDelete": 90
    },
    "DataQuality": {
      "DuplicateCheckEnabled": true,
      "DuplicateCheckSchedule": "0 0 * * *",
      "AlertOnIssues": true
    }
  }
}
```

---

## 🆘 Troubleshooting admin

### ❌ "Search very slow"

**Diagnosis:**
```sql
-- Check Missing Index:
SET STATISTICS IO ON;
SELECT * FROM Patients 
WHERE FullName LIKE '%popescu%' 
AND ClinicId = @clinicId;
SET STATISTICS IO OFF;
```

**Fix:**
```sql
CREATE NONCLUSTERED INDEX ix_patients_fullname 
ON Patients(ClinicId, FullName);
```

---

### ❌ "Duplicate patients"

```
Run Dedup Tool:
Admin Panel > Tools > Deduplicate Patients
  → Scan CNP, Names, Dates
  → Suggest merges
  → Review + Approve
```

---

### ❌ "GDPR request pending"

```
1. Verify identity: Email + ID number
2. Check no lawful basis to keep data
3. Run deletion job
4. Anonymize related records (consultații cu pseudonym)
5. Confirm deletion to user
```

---

**© 2025 ValyanClinic. Documentație administrator.**
