# 🛡️ Ghid Administrator - Pagina Medici

## 🎯 Ce faci ca administrator pe pagina asta?

**Manageriezi accesul, monitorizezi datele, asiguri compliance, configurezi sistem**

---

## 🔐 Configurare Permisiuni

### Module Doctors - Access Levels

```
Pagina Medici = Module "Doctors"

Level 1: READ ONLY
  - View list
  - Search & filter
  - View details
  - NO create/edit/delete

Level 2: CREATE & EDIT
  - All of Level 1
  + Create doctor
  + Edit doctor info
  - NO delete
  - NO export
  - NO configuration

Level 3: FULL MANAGEMENT
  - All of Level 2
  + Delete doctor (cu constrain-uri)
  + Export Excel
  - NO configuration
  - NO audit logs

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
Cauta: "Doctors"
Click select
```

**Pas 3: Setează level**
```
Radio buttons / Dropdown
Level 1: Receptionist
Level 2: HR Manager
Level 3: Doctor Lead
Level 4: IT Admin
```

**Pas 4: Salvează**
```
Click "Save permissions"
User can immediately access
(Token refresh automat)
```

### Multi-tenant isolation

```
👉 IMPORTANT: Fiecare doctor = tied la ClinicId
Doctori din Clinica A NU visible în Clinica B
User can only manage doctors din clinica sa
Admin panel: check current selected clinic
```

---

## 📊 Monitoring & Audit

### Real-time Monitoring

**Accese:**
```
Admin Panel > Monitoring > Doctors Module
```

**Metrici:**
```
- Active users viewing page (real-time)
- HTTP requests count (last 5 min)
- Average response time (ms)
- Error rate (last hour)
```

**Dashboard:**
```
┌─────────────────────────────────────────┐
│ Doctors Module - Live Dashboard         │
├─────────────────────────────────────────┤
│ Active users: 5                         │
│ Requests/min: 24                        │
│ Avg response: 127ms                     │
│ Error rate: 0.2%                        │
│ Last error: 10 minutes ago              │
│ Status: ✅ Healthy                      │
└─────────────────────────────────────────┘
```

### Audit Trail

**Accese:**
```
Admin Panel > Audit Logs > Doctors
```

**Ce se logează:**
```
✅ Create doctor
✅ Update doctor
✅ Delete doctor
✅ Export requested
✅ Failed login attempt care accesa doctors
✅ Permission changed
```

**Informatii logată:**
```
Timestamp:    2025-03-08 14:32:10.150
User:         Popescu Elena (HR Manager)
Action:       Create
Resource:     Doctor "Andrei Popescu"
Changes:      {"firstName": "Andrei", ...}
IP Address:   192.168.1.45
Status:       Success
Duration:     234ms
```

**Filter logs:**
```
By date range: select dates
By user: dropdown
By action: Create, Update, Delete, Export, etc.
By status: Success, Failed
By resource: doctor full name
```

---

## 🔍 Data Quality Checks

### Validări integrate

```
Sistema auto-check:

1. Email duplicate
   - Unique constraint la DB
   - Error code 50301 (SQL custom)

2. Invalid department
   - Foreign key constraint
   - Error code 50302

3. Invalid supervisor
   - FK constraint + recursive check
   - Error code 50303

4. License expiry soon
   - Alert în UI dacă < 60 days
   - Background job notificare

5. Orphaned records
   - Weekend job: verify FK relationships
   - Report missing data
```

### Manual Data Quality

**Accesează:**
```
Admin Panel > Data Quality > Doctors Report
```

**Raport:**
```
📋 Total records: 287
├─ Active: 245 (85%)
├─ Inactive: 42 (15%)
├─ Missing email: 0 ✓
├─ Missing phone: 12 ⚠️
├─ License expired: 3 🔴
├─ License <60 days: 8 🟠
└─ Duplicate detection: 0 ✓
```

**Action:**
```
1. Check expired licenses
   - Generate notification email
   - Mark for renewal process

2. Missing phone number
   - Filter doctors
   - Contact directly for update

3. Potential duplicates
   - Similar names: auto-suggest merge
   - Email similar: auto-flag
```

---

## 💾 Backup & Disaster Recovery

### Backup Strategy

**Frequency:**
```
Daily: Full backup la 02:00 AM
Hourly: Incremental backup top of hour
Real-time: Transaction log backup every 5 min
```

**Location:**
```
Primary: /mnt/backups/doctors/
  - Doctors_full_2025-03-08.bak
  - Doctors_incr_2025-03-08_14.bak
Secondary: Cloud (AWS S3)
  - Encrypted offsite
  - 30 day retention
```

**Size estimate:**
```
Full backup: ~500MB (287 doctors + audit)
Daily increment: ~50MB
Monthly: ~1.5GB
```

### Restore Process

**Scenar: Accidental delete 10 doctors**

**Pas 1: Plan recovery**
```
1. Identify deletion time: 14:30
2. Choose backup: 14:00 (safe point)
3. Test restore first (staging)
```

**Pas 2: Prepare staging**
```
1. Snapshot staging DB
2. Run restore script
3. Verify data integrity
```

**Pas 3: Restore command**
```bash
RESTORE DATABASE ValyanClinic FROM DISK=
  '/mnt/backups/doctors/Doctors_full_2025-03-08.bak'
WITH REPLACE, RECOVERY
GO

-- Verify
SELECT COUNT(*) FROM Doctors WHERE IsDeleted = 0
-- Should show 287 (with 10 recovered)
```

**Pas 4: Test & validate**
```
1. Check doctors list: correct count
2. Run data quality report
3. Verify audit logs preserved
4. Test search/filter functionality
```

**Pas 5: Swap to production**
```
1. Brief users: "5 min maintenance"
2. Switch connection string
3. Monitor error rate (should be 0%)
4. User testing
5. Announce recovery complete
```

**Rollback if error:**
```
Just revert to staging snapshot
RTO: 2-5 minutes
```

---

## 🔒 GDPR Compliance

### Doctor Personal Data

```
Covered by GDPR:
- Email address
- Phone number
- First name / Last name
- Medical code (personal)
- Created/Updated dates

NOT GDPR (professional):
- Department affiliation
- Medical specialty
- License number (public)
- Title
```

### Data Retention Policy

```
Active doctor:
  - Keep fullness while employed

Inactive doctor:
  - Soft delete (mark isDeleted = true)
  - Keep 3 years for audit trail
  - Then permanently delete

Deleted doctor:
  - Anonymize sensitive fields
  - Keep ID + professional data
  - Example:
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "[DELETED]",
      "lastName": "[DELETED]",
      "email": "[DELETED]@clinic.local",
      "deletedAt": "2023-03-08",
      "reason": "GDPR right to erasure"
    }
```

### Right to Erasure (GDPR Art. 17)

**Proces:**
```
1. Doctor request: Send to dpo@valyan-clinic.ro
2. Review: 30 days window
3. Exceptions:
   - Active consultations (anonymize instead)
   - Legal obligation (3 year audit retention)
   - Medical records (must keep)
4. Action:
   - If approved: trigger anonymization
   - If denied: notify doctor
5. Verification: Confirm deletion completed
```

### Audit Trail Retention

```
Keep logs for:
- 3 years: Financial & tax
- 5 years: Medical malpractice insurance
- 7 years: Labor law (employment)

Auto-archive:
- 1 year: Move to cold storage
- 3 years: Compress + encrypt
- 5 years: Delete if no legal hold
```

---

## ⚙️ Configurare Sistem

### Settings

**File: `/appsettings.json`** sau **Admin UI:**

```json
{
  "DoctorsModule": {
    "Enabled": true,
    "MaxDoctorsPerClinic": 500,
    "SearchDebounceMs": 500,
    "PageSize": 20,
    "ExportMaxRows": 10000,
    "LicenseExpiryWarningDays": 60,
    "AllowSoftDelete": true,
    "AllowHardDelete": false,
    "RequireSupervisionHierarchy": false,
    "AuditLogRetentionDays": 1825
  }
}
```

**Setting: Max Doctors per Clinic**
```
Default: 500
Increase if clinic outgrow
Limit prevents resource abuse
```

**Setting: License Expiry Warning**
```
Default: 60 days
Alerts when licence < 60 days to expiry
Send email/notification
```

**Setting: Soft vs Hard Delete**
```
AllowSoftDelete: true  (default)
  → Mark isDeleted, preserve audit log

AllowHardDelete: false (secure)
  → Prevent permanent deletion
  → If needed: only via DB admin + approval
```

---

## 📧 Notifications

### Email Templates

**Doctor Created:**
```
To: doctor@email.com
Subject: Welcome to ValyanClinic!

Your account has been created:
- Username: andrei.popescu
- Email: andrei.popescu@email.com
- Specialty: Cardiology
- Department: Cardiology

Please update your profile.
First login link: [auto-generated]
```

**License Expiring Soon:**
```
To: department_head@email.com
Subject: ⚠️ License expiring soon - Dr. Popescu

Dr. Andrei Popescu (Cardiology)
License expires: 2025-05-30 (52 days)

Action needed:
1. Contact doctor for renewal
2. Submit CMR renewal request
3. Update system when renewed

Link: [edit doctor link]
```

**Doctor Deleted:**
```
To: it_admin@email.com
Subject: Doctor record soft-deleted - Audit log

Doctor: Dr. Andrei Popescu (ID: 550e8400...)
Deleted by: Elena Popescu (HR)
Timestamp: 2025-03-08 14:32:10
Reason: "Left clinic"

Audit log: [link to full log]
Restore available: [restore link] (7 days window)
```

### Notification Settings

```
Per role:
- Department Head: notified of speciality creation
- HR Manager: notified of all doctors actions
- IT Admin: notified of failed operations
- Doctor: notified of own profile changes

Per action:
- Create: send welcome email
- Delete: notify admin
- License expiry: notify department
- Unauthorized access: alert security
```

---

## 🚨 Incident Response

### Common Issues & Solutions

**Issue: Duplicate doctor entries**
```
Problem: 2x "Dr. Popescu" cu acelasi email

1. Check which e newest
   SELECT * FROM Doctors WHERE Email = 'andrei@email.com'

2. Merge if needed:
   - Copy consultations to newer record
   - Soft delete old record
   - Verify no duplicate keys

3. Prevent future:
   Enable unique constraint: EMAIL
```

**Issue: Orphaned doctor**
```
Problem: Doctor în inactive doctors, no one supervision-ing

1. Find children:
   SELECT * FROM Doctors WHERE SupervisorDoctorId = 'xxx'
   
2. Reassign:
   - Assign to new supervisor
   - OR mark supervisor field as NULL
   - OR deactivate them too

3. Check consultations:
   - Reassign to other doctor
   - OR keep as historical
```

**Issue: License expired - doctor still active**
```
Problem: System allowed doctor practice without valid licence

1. Immediate: Deactivate doctor
   UPDATE Doctors SET IsActive = 0 WHERE Id = 'xxx'

2. Notify:
   - Send urgent alert to HR + doctor
   - Flag in dashboard
   - Block new patients assignment

3. Resolve:
   - Doctor renews licence
   - HR uploads CMR copy
   - Reactivate doctor

4. Audit:
   - Log incident
   - Review permission system
   - Legal review if required
```

---

## 📈 Performance Tuning

### Optimization Checklist

```
✅ Database indexes:
   - Doctors(ClinicId, IsActive, IsDeleted) compound index
   - Doctors(Email) unique index
   - Doctors(DepartmentId, IsActive)
   - Doctors(SpecialtyId)

✅ Query performance:
   - List query: include department/specialty eager load
   - Search: full-text index on name fields
   - Filter: indexed columns

✅ Caching:
   - Lookup (supervisor list): 5 min cache
   - Nomenclature (specialties): 10 min cache
   - Clinic doctors: 3 min cache (invalidate on changes)

✅ Pagination:
   - Default: 20 items/page
   - Max: 100 items/page
   - Avoid "load all" queries

✅ Frontend:
   - Lazy load modals
   - Debounce search (500ms)
   - Virtual scrolling if > 1000 rows
```

### Performance Metrics

```
Target SLA:
- List load: < 500ms (p95)
- Search: < 300ms (p95)
- Create: < 1s (p95)
- Update: < 1s (p95)
- Delete: < 500ms (p95)
- Export: < 5s for 1000 rows (p95)

Monitor:
- Admin Panel > Performance
- If breach: optimize queries
- If persist: add resources
```

---

## 🔄 Regular Maintenance

### Weekly Tasks
```
Monday:
  - Check error logs
  - Review unauthorized access attempts
  - Verify backup completion

Friday:
  - Run data quality report
  - Check license expiry warnings
  - Email summary to stakeholders
```

### Monthly Tasks
```
- Audit log review (check for anomalies)
- Backup restore test (staging)
- Permission audit (who has access?)
- GDPR checklist (data retention policy)
- Performance analysis (slow queries?)
```

### Quarterly Tasks
```
- Database optimization
- Security audit
- Compliance review
- Disaster recovery plan update
- User training (new features)
```

---

## 📞 Support & Escalation

| Issue | Severity | Action | Timeline |
|-------|----------|--------|----------|
| Search slow | Low | Optimize DB query | 1 week |
| Login error | High | Check auth system | 1 day |
| Data missing | Critical | Restore from backup | 2 hours |
| Unauthorized access | Critical | Disable user + audit | 1 hour |
| Compliance breach | Critical | Legal review + notify | 24 hours |

---

**© 2025 ValyanClinic. Admin guide confidențial.**

*Ultima actualizare: 2025-03-08*
