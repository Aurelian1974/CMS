# 🔧 Troubleshooting - Pagina Medici

## 🚀 Diagnostic Quick Start

| Problemă | Secțiune |
|----------|----------|
| Pagina nu se încarcă | [→ 1. Nu se încarcă](#1-pagina-nu-se-încarcă) |
| Tabel gol / fără rânduri | [→ 2. Tabel gol](#2-tabel-gol-fără-rânduri) |
| Search/Filter nu funcționează | [→ 3. Căutare nu merge](#3-căutarefiltru-nu-merge) |
| Error la creare/editare | [→ 4. Erori form](#4-error-la-creare-sau-editare) |
| Ștergere imposibilă | [→ 5. Ștergere imposibilă](#5-ștergere-imposibilă) |
| Export Excel nu merge | [→ 6. Export nedisponibil](#6-export-excel-nu-merge) |
| Permisiuni insuficiente | [→ 7. No access error](#7-permisiuni-insuficiente-no-access) |
| Cascading dropdown nu merge | [→ 8. Specialty dropdown issue](#8-specialty-subspecialty-dropdown-bug) |

---

## 1. Pagina nu se încarcă

### Simptom: Pagina albă, spinner infinit, error message

**Pași diagnosis:**

#### Pas 1: Check URL
```
Corect:  /doctors
Greșit:  /doctor (singular)
Greșit:  /doctors/list (path greșit)
```

#### Pas 2: DevTools Network
```
F12 → Network tab
Cauta: GET /api/doctors
Status: 
  - 200 ✓ (merge)
  - 401 (re-login)
  - 403 (no permission)
  - 500 (server down)
  - Timeout (network slow)
```

#### Pas 3: Check auth
```
F12 → Application → LocalStorage/SessionStorage
Search: auth-storage key
Check: accessToken exists și e valid?
```

#### Pas 4: Clear cache & refresh
```
Ctrl+Shift+Delete → Clear cookies + cache
Hard refresh: Ctrl+Shift+R
```

**Action:**
- ✓ 200 + auth OK → Go to next step
- 401 Unauthorized → re-login
- 403 Forbidden → contact admin (permisii)
- 500 Server Error → contact IT
- Timeout → check internet

---

## 2. Tabel gol (fără rânduri)

### Simptom: Network OK dar niciun medic afișat

**Pași diagnosis:**

#### Pas 1: Check filters
```
Ai aplicat filtre pry restrictive?
  - isActive = false (doar inactivi)
  - departmentId specific (prea rar clinic)
  - search string (exact match required)

Action: Click "Resetează filtre"
```

#### Pas 2: Check response data
```
F12 → Network → GET /api/doctors
Response → data.pagedResult.items: []?
→ Server return 0 results = expected
→ Check stats card: "Total: 0"?
```

#### Pas 3: Check page number
```
Ești pe pagina 5 din 1 pagina total?
Click "Previous" pentru prima pagina
Check indicator: "Page 1 of X"
```

#### Pas 4: Check role permission
```
Ai Read permission (Level 1+)?
No permission → 403 error (different issue)
```

**Action:**
- Filtre restrictive → reset
- Stats show 0 total → expected (adauga medic)
- Server 500 error → contact IT

---

## 3. Căutare/Filtru Nu Merge

### Simptom: Search/Filter nu produce rezultate

**Pași diagnosis:**

#### Pas 1: Search fields
```
Search funcționează pe:
  - Prenume (firstName)
  - Nume (lastName)
  - Email
  - Cod medical (medicalCode)

Search NU funcționează pe:
  - Departament (use filter dropdown)
  - Specialitate (use filter)
  - Telefon (use details view)
```

#### Pas 2: Search term
```
Ai tipat: "Ion" → match "Ion Popescu" ✓
Ai tipat: "Andrei" → NU match "Ion Andrei" (need both)
Ai tipat: "ion@" → match email ✓
```

#### Pas 3: Clear search
```
Click "X" în search box
Tabel se reîncarcă full list?
→ Search broken, refresh pagina
```

#### Pas 4: Debounce delay
```
Search are debounce 500ms intentional
Ai așteptat 1 sec după typing?
Tipezi rapid: "Ion" → (asteapta) → request
```

#### Pas 5: Dropdown filter
```
Department dropdown nu se deschide?
Click once, wait 500ms, click din nou
```

**Action:**
- Invalid search type → use correct filter
- Nothing returned → verify server data
- UI freeze → refresh page (F5)

---

## 4. Error la Creare sau Editare

### Simptom: "Validation error" sau modal frozen

**Pași diagnosis:**

#### Pas 1: Validation messages (roșu)
```
Form arată erori roșii?
  - "Prenume obligatoriu"
  - "Email format invalid"
  - "Specialitate obligatoriu"

Action: Corectează câmpul marcat
```

#### Pas 2: Required fields
```
Ai completat TOȚI * (obligatorii)?
  - Prenume ✓
  - Nume ✓
  - Email ✓
  - Specialitate (L1) ✓
  - Sub-specialitate (L2) ✓
  - Titlu Medical ✓
```

#### Pas 3: Form state
```
F12 → Application → SessionStorage
Search: patient-form-data (or similar)
Corupt data? → Clear storage, refresh
```

#### Pas 4: Network error
```
F12 → Network → Click "Salvează"
POST /api/doctors (or PUT id)
Status: 
  - 201 (create success)
  - 200 (update success)
  - 422 Validation error (server-side)
  - 409 Conflict (email duplicate)
  - 500 Error
```

**Error 409 Conflict:**
```json
{
  "errors": [{
    "code": "EMAIL_DUPLICATE",
    "message": "Email deja exista în clinică"
  }]
}
Action: Schimba email
```

**Error 422 Server Validation:**
```json
{
  "errors": [{
    "code": "INVALID_DEPARTMENT",
    "message": "Department ID nu exista"
  }]
}
Action: Selectează valid department
```

#### Pas 5: Modal issue
```
Modal locked / can't close?
Press Escape key
Tabindex bug → hard refresh
```

---

## 5. Ștergere imposibilă

### Simptom: Ștergere dezactivată sau "Conflict" error

**Pași diagnosis:**

#### Pas 1: Check constraints
```
Medicul are:
  - Consultații active? ❌ Cannot delete
  - Prescripții active? ❌ Cannot delete
  - Pacienți sub supervizare? ❌ Cannot delete

Solution: Reassign consultații→alt doctor, apoi delete
```

#### Pas 2: Deactivate alternative
```
NU vreau șterge fizic:
1. Click Edit
2. Toggle OFF "Activ"
3. Salvează
→ Medic dispare din lista (soft mark)
→ Reversibil (admin pode restaura)
```

#### Pas 3: Permission check
```
Ai permission DELETE (Level 3+)?
Role role permisio < 3?
→ Button "Delete" e dezactivat
→ Contact admin upgrade
```

#### Pas 4: Delete confirmation
```
Dialog appeared: "Sigur ștergi Dr. X?"
Click "Ștergere" confirmat fully
Cancel anytime înainte de confirm
```

**Error 409 Conflict:**
```json
{
  "errors": [{
    "code": "DOCTOR_HAS_CONSULTATIONS",
    "message": "Cannot delete. Doctor has 5 active consultations."
  }]
}
```

---

## 6. Export Excel Nu Merge

### Simptom: Export dezactivat, file blank, download fail

**Pași diagnosis:**

#### Pas 1: Permission check
```
Ai Export permission?
Required: Level 3+ la Doctors module
NU ai? → Contact admin
```

#### Pas 2: Button visible
```
Button "📊 Export Excel" afișat sus dreapta?
NU → Permisii insuficiente (Level 2 max)
Click → Dialog se deschide?
```

#### Pas 3: Select columns
```
NU poți selecta coloane?
JavaScript disabled? → Enable în browser
Try: Click "Select All" buton
```

#### Pas 4: Download
```
Click "Exportă"
Browser ask save location?
File download inițiat? (check Downloads)
```

**Check file:**
```
Deschizi file în Excel → Error neașteptat?
Probabil network interrupt → Retry
Possible: file corrupt (re-download)
```

#### Pas 5: Network inspection
```
F12 → Network → POST /api/doctors/export
Status: 
  - 200 ✓ (file generated)
  - 403 (permission denied)
  - 500 (server error)

Content-Type: application/vnd.openxmlformats...
Size: should be > 10KB (data)
```

---

## 7. Permisiuni Insuficiente (No Access)

### Simptom: Message "Nu aveți acces la această funcție"

**Pași diagnosis:**

#### Pas 1: Check role
```
Care-ți este rolul?
  - Receptionist: Level 2 (Create, Edit only)
  - Doctor: Level 3 (+ Delete)
  - Administrator: Level 4 (All)

Doctori non-permitted doctors module?
  → Role NU include Doctors in permissions
  → Admin: add module Doctors cu Level 3
```

#### Pas 2: Multi-tenant check
```
Clinic isolation:
  Ți-ai schimbat clinica recent?
  Medici se filtrează per clinic
  NU poți vedea medici din altă clinică
  = Expected behavior
```

#### Pas 3: Module access
```
Admin Panel > Users & Permissions
Select your user
Check if module "Doctors" exista
Check: Level value (1/2/3/4)
```

#### Pas 4: Contact admin
```
Crezi e error? (should have access)
  → Contact admin give screenshot
  → Provide: role, expected action, error message
```

---

## 8. Specialty Subspecialty Dropdown Bug

### Simptom: Sub-specialty dropdown stays empty

**Pași diagnosis:**

#### Pas 1: Select specialty first
```
REQUIRED: Select Specialty L1 before Sub-specialty
Specialty dropdown gol? 
  → Nomenclatură config issue
  → Contact admin add specialties
```

#### Pas 2: Watch watch reaction
```
Select specialty dropdown → wait 500ms
Sub-specialty should populate with filtered list
If empty: check network GET /api/nomenclature/specialties
```

#### Pas 3: Cascading logic
```
backend lógica:
  Filter: specialties.where(p.level = 2 
    AND p.parentId = selectedSpecialtyId)
  
If empty:
  1. No L2 specialties configured for L1
  2. Contact admin create sub-specialties
```

#### Pas 4: Clear & retry
```
1. Refresh form (close modal, reopen)
2. Select specialty again
3. Wait for auto-population
```

---

## 🎯 Checklist Diagnostic Complet

- [ ] URL e corect (/doctors)
- [ ] Auth token valid (localStorage/sessionStorage)
- [ ] Network call 200 OK (Network tab F12)
- [ ] No JavaScript console errors (F12 Console)
- [ ] Filters reset
- [ ] Page 1 selected
- [ ] Form validation errors checked
- [ ] Required fields filled
- [ ] Permissions verified (role + module level)
- [ ] Clinic isolation understood
- [ ] Cache cleared (Ctrl+Shift+Delete)
- [ ] Hard refresh (Ctrl+Shift+R)

---

## Advanced Debugging

### Browser JavaScript

```javascript
// Check auth
const auth = JSON.parse(localStorage.getItem('auth-storage'))
console.log(auth.state.user)  // see current user + role

// Check current URL query
console.log(new URLSearchParams(window.location.search))

// Check TanStack Query cache
window.__REACT_QUERY_CLIENT__.getCache()

// Decode JWT
import jwtDecode from 'jwt-decode'
jwtDecode(auth.state.accessToken)
```

### cURL Tests

```bash
# Test auth
curl -X POST "https://api.clinic.local/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Extract token from response
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Test doctors list
curl -X GET "https://api.clinic.local/api/doctors?page=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test create doctor
curl -X POST "https://api.clinic.local/api/doctors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Doctor",
    "email": "test@clinic.local",
    ...
  }'
```

### Server Logs

```bash
# SSH to server
ssh admin@api.clinic.local

# Tail real-time logs
tail -f /var/log/valyan-clinic-api/doctors.log

# Find errors last hour
grep ERROR /var/log/valyan-clinic-api/*.log | tail -50

# Filter by operation
grep -E "CREATE|UPDATE|DELETE" 
  /var/log/valyan-clinic-api/doctors.log | tail -20
```

---

## Contact Support

| Issue | Channel | Time |
|-------|---------|------|
| Documentation unclear | docs@valyan-clinic.local | 24h response |
| Bug report | GitHub Issues #doctors | 1h check |
| Urgent down | IT Team Slack | ASAP |
| Feedback | feedback@valyan-clinic.ro | weekly review |

---

**© 2025 ValyanClinic. Troubleshooting Guide.**

*Ultima actualizare: 2025-03-08*
