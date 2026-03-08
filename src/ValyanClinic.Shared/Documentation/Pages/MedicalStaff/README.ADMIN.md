# 🛡️ Ghid Administrator - Pagina Personal Medical

## 🎯 Ce faci ca administrator?

**Manageriezi accesul, monitorizezi datele, asiguri compliance, configurezi sistem**

---

## 🔐 Configurare Permisiuni

### Module MedicalStaff - Access Levels

```
Pagina Personal Medical = Module "MedicalStaff"

Level 1: READ ONLY
  - View list
  - Search & filter
  - View details
  - NO create/edit/delete

Level 2: CREATE & EDIT
  - All of Level 1
  + Create staff
  + Edit staff info
  - NO delete
  - NO export

Level 3: FULL MANAGEMENT
  - All of Level 2
  + Delete staff
  + Export Excel
  - NO configuration

Level 4: ADMINISTRATOR FULL
  - All of Level 3
  + Full audit logs access
  + Configuration access
  + Permission management
  + Backup/restore control
```

### Asignare permisii

**Pas 1: Deschide Admin Panel**
```
1. Login ca admin
2. Admin Panel > Users & Permissions
3. selectează user
```

**Pas 2: Selectează modul**
```
Section: Modules
Cauta: "MedicalStaff"
Click select
```

**Pas 3: Setează level**
```
Radio buttons / Dropdown
Level 1: View only
Level 2: HR Manager (create/edit)
Level 3: Department Head (+ delete)
Level 4: IT Admin (all + config)
```

**Pas 4: Salvează**
```
Click "Save permissions"
User can immediately access
```

---

## 📊 Monitoring & Audit

### Real-time Monitoring

**Accese:**
```
Admin Panel > Monitoring > MedicalStaff Module
```

**Metrici:**
- Active users viewing page
- HTTP requests (last 5 min)
- Average response time
- Error rate (last hour)

### Audit Trail

**Ce se logează:**
```
✅ Create staff
✅ Update staff
✅ Delete staff
✅ Export requested
✅ Failed logins
✅ Permission changes
```

**Informatii logată:**
```
Timestamp:    2025-03-08 14:32:10
User:         Elena Popescu (HR Manager)
Action:       Create
Resource:     MedicalStaff "Ionela Popescu"
Changes:      {"firstName": "Ionela", ...}
IP Address:   192.168.1.45
Status:       Success
```

---

## 🔍 Data Quality Checks

### Validări integrate

```
1. Email duplicate
   - Unique constraint per clinic
   - Error code 50401 (SQL)

2. Invalid department
   - FK constraint
   - Error code 50402

3. Invalid supervisor doctor
   - FK constraint
   - Error code 50403

4. Missing required fields
   - Server-side validation
   - Error code 50404
```

### Manual Data Quality

**Accesează:**
```
Admin Panel > Data Quality > MedicalStaff Report
```

**Raport:**
```
📋 Total records: 156
├─ Active: 142 (91%)
├─ Inactive: 14 (9%)
├─ Missing department: 0 ✓
├─ Invalid supervisor: 0 ✓
└─ Duplicate emails: 0 ✓
```

---

## 💾 Backup & Disaster Recovery

### Backup Strategy

**Frequency:**
```
Daily: Full backup la 02:00 AM
Hourly: Incremental backup top of hour
Real-time: Transaction log every 5 min
```

**Size estimate:**
```
Full backup: ~100MB (156 staff + audit)
Daily increment: ~10MB
```

### Restore Process

**Pas 1: Plan recovery**
```
1. Identify deletion time
2. Choose backup (safe point)
3. Test restore first (staging)
```

**Pas 2: Restore command**
```bash
RESTORE DATABASE ValyanClinic FROM DISK=
  '/backups/medicalstaff_2025-03-08.bak'
WITH REPLACE, RECOVERY
GO

SELECT COUNT(*) FROM MedicalStaffMembers
WHERE IsDeleted = 0
```

**Pas 3: Verify**
```
1. Check staff list: correct count
2. Run data quality report
3. Verify audit logs
```

---

## 🔒 GDPR Compliance

### Staff Personal Data

```
Covered by GDPR:
- Email address
- Phone number
- First name / Last name
- Created/Updated dates

NOT GDPR (professional):
- Department affiliation
- Job title
- Supervisor assignment
```

### Data Retention Policy

```
Active staff:
  - Keep fullness while employed

Inactive staff:
  - Soft delete (mark isDeleted = true)
  - Keep 3 years for audit trail
  - Then permanently delete

Deleted staff:
  - Anonymize sensitive fields
  - Keep ID + professional data
```

---

## ⚙️ Configurare Sistem

### Settings (appsettings.json)

```json
{
  "MedicalStaffModule": {
    "Enabled": true,
    "MaxStaffPerClinic": 500,
    "SearchDebounceMs": 500,
    "PageSize": 20,
    "ExportMaxRows": 5000,
    "AllowSoftDelete": true,
    "AllowHardDelete": false,
    "AuditLogRetentionDays": 1825
  }
}
```

---

## 📧 Notifications

### Email Templates

**Staff Created:**
```
To: staff@email.com
Subject: Welcome to ValyanClinic!

Your account has been created:
- Email: ionela.popescu@clinic.local
- Department: Urgență
- Title: Infirmieră
```

**Staff Deleted:**
```
To: admin@clinic.local
Subject: Staff record soft-deleted - Audit log

Staff: Ionela Popescu
Deleted by: Elena Popescu (HR)
Timestamp: 2025-03-08 14:32:10
```

---

## 🚨 Incident Response

### Common Issues & Solutions

**Issue: Duplicate staff entries**
```
1. Check which e newest
2. Merge if needed
3. Soft delete old record
4. Verify no duplicate keys
```

**Issue: Orphaned supervisor**
```
1. Find staff supervised
2. Reassign to new doctor
3. Or mark supervisor NULL
```

---

## 📈 Performance Optimization

### Database Indexes

```sql
-- Email unique per clinic
CREATE UNIQUE INDEX UX_MedicalStaff_ClinicId_Email
  ON MedicalStaffMembers(ClinicId, Email);

-- For filtering
CREATE INDEX IX_MedicalStaff_ClinicId_IsActive
  ON MedicalStaffMembers(ClinicId, IsActive, IsDeleted);

CREATE INDEX IX_MedicalStaff_DepartmentId
  ON MedicalStaffMembers(DepartmentId);

CREATE INDEX IX_MedicalStaff_MedicalTitleId
  ON MedicalStaffMembers(MedicalTitleId);
```

### Caching Strategy

```typescript
list: 3 * 60 * 1000,        // 3 min
lookup: 5 * 60 * 1000,      // 5 min
detail: 10 * 60 * 1000,     // 10 min
```

---

## 📅 Regular Maintenance

### Weekly
- Monitor FAQ for questions
- Review support tickets
- Check error logs

### Monthly
- Full documentation review
- Run data quality report
- Permission audit
- GDPR checklist

### Quarterly
- Database optimization
- Security audit
- Compliance review
- Performance baseline

---

**© 2025 ValyanClinic. Admin guide confidențial.**

*Ultima actualizare: 2025-03-08*
