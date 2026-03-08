# 🔧 Troubleshooting - Pagina Personal Medical

## 🚀 Quick Diagnosis

| Problemă | Secțiune |
|----------|----------|
| Pagina nu se încarcă | [→ 1](#1-pagina-nu-se-încarcă) |
| Tabel gol | [→ 2](#2-tabel-gol) |
| Search/Filter nu merge | [→ 3](#3-căutarefiltru-nu-merge) |
| Error la creare/editare | [→ 4](#4-error-la-creare-sau-editare) |
| Ștergere imposibilă | [→ 5](#5-ștergere-imposibilă) |
| Export Excel nu merge | [→ 6](#6-export-excel-nu-merge) |
| Permisiuni insuficiente | [→ 7](#7-permisiuni-insuficiente) |

---

## 1. Pagina nu se încarcă

**Check:**
1. URL corect: `/medicalStaff`
2. Network (F12): GET /api/medicalStaff status 200?
3. Auth token valid?
4. Cache clear: Ctrl+Shift+Delete

**Action:** 200 OK → next step. 401 → re-login. 500 → contact IT.

---

## 2. Tabel gol

**Check:**
1. Filtre prea restrictive? Reset.
2. Response data empty? Check stats card.
3. Page selector correct (page 1)?
4. Network call successful?

**Action:** Expected 0 → add staff. Bug → refresh page.

---

## 3. Căutare/Filtru nu merge

**Check:**
1. Search funcționează: name, email, title
2. Tip corect search term?
3. Debounce delay? Wait 1 sec.
4. Clear search → tabel refill?

**Action:** Invalid type → use correct filter. Nothing → verify server data.

---

## 4. Error la criere sau editare

**Check:**
1. Validation messages (red)?
2. Required fields filled?
3. Network error (F12)?
4. Server response code?

**Errors:**
- 409 Conflict: Email duplicate → change email
- 422 Validation: Invalid input → fix
- 500 Server: Contact IT

**Action:** Fix validation, retry.

---

## 5. Ștergere imposibilă

**Check:**
1. Staff has consultations? Can't delete.
2. Permission Level 3+?
3. Confirmation dialog appeared?

**Alternative:** Deactivate (toggle OFF) instead.

---

## 6. Export Excel nu merge

**Check:**
1. Permission Level 3+?
2. Button visible?
3. Select columns?
4. Download initiated?

**Action:** Check Download folder. Retry if blank.

---

## 7. Permisiuni insuficiente

**Check:**
1. Role + Level?
2. Module "MedicalStaff" assigned?
3. Contact admin.

---

## Advanced Debugging

```javascript
// Check auth
const auth = JSON.parse(localStorage.getItem('auth-storage'))
console.log(auth.state.user)

// Test API
curl -X GET "https://api.clinic.local/api/medicalStaff?page=1" \
  -H "Authorization: Bearer TOKEN"
```

---

**© 2025 ValyanClinic. Troubleshooting Guide.**

*Ultima actualizare: 2025-03-08*
