# ❓ FAQ - Întrebări frecvente despre Login

## Autentificare și credențiale

### Q1: Pot folosi atât email cât și username pentru login?
**A:** Da! Sistemul acceptă ambele:
- ✓ Email: `doctor@valyan-clinic.ro`
- ✓ Username: `ion.popescu`

Folosiți oricare aveți la dispoziție. Administratorul vă poate configura ambele.

---

### Q2: Care este parola temporară primită inițial?
**A:** 
1. Administratorul creează contul și **vă trimite email** cu parolă temporară
2. La prima autentificare, sistemul **vă obligă să o schimbați**
3. Parola nouă trebuie să fie unică și puternică

> 💡 **Sfat:** Salvați unde sigur (password manager) pentru a nu o uita

---

### Q3: De ce nu mă pot autentifica deși știu parola?
**A:** Verificați în ordinea asta:

1. **Tastatura și limba:**
   - Sunt în limba ENGLEZĂ?
   - Sunt majuscule/minuscule corecte?

2. **Spații în plus:**
   - Aveți spații la început/final în email?
   - Copiaț direct de unde atiți salvat

3. **Caps Lock:**
   - Apăsați iconița ochiului pentru a vedea parola
   - Verificați dacă sunt caractere corecte

4. **Prea multe încercări:**
   - Ați încercat mai mult de 3 ori cu parolă greșită?
   - Contul este **blocat pentru 15 minute**
   - Așteptați și încercați din nou

5. **Resetare parolă:**
   - Dacă nu vă amintesc, click "Parolă uitată?"
   - Primiți email cu instrucțiuni

---

### Q4: Cum schimb parola?
**A:** După login:

1. Mergeți în **Setări** (roată dințată în dreapta sus)
2. Selectați **"Schimbare Parolă"**
3. Introduceți parola actuală
4. Introduceți parola nouă **de 2 ori** (trebuie să se potrivească)
5. Click **"Salvează"**

Parola se schimbă imediat.

---

### Q5: Care sunt 'cerințele pentru o parolă sigură?
**A:** Parola trebuie să aibă **minim 8 caractere** și să combine:

✓ Litere mari (A-Z)  
✓ Litere mici (a-z)  
✓ Cifre (0-9)  
✓ Simboluri (!@#$%^&*)  

**Exemple bune:**
- `DoctorPacient2025!`
- `Clinic@SecurePass123`
- `ValyanMedical#2025`

**Exemple RELE:**
- ❌ `123456` (prea simplu)
- ❌ `parola` (fără cifre/simboluri)
- ❌ `Admin2025` (fără simbol)
- ❌ `doctor` (username-ul dumneavoastră!)

---

## Securitate și confidențialitate

### Q6: Este sigur să mă conectez de pe telefon?
**A:** 
- ✅ **DA**: Dacă folosiți WiFi **securizat** acasă
- ✅ **DA**: Dacă folosiți conexiune mobilă (4G/5G)
- ❌ **NU**: WiFi public (aeroporturi, baruri)

**Sfat:** Dacă trebuie WiFi public, folosiți **VPN**.

---

### Q7: Pot folosi același calculator pentru mai mulți utilizatori?
**A:** NU recomandăm! Dar dacă trebuie:

1. Dezactivați **"Ține-mă autentificat"**
2. **OBLIGATORIU**: Click **"Logout"** la end
3. Următorul utilizator se conectează

⚠️ **Atenție:** Dacă uitați logout și plecați, oricine poate accesa datele pacienților!

---

### Q8: Ce înseamnă "Ține-mă autentificat"?
**A:** 
- ✓ Bifând, rămâneți conectat **mai mult timp**
- ✓ Nu trebuie să vă reautentificați la reîncărcare pagină
- ❌ Instrumentele tale rămân in **sesiune activă** pe calculator

**Recomandare:**
- ✓ Sigur acasă sau birou personal
- ❌ NU pe calculatoare publice

---

### Q9: Ce se întâmplă dacă nu mă mai conectez 8 ore?
**A:** Sesiunea **expiră automat**. 

La următorul click:
1. Sistemul vă reentrează la login
2. Apare mesaj: "Sesiunea a expirat"
3. Vă reautentificați

> 💡 Aceasta este o măsură de **securitate** — chiar dacă uitați să va delogați.

---

### Q10: De ce nu apare parolă în localStorage?
**A:** Din motive de **securitate**:

- ✅ Parolă NICIODATĂ stocată local
- ✅ Token stocat în **sessionStorage** (expiră la închiderea browser)
- ✅ Refresh token în **HttpOnly cookie** (inaccesibil din JS)

Aceasta previne **XSS attacks** și **data theft**.

---

## Probleme și erori

### Q11: "Contul dumneavoastră nu este activ"
**A:** Administratorul a **dezactivat contul**. 

**Soluție:**
1. Contactați administratorul
2. Solicitați reactivare
3. Vi se va trimite confirmarea prin email

---

### Q12: "Contul dumneavoastră este blocat pentru N minute"
**A:** Ati încercat **mai mult de 3 ori cu parolă greșită**.

**Acțiune:**
- ⏳ Așteptați N minute (default 15 min)
- 🔄 Apoi încercați din nou
- 🆘 Sau resetați parolă prin "Parolă uitată?"

---

### Q13: "Eroare de conexiune la server"
**A:** Posible cauze:

1. **Internet deconectat?**
   - Verificați conexiunea WiFi/4G

2. **Server down?**
   - Contactați IT support
   - Verificați `status.valyan-clinic.ro`

3. **HTTPS certificate expirat?**
   - NU ignora avertismentul
   - Contactați admin

4. **Firewall/Proxy blocare?**
   - În rețea corporativă?
   - Contactați IT internal

---

### Q14: Mi-ar trebui 2FA (Two-Factor Authentication)?
**A:** În **versiunea curentă (1.0)**: NU (planificat viitor)

Dar strategia de viitor:
- 📱 SMS code
- 📧 Email verification
- 🔑 Authenticator app (Google, Microsoft)
- 🔐 Biometric (fingerprint, face ID)

---

### Q15: Pot folosi parolă goală?
**A:** **NU!** Sistemul necesită:
- ✓ Minim 1 caracter
- ✓ Validare obligatorie
- ✓ Eroare dacă e goală: "Parola este obligatorie"

---

## Integrații și flux

### Q16: Se sincronizează login cu aplicația mobilă?
**A:** 
- ✅ **Aceeași credențiale** (email + parolă)
- ✅ **Aceleași permisiuni** și date
- ❌ **Sesiuni separate** (trebuie login pe ambele)

> 💡 Advisabled: Aceeași parolă pentru ambele

---

### Q17: Datele mele de login sunt stocate undeva?
**A:**
- ❌ Parolă: **NICIODATĂ**
- ✅ Email: **În bază date** (hash-at cu BCrypt)
- ✅ Access Token: **sessionStorage** (temporar)
- ✅ Refresh Token: **HttpOnly cookie** (protejat)

---

### Q18: Pot exporta/salva datele de login pentru backup?
**A:** 
- ❌ **NU** copiaț parola în fișiere text, email, etc.
- ✅ Salvaț-o în **password manager** (LastPass, 1Password, Bitwarden)
- ✓ Password manager-ul o criptează automat

---

### Q19: Ce se întâmplă dacă o colegă se conectează pe calculatorul meu?
**A:**
1. **IMEDIAT dezactivați sesiunea:**
   - Daț logout
   - Sau contactați admin pentru "revoke sesiune"

2. **ÎN SIGURANȚĂ, schimbați parola:**
   - Settimgs > Schimbare Parolă
   - Parolă NOUă, tare

3. **Raportați:**
   - Contactați administratorul
   - Menționați ora aproximativă

---

### Q20: Cum raportez o problemă de securitate?
**A:** 
1. **NU** postați pe Slack/Teams
2. **NU** puneți în chat de grup
3. **CONTACT DIRECT:**
   - 📧 security@valyan-clinic.ro
   - 📞 +40 XXX XXX-XXXX (direct admin)
   - ⏰ Urgent/confidențial

---

## Documente și politici

### Q21: Unde găsesc politica de confidențialitate?
**A:** 
- 🌐 **Website:** valyan-clinic.ro/privacy
- 📱 **În app:** Settings > Privacy Policy
- 📧 **Email:** legal@valyan-clinic.ro

---

### Q22: Care este politica de retenție de date?
**A:**
- **Log-uri:** 90 zile (apoi șterse automat)
- **Datele personale:** Se păstrează cât e contul activ
- **După deactivare:** Se pastreaza pentru audit (compliant cu legea)

---

### Q23: Cine vede log-urile de login?
**A:**
- ✓ Administratori (doar ai lor)
- ✓ Persoane cu permisiune "Audit"
- ❌ Colegii NU vod log-ul tău
- ❌ Managerii nu vad parolele

---

## Suport și ajutor

### Q24: Cărui contact ii scriu daca nui întreb caz specific?
**A:**

| Problemă | Contact | Timp răspuns |
|----------|---------|---|
| **Nu pot face login** | support@valyan-clinic.ro | < 1 oră |
| **Parolă uitată** | support@valyan-clinic.ro | < 30 min |
| **Cont blocat** | support@valyan-clinic.ro | Instant (self-service 15 min) |
| **Suspiciunea de hacking** | security@valyan-clinic.ro | Urgent |
| **Bug/eroare tehnică** | tech-team@valyan-clinic.local | < 2 ore |

---

### Q25: Ce informații NU trebuie să dau în suport?
**A:** **NICIODATĂ** dati:
- ❌ Parola (nici la admin!)
- ❌ Token-uri (JWT, refresh token)
- ❌ API keys
- ❌ Personal ID/SSN

**În schimb, dati:**
- ✓ Email login
- ✓ Mesajul de eroare exact
- ✓ Timestamp (ora aproximativă)
- ✓ Browser + OS (Chrome pe Windows, etc.)

---

## Feedback și sugestii

### Q26: Cum pot sugera o îmbunătățire pentru login?
**A:**
1. **Email:** feedback@valyan-clinic.ro
2. **GitHub:** Issues tag "feature-request"
3. **Slack:** #suggestions (internal)

Vă vom lua in considerare la viitoarele versiuni! 🙌

---

**© 2025 ValyanClinic. FAQ Documentation.**  
**Ultima actualizare:** 2025-03-08
