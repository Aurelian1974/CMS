# 🔧 Troubleshooting Guide - Pagina Pacienți

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

---

## 1. Pagina nu se încarcă

### Simptom: Pagina albă, spinner infinit, sau error

**Pași diagnosis:**

#### Pas 1: Check URL
```
Corect:  /patients
Greșit:  /patient (singular)
Greșit:  /patients/list (path greșit)
```

#### Pas 2: DevTools Network
```
F12 → Network tab
Cauta: GET /api/patients
Status: 
  - 200 ✓ (merge)
  - 401 (re-login)
  - 500 (server down)
  - Timeout (network slow)
```

#### Pas 3: Clear cache
```
Ctrl+Shift+Delete → Clear cookies + cache
Hard refresh: Ctrl+Shift+R
Retry pagina
```

#### Pas 4: Verify auth
```
Check: localStorage sau sessionStorage
localStorage.getItem('auth-storage')
// Ar trebui să arate: { state: { accessToken, user, ... } }
```

**Action:**
- ✓ 200 + auth OK → proceed to Step 5
- 401 Unauthorized → re-login
- 500 Server Error → contact admin
- Timeout → check internet

#### Pas 5: Console errors
```
F12 → Console tab
Abiți erori roșii (Uncaught exceptions)?
Screenshot + send to dev team
```

---

## 2. Tabel gol (fără rânduri)

### Simptom: Sarcini OK dar niciun pacient afișat

**Pași diagnosis:**

#### Pas 1: Check filters
```
Ai aplicat filtre prea restrictive?
  - isActive = false (doar inactivi)
  - bloodTypeId specifick (prea rar)
  - search string (exact match required)

Action: Click "Resetează filtre"
```

#### Pas 2: Check stats
```
Afișa "Total pacienți: 0"?
  → Clinic NU are pacienți
  → Contact admin dacă ar trebui să existe

Afișa "Total: 50" dar tabel gol?
  → Bug → Reportar dev team
```

#### Pas 3: Page selector
```
Ești pe pagina 5 din 1 pagina total?
Click "Previous" pentru prima pagina
Check: Page 1 of X indicator
```

#### Pas 4: Network check
```
F12 → Network
POST /api/patients?page=1
Response: 
  - success: true ✓
  - data.pagedResult.items: [] ← Empty!
```

**Action:**
- ✓ Filtre restrictive → reset
- ✓ Stats show 0 → expected
- Response empty + many existe → bug
- Contact IT/Dev

---

## 3. Căutare/Filtru Nu Merge

### Simptom: Search/Filter nu produce rezultate

**Pași diagnosis:**

#### Pas 1: Search specific type
```
Search funcționează pe: Nume, CNP, Email
Search NU funcționează pe: Adresa, Telefon, Medic

Ai căutat după telefon?
  → Use "Medic primar" filter în schimb
```

#### Pas 2: Clear search
```
Click "X" în search box
Tabel se reîncarcă cu toți pacienții?
  → Search input e corrupted
  → Refresh pagina
```

#### Pas 3: Debounce delay
```
Search are debounce 500ms
Ai așteptat 1 sec După typing?
"ion" → (așteptare) → Request trimis
```

#### Pas 4: Filter dropdown
```
DropDown nu se deschide?
Click pe dropdown → wait 1 sec → click din nou
```

#### Pas 5: Network inspection
```
F12 → Network
Click filtre
POST /api/ patients?search=ion
Status: 200? 500? Error?
```

**Action:**
- Invalid search type → use correct filter
- Nothing returned but should exist → debug API
- UI freeze → page refresh

---

## 4. Error la Creare sau Editare

### Simptom: "Validation error" sau form frozen

**Pași diagnosis:**

#### Pas 1: Validation messages
```
Form arată erori roșii?
  - "CNP trebuie să aibă 13 cifre"
  - "Email format invalid"
  - "Data trebuie în trecut"

Fix: Corectează campo
```

#### Pas 2: Required fields
```
Ai completat TOȚI campurile obligatorii (*)?
  - Nume ✓
  - CNP ✓
  - Data nașterii ✓
  - Gen ✓
  - Medic primar ✓
```

#### Pas 3: Form state check
```
F12 → Application → SessionStorage
Search: patient-form-data
Ar trebui să conțină formular values
Corupt data? → Clear storage + refresh
```

#### Pas 4: Network error
```
F12 → Network → Click "Salvează"
POST /api/patients (or PUT)
Status: 
  - 201/200 (success)
  - 422 Validation error
  - 500 Server error
```

**Codul 422 - Validation error:**
```json
{
  "errors": [
    {"message": "CNP duplicate: 1850312123456"}
  ]
}
```

**Action:**
- CNP existe → crează nou cu CNP corect
- Email duplicate → use unique email
- Server 500 → contact admin

#### Pas 5: Modal issue
```
Modal locked / can't close?
Press Escape
Tabindex bug → hard refresh page
```

---

## 5. Ștergere imposibilă

### Simptom: Ștergere dezactivată sau "Conflict" error

**Pași diagnosis:**

#### Pas 1: Verify constraints
```
Pacientul are:
  - Consultații? ❌ Ștergere imposibilă
  - Prescripții? ❌ Ștergere imposibilă
  - Facturi? ❌ Ștergere imposibilă
  - Internări? ❌ Ștergere imposibilă
```

**Soluție:** Dezactivează în loc de ștergere

#### Pas 2: Deactivate alternative
```
1. Click Edit
2. Uncheck "Activ"
3. Salvează
4. Pacient dispare din lista (soft delete)
```

#### Pas 3: Admin delete
```
Ai permisie Delete level 3?
Role permisioa > 3?
Contact admin dacă NU
```

#### Pas 4: Confirm action
```
Dialog appeared: "Sigur ștergi?"
Click "Ștergere" confirmat?
```

**Error 409 Conflict:**
```json
{
  "errors": [{
    "message": "Patient has 3 active consultations. Cannot delete."
  }]
}
```

---

## 6. Export Excel Nu Merge

### Simptom: Export dezactivat sau file corupt

**Pași diagnosis:**

#### Pas 1: Permission check
```
Ai Export permission?
Role permisie ≥ 4 (Admin)?
Nu? → Contact admin
```

#### Pas 2: Button visible
```
Button "📊 Export Excel" afișat?
NU → Permisii insuficiente
Click → Dialog se deschide?
```

#### Pas 3: Select columns
```
NU poți selecta coloane?
JavaScript disabled? → Enable
Try: Click "Select all" button
```

#### Pas 4: Download
```
Click "Exportă"
Browser ask save location?
File download inițiat?
```

Check Downloads folder: `Pacienti_*.xlsx`

#### Pas 5: File currupt
```
Deschizi file în Excel → Error?
Probabil network interrupt
Retry export, check network
```

**Debug network:**
```
F12 → Network → Find XLS export
POST /api/patients/export
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Size should be > 10KB
```

---

## 7. Permisiuni Insuficiente (No Access)

### Simptom: Message "NU aveți acces la această funcție"

**Pași diagnosis:**

#### Pas 1: Check role
```
Care-ți este rolul?
  - Doctor: Level 3 (Create, Edit, Delete)
  - Receptionist: Level 2 (Create, Edit)
  - Nurse: Level 1 (Read only)
  - Admin: Level 4 (All)

Doctori non-acces?
  → Role NU include Patients permission
  → Admin: Adăugă modul Pacienți cu Level 3
```

#### Pas 2: Clinic isolation
```
Ți-ai schimbat clinica recent?
Datele se filtrează per clinic
NU poți vedea pacienți din altă clinică
Expected behavior
```

#### Pas 3: Contact admin
```
Crezi e error?
  - Role: Doctor (ar trebui Level 3)
  - File: NU pot edita
  → Contact admin

Admin: Verify în Admin Panel > Permissions
```

---

## 🎯 Checklist diagnosis complet

- [ ] URL-ul e corect (/patients)
- [ ] Auth token valid (localStorage check)
- [ ] Network call 200 OK (Network tab)
- [ ] No JavaScript console errors
- [ ] Filters reset
- [ ] Page 1 selected
- [ ] Form validation messages checked
- [ ] Required fields filled
- [ ] Permissions verified (role + module)
- [ ] Clinic isolation understood
- [ ] Cache cleared (Ctrl+Shift+Delete)
- [ ] Hard refresh (Ctrl+Shift+R)

---

## Advanced Debugging

### Browser tools

```javascript
// Check auth
JSON.parse(localStorage.getItem('auth-storage')).state.user

// Check current URL query
new URLSearchParams(window.location.search)

// Check TanStack Query cache
window.__REACT_QUERY_CLIENT__.getCache()

// Decode JWT token
import jwtDecode from 'jwt-decode';
jwtDecode(your_access_token)
```

### cURL test

```bash
curl -X GET "https://api.clinic.local/api/patients?page=1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Server logs

```bash
# SSH to server
ssh admin@api.clinic.local

# Tail logs
tail -f /var/log/valyan-clinic-api/patients.log

# Find errors
grep ERROR /var/log/valyan-clinic-api/api.log | tail -20
```

---

**© 2025 ValyanClinic. Troubleshooting Guide.**
