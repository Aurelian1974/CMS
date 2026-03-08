# 🛡️ Ghid Administrator - Pagina de Login

## Prezentare generală

Pagina de login este punctul de intrare pentru întregul sistem medical ValyanClinic. Administratorii trebuie să înțeleagă cum funcționează mecanismul de autentificare și cum să configureze parametrii de securitate.

---

## 📊 Caracteristicile principale

### ✅ Autentificare robustă
- **Validare email/username** - Suporta atât email cât și username
- **Hashing parolă** - Parolele sunt stocate securizat (BCrypt/Argon2)
- **Rate limiting** - Protecție împotriva brute force attacks
- **Account lockout** - Blocare automată după 3 încercări greșite

### 🔐 Securitate
- **JWT Tokens** - Access token (8 ore) + Refresh token (HttpOnly cookie)
- **HTTPS obligatoriu** - Toate conexiunile sunt criptate
- **CORS protecție** - Doar originile autorizate
- **CNAS/GDPR compliant** - Respectă regulamentele din domeniu

### 👤 Gestionarea rolurilor
- **Admin** - Control total
- **Clinic Manager** - Management clinic
- **Doctor** - Acces la pacienți și consulturi
- **Nurse (Infirmieră)** - Acces limitat la pacienți
- **Receptionist** - Gestionare programări

---

## 🔧 Configurare și management

### 1. **Setări de securitate** (Admin Panel)

```
Settings > Security > Authentication
```

**Parametri configurabili:**

| Parametru | Valoare default | Recomandare |
|-----------|-----------------|-------------|
| **Failed login attempts** | 3 | 3-5 |
| **Lockout duration** | 15 min | 15-30 min |
| **Session timeout** | 8 ore | 8-12 ore |
| **Password expiration** | 90 zile | 60-90 zile |
| **Token expiration** | AccessToken: 8h | AccessToken: 8h |
| | RefreshToken: 7 zile | RefreshToken: 7 zile |

### 2. **Rate Limiting**

Protecție împotriva atacurilor brute force:

```
Max 5 încercări pe IP în 15 minute
```

**Configurare (appsettings.json):**

```json
{
  "RateLimiting": {
    "Enabled": true,
    "MaxAttempts": 5,
    "WindowMinutes": 15,
    "LockoutMinutes": 30
  }
}
```

### 3. **Politica de parolă**

**Cerințe pentru parolă sigură:**

- ✓ Lungime: **Minimum 8 caractere**
- ✓ Complexitate: **Majusculă + minusculă + cifră + simbol**
- ✓ Nu poate conține: username, email, date évidente
- ✓ Istorie: **Nu poate refolosi ultimele 5 parolele**

---

## 👤 Gestionare conturi utilizator

### Creere cont nou

```
Admin Panel > Users > Add New User
```

**Date obligatorii:**
- Email unic
- Username (opcional, dar recomandat)
- Nume complet
- Rol
- Clinic asociată

**După creare:**
1. Utilizatorul primește email cu parola temporară
2. La prima autentificare, **va fi forțat să schimbe parola**
3. Va fi solicitat 2-Factor Authentication (dacă activat)

### Dezactivare/Ștergere cont

```
Admin Panel > Users > Select User > Deactivate
```

**Efecte:**
- ❌ Utilizatorul NU mai poate face login
- ✓ Datele rămân în sistem (audit trail)
- ✓ Se pot recupera la reactivare

### Resetare parolă

```
Admin Panel > Users > Select User > Reset Password
```

**Proces:**
1. Admin apasă "Reset Password"
2. Utilizatorul primește email cu link de resetare
3. Link-ul este valid **24 ore**
4. Utilizatorul setează parolă nouă

---

## 🔍 Monitorizare și audit

### Log-uri de autentificare

**Locație:** `ValyanClinic.API/Logs/Authentication.log`

**Informații înregistrate:**
- ✓ Seturi de credențiale utilizate (email/username)
- ✓ Rezultat (success/failure/lockout)
- ✓ IP address
- ✓ Timestamp
- ✓ User agent (browser/client)

**Exemplu log:**

```
[2025-03-08 14:23:15.456] INFO AuthenticationHandler
User: ion.popescu | Email: ion@clinic.ro | Status: SUCCESS | IP: 192.168.1.100 | Role: doctor

[2025-03-08 14:24:32.123] WARN AuthenticationHandler
User: maria.stoian | Email: maria@clinic.ro | Status: FAILED (Invalid password) | IP: 192.168.1.101 | Attempts: 1/3
```

### Dashboard monitorizare

```
Admin Panel > Security > Login Activity
```

**Metrici:**
- Utilizatori activi în această clipă
- Încercări failed în ultimele 24 ore
- Conturi blocate
- IP-uri suspecte
- Accesuri din locații neobișnuite

---

## 🔴 Alertări și notificări

### Conturi blocate (alert automat)

Atunci când un cont este blocat după 3 încercări greșite:

1. **Email notificare** către utilizator
2. **Email notificare** către admin
3. **Log entry** în audit trail
4. **Alert în Admin Dashboard**

### Încercări suspecte

Se detectează și se raportează:
- Atacuri brute force
- Intrări din IP-uri neobișnuite
- Accesuri în afara orelor de lucru
- Software de credential stuffing

---

## 🔗 Integrări tip "Remember Me"

### Cum funcționează

- Client-side: **Zustand store** (sessionStorage)
- Server-side: **Refresh token în HttpOnly cookie**
- **Fără date sensibile** în localStorage
- Refresh automat la reîncărcare pagină

### Dezactivare "Remember me"

```
Settings > Security > Allow Remember Me: OFF
```

---

## 🌍 Single Sign-On (SSO) - viitor

**Planificat pentru versiuni viitoare:**
- ☐ Integration Azure AD / Office 365
- ☐ SAML 2.0 suport
- ☐ OpenID Connect
- ☐ LDAP integration (pentru clinici private)

---

## 📋 Checklist Configurare Sigură

- ☐ Activează HTTPS pe toti domeniile
- ☐ Configurează rate limiting pe API
- ☐ Seteaza politica de parolă (complexitate + expirare)
- ☐ Activează 2-Factor Authentication (dacă disponibil)
- ☐ Configurează email notifications
- ☐ Verifica log-urile zilnic
- ☐ Backup-ează audit trail lunar
- ☐ Testa recovery de urgență (disaster recovery plan)

---

## 🆘 Troubleshooting pentru administratori

### ❓ "Utilizator a uitat parola"
→ Resetează prin Admin Panel (link de resetare de 24h)

### ❓ "Utilizator este blocat"
→ Așteptă 15 minute sau dezactiveaza/reactiveaza contul

### ❓ "Rate limiter blochează login"
→ Verifica IP-ul în config, eventual dezactiveaza temporar pentru debugging

### ❓ "Token JWT expirat (401 Unauthorized)"
→ Client trebuie să utilizeze Refresh Token endpoint

---

## 📞 Contact support internă

- **Dev Team:** tech-support@valyan-clinic.local
- **Docs:** /docs/authentication (în repo)
- **GitHub Issues:** /ValyanClinic/Issues

---

**© 2025 ValyanClinic. Documentație administrativă internă.**
