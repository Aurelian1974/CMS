# 🔧 Troubleshooting Guide - Login Issues

## 🚀 Diagnostic Quick Start

Selectează situația ta și urmează pașii:

| Simptom | Link |
|--------|------|
| Nu mă pot conecta deloc | [→ Secțiunea 1](#1-nu-pot-face-login) |
| Parolă greșită în mod repetat | [→ Secțiunea 2](#2-parolă-incorecta) |
| Cont blocat | [→ Secțiunea 3](#3-cont-blocat) |
| Erori de server/conexiune | [→ Secțiunea 4](#4-erori-server) |
| Probleme post-login (redirect, etc) | [→ Secțiunea 5](#5-probleme-post-login) |

---

## 1. Nu pot face login

### Problemă: Pagina de login nu se încarcă

**Semn:**
```
Pagina albă, butonul "Autentificare" lipsă, sau eroare la tab NETWORK
```

**Pași diagnosis:**

#### Pas 1: Verifică URL-ul
```
✓ Corect:   https://valyan-clinic.local/login
✗ Greșit:   http://valyan-clinic.local/login (HTTP, nu HTTPS!)
✗ Greșit:   https://clinic.local/login (domeniu greșit)
```

**Soluție:**
- Mergeți la `https://valyan-clinic.local/login`
- Nu ignorați avertismentele de certificat HTTPS

#### Pas 2: Verifică browserul și conexiunea
```bash
# În browser Developer Tools (F12)
Console tab → Abiți erori roșii?
Network tab → Search "login" - se încarcă?
```

**Soluție pentru erori:**

| Eroare | Cauză | Fix |
|--------|-------|-----|
| `net::ERR_CONNECTION_REFUSED` | Server down | Contactați IT |
| `net::ERR_CERT_COMMON_NAME_INVALID` | SSL certificate | Reload cu Ctrl+Shift+R |
| `CORS error` | CORS policy | Contactați dev team |

#### Pas 3: Clear cache și cookies
```javascript
// F12 → Application → Cookies → Șterge valyan-clinic.local
// F12 → Application → Storage → SessionStorage → Șterge

// Sau manual în browser:
Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
→ Cookies and cached images → Clear data
```

**Reîncarcă pagina:** Ctrl+Shift+R (hard refresh)

---

### Problemă: Pagina de login se încarcă, dar nu mă pot conecta

**Semn:**
```
Pagina arată bine, dar clicking "Autentificare" nu face nimic
```

**Pași diagnosis:**

#### Pas 1: Verifică Network tab
```
F12 → Network → Click "Autentificare"
Abiți POST request la /api/auth/login?
    ✓ Да (Status 200 - merge la Pas 2)
    ✗ Nu (Status 0, error - merge la Pas 3)
```

#### Pas 2: Status 200 but still error?
```json
// Response: 200 OK dar data nula?
{
  "success": false,
  "errors": [{
    "code": "INVALID_CREDENTIALS",
    "message": "..."
  }]
}
```

**Soluție:** → Mergeți la [Secțiunea 2 - Parolă incorecta](#2-parolă-incorecta)

#### Pas 3: Network error (Status 0)
```
POST /api/auth/login → Status: Network error / CORS error / 502 Bad Gateway
```

**Checklist:**
- [ ] Server backend este pornit?
  ```bash
  # De pe server:
  sudo systemctl status valyan-clinic-api
  # Sau în Visual Studio: F5 Start
  ```

- [ ] CORS este configurat?
  ```
  Contactați Developer team — posibil CORS issue
  ```

- [ ] Firewall permite request?
  ```bash
  curl -X POST https://valyan-clinic.local/api/auth/login
  # Ar trebui să primească eroare 400 (parolă/email invalid) - asta e OK
  # Dacă: curl: (7) Failed to connect — Firewall block
  ```

---

## 2. Parolă incorecta

### Simptom: "Email-ul sau parola introduse sunt incorecte"

**Pași diagnosis:**

#### Pas 1: Verifică email-ul introdus
```
Email input: test@clinic.ro
            ↑ Spațiu la început?
            ↑ Spații la final?
            ↑ Corect scris?
```

**QuickCheck:**
```javascript
// F12 → Console
document.querySelector('input[type="text"]').value
// → Copiaț exact și comparați cu email-ul vostru
```

**Soluție:**
- Ștergeți și retastați email-ul
- Copiaț direct din email-ul pe care l-ați primit de la admin

#### Pas 2: Verifică parola
```
Parolă: "MyPassword123!"
        ↑ Caps Lock e ON? Verifică starea
        ↑ Cifele și simbolurile sunt corecte?
        ↑ E pe o tastatură în limba engleză?
```

**QuickCheck:**
- Click iconița **"ochi"** next la input pentru a vedea parola
- Verifica dacă se afișează corect

**Alternativ:**
```bash
# Conectează-te de la alt dispozitiv (telefon, etc)
# - Parolă funcționează acolo? → Bug client
# - NU funcționează? → Parolă greșită
```

#### Pas 3: Limba tastaturi
```
Dacă ai mai multe limbi: Verifică limba curentă!
```

**Soluție:**
```
Alt+Shift (Windows) sau Cmd+Space (Mac) pentru a schimba limba
→ Asigură-te ca e ENG / EN US
```

#### Pas 4: Capslock check
```
Aveți CAPS LOCK activ?
→ Parola trebuie cu majuscule corecte!
```

**Soluție:**
- Dezactivați CAPS LOCK (Caps Lock key)
- Verificați iconita capslock din dreapta input-ului

#### Pas 5: Parolă recentă schimbare?
```
Ati schimbat parola? Folosiți parola NOUA!
```

**Dacă ati schimbat foarte recent:**
- Așteptați 1-2 minute
- Parolele vechi se invalidează cu lag

---

### Alt caz: "Parola este obligatorie" (dar nu ati lăsat gol)

**Problemă:** Error din validare vântu

**Pași diagnosis:**

#### Pas 1: Cache issue
```
Ctrl+Shift+Delete → Clear all cookies
Reîncarcă pagina: Ctrl+Shift+R
Încearcă din nou
```

#### Pas 2: JavaScript error
```
F12 → Console tab
Abiți erori roșii? Copiaț message-ul
→ Trimiteți dev team-ului
```

---

## 3. Cont blocat

### Semptom: "Contul dumneavoastră a fost blocat pentru N minute"

**Cauză:** 3+ încercări cu parolă greșită

**Soluție imediată:**

#### Opțiunea 1: Așteptare (15 minute default)
```
⏳ Așteptați N minute
→ Apoi încearcă din nou login
```

**Timpometr:**
```javascript
// F12 → Console
const lockoutUntil = new Date('...'); // din response
const now = new Date();
console.log(`Așteaptă ${Math.ceil((lockoutUntil - now)/60000)} minute`);
```

#### Opțiunea 2: Reset parolă (mai rapid!)
```
1. Click "Parolă uitată?" pe pagina de login
2. Introduceți email-ul
3. Primiți instrucțiuni pe email
4. Resetați parolă
5. Logare cu parolă nouă ✓
```

**Notă:** Link-ul de resetare este valabil **24 ore**

---

### Semptom: Blocat dar și după N minute nu pot intra

**Posibile cauze:**

#### Cauza 1: Reia încercări
```
Ati greșit parola din nou?
→ Se resetează lockout
→ Trebuie așteptare nouă
```

**Soluție:** Utilizați reset password, nu retry-uri

#### Cauza 2: Bug server (rar)
```
Contactări admin dacă:
- Ati așteptat 30+ minute
- Nu merge nici reset password
- Admin vă poate deactiva/reactiva cont
```

---

## 4. Erori server

### Eroare: 502 Bad Gateway

**Semn:**
```
POST /api/auth/login → Response: 502 Bad Gateway
```

**Cauze posibile:**
1. Backend server este down
2. Nginx/reverse proxy issue
3. Database is unavailable

**Pași diagnosis:**

```bash
# Contact admin pentru verify:
sudo systemctl status valyan-clinic-api
sudo systemctl status nginx  # dacă e deployed cu nginx

# Dacă sunt down:
sudo systemctl restart valyan-clinic-api
sudo systemctl restart nginx
```

**Pentru utilizatori:**
- ⏳ Așteptați 5 minute
- 🔄 Reîncarcă pagina
- 📧 Contactați support dacă persistă

---

### Eroare: 500 Internal Server Error

**Semn:**
```
{
  "success": false,
  "errors": [{"code": "INTERNAL_ERROR", "message": "..."}]
}
```

**Cauze posibile:**
1. Exception in LoginCommandHandler
2. Database connection error
3. Token generation error

**Pași diagnosis (Dev/Admin):**

```csharp
// Server logs:
tail -f /var/log/valyan-clinic-api/errors.log

// Căutați:
[ERROR] LoginCommandHandler.Handle()
[ERROR] Exception: ...

// Posibile:
// - DbContext not connected
// - Password hasher failed
// - JWT secret misconfigured
```

**Soluția:**
1. Verifică appsettings.json
2. Verifică connection string
3. Restart API service

---

### Eroare: CORS Policy Denied

**Semn:**
```
Cross-Origin Request Blocked:
The Same Origin Policy disallows reading the remote resource at 
'https://valyan-clinic-api.local/api/auth/login'.
```

**Cauze:** CORS nu e configurat pe backend

**Soluția (Dev):**

```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClinic", policy =>
        policy.WithOrigins("https://valyan-clinic.local")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()); // Important pentru cookies!
});

app.UseCors("AllowClinic");
```

---

## 5. Probleme post-login

### Problem: Login reușit dar nu sunt redirecționat

**Semn:**
```
Response 200 OK, token primit, dar pagina nu se schimbă
```

**Pași diagnosis:**

#### Pas 1: Zustand store update
```javascript
// F12 → Console
localStorage.getItem('auth-storage')
// Ar trebui să returneze:
{
  "state": {
    "user": { /* ... */ },
    "accessToken": "...",
    "isAuthenticated": true
  }
}
```

**Dacă e goală:**
- Store nu s-a updatat
- → Contactați dev team

#### Pas 2: Browser network cookie
```
F12 → Network → re-trigger login
Selectează POST /api/auth/login → Response
Verify "Set-Cookie: refreshToken=..." header
```

**Dacă lipsește:**
- Backend nu trimite refresh token
- → Server configuration issue

#### Pas 3: Router issue
```javascript
// F12 → Console
window.location // Ce URL e acum?
// Ar trebui: https://valyan-clinic.local/dashboard
// Dacă: https://valyan-clinic.local/login
// → Navigate() nu s-a executat
```

**Soluție:**
```javascript
// Am putea manual redirect:
window.location.href = '/dashboard'
```

---

### Problem: Login merge, dar la refresh se deconectează

**Semn:**
```
Login → Redirect to dashboard ✓
Refresh pagina (F5) → Redirecționare la /login
```

**Cauze posibile:**

#### Cauza 1: SessionStorage cleared
```javascript
// F12 → Application → Session Storage
// Vacuumă după refresh?
```

**Check code:**
```typescript
// authStore.ts - verifica storage config
storage: createJSONStorage(() => sessionStorage),
// ✓ Corect: sessionStorage
// ✗ Greșit: localStorage
```

#### Cauza 2: Refresh token invalid
```
Cookie refreshToken e trimis?
Dar request /api/auth/refresh primește 401?
```

**Checklist:**
- [ ] HttpOnly cookie setată corect pe backend
- [ ] Cookie path: `/`
- [ ] Cookie domain: corect

#### Cauza 3: useAuthStore hook nu persist corect
```javascript
// Verifică localStorage:
localStorage.getItem('auth-storage')
// Ar trebui să conțină { state: { user, accessToken, ... } }
```

---

## 📞 Cuando să contactezi support

| Problem | Contactează | Urgent? |
|---------|------------|---------|
| Nu pot intra deloc | support@valyan-clinic.ro | ✓ YES |
| Parolă uitată | support@valyan-clinic.ro | ⚠️ MEDIUM |
| Cont blocat | self-service (așteptare) | ✗ NO |
| Server down (502/500) | admin@valyan-clinic.local | ✓ YES |
| CORS/Network issues | tech-team@valyan-clinic.local | ✓ YES |
| Suspectare compromisare | security@valyan-clinic.ro | 🔴 URGENT |

---

## 🔧 Advanced Debugging (Developers)

### Network request inspection
```bash
# Curl test
curl -X POST https://valyan-clinic.local/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@clinic.ro","password":"MyPass123!"}'

# Verbose output (arată headers, etc)
curl -v -X POST ...
```

### Token decode (JavaScript)
```javascript
// Install: npm install jwt-decode
import { jwtDecode } from 'jwt-decode';

const token = sessionStorage.getItem('auth-storage') 
  |> JSON.parse 
  |> .state.accessToken

const decoded = jwtDecode(token);
console.log(decoded);
// {
//   "sub": "user-id",
//   "email": "doctor@clinic.ro",
//   "role": "doctor",
//   "exp": 1710000000,
//   "iat": 1709949600
// }
```

### Server logs inspection
```bash
# Real-time logs
docker logs -f valyan-clinic-api

# Grep specific login attempts
grep "LoginCommandHandler" /var/log/valyan-clinic/api.log | tail -20

# Error analysis
grep ERROR /var/log/valyan-clinic/api.log | grep -i "auth\|login"
```

---

## 🎯 Checklist final - ce am încercat

- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Hard reload (Ctrl+Shift+R)
- [ ] Different browser (Chrome, Firefox, Edge)
- [ ] Different device (PC, phone)
- [ ] Verified email spelling
- [ ] Verified password (eye icon visible)
- [ ] Keyboard language check (ENG)
- [ ] No caps lock / accidental keys
- [ ] Reset password done
- [ ] Reopened browser
- [ ] Contacted support with details

---

**© 2025 ValyanClinic Troubleshooting Guide**

*Ultima actualizare: 2025-03-08*
