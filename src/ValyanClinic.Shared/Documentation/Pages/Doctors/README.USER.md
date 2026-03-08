# 👤 Ghid Utilizator - Pagina Medici

## 🎯 Ce faci pe pagina asta?

Pagina Medici te ajută să **gestionezi baza de date cu medicii clinicii** - adaugi noi medici, cauți, editezi, ștergi, exportezi date.

### Acțiuni principale
- ➕ Adaugă medic nou
- 🔍 Caută și filtrează
- ✏️ Editează informații
- 👁️ Vizualizează detalii
- 🗑️ Șterge medic
- 📊 Export Excel
- 📈 Statistici

---

## 📍 Accesare pagina

### Pas 1: Deschide aplicația
```
1. Deschide browser
2. Mergi la: https://clinic.local
3. Login cu username + password
```

### Pas 2: Navigă la Medici
```
1. Sidebar stânga
2. Click pe "Medici" (sub Resurse Umane)
   sau "Resources > Doctors"
3. Apare pagina lista medici
```

### Pas 3: Check permisiuni
- ✅ Poți **vizualiza** = ai minimum Level 1
- ✅ Poți **crea/edita** = ai minimum Level 2
- ✅ Poți **șterge** = ai minimum Level 3
- ✅ Poți **export** = ai minimum Level 4

---

## ➕ Adăugare medic nou

### Scenar: Vrei să registrezi Dr. Ion Popescu

**Pas 1: Click buton **Adaug****
```
Stânga sus: Buton albastru "+ Adaug medic"
Click → Deschide modal Formular
```

**Pas 2: Completeaza Informații Personale**
```
Câmp         | Exemplu         | Obligatoriu
─────────────────────────────────────────────
Prenume      | Ion             | ✓ YES
Nume         | Popescu         | ✓ YES
Email        | ion.pop@email.co | ✓ YES (unic!)
Telefon      | +40721234567    | - optional
```

**Pas 3: Selectează Departament**
```
Dropdown "Departament"
Opțiuni: Cardiologie, Neurologie, etc.
Selectează departamentul unde lucrează
```

**Pas 4: Selectează Specialitate (cascada)**
```
Dropdown "Specialitate (nivel 1)"
Opțiuni: se umple după selectarea departamentului
Exemplu: Cardiologie → arată nur sub-specialități cardiologie
```

**Pas 5: Selectează Sub-specialitate**
```
Dropdown "Sub-specialitate (nivel 2)"
Apare după selectarea Specialității
Exemplu: Interventional Cardiology
```

**Pas 6: Selectează Titlu Medical**
```
Dropdown "Titlu Medical"
Opțiuni: Doctor, Medic rezident, Medic asistent etc.
Doar titluri de tip MEDIC
```

**Pas 7: Selectează Medic Supervisor (optional)**
```
Dropdown "Medic Primar / Supervisor"
Selectează doctor mai senior care supervision-ează
Fie lasi gol dacă e department head
```

**Pas 8: Adauga Date Medicale**
```
Câmp                | Exemplu      | Obligatoriu
──────────────────────────────────────────────
Cod Medical (Parafa)| POPESCU.ION  | - optional
Nr. Licență CMR     | A-123456     | - optional
Data Expirare CMR   | 2024-12-31   | - optional
```

**Pas 9: Selectează Status**
```
Toggle "Activ"
ON (default) = doctor activ în sistem
OFF = doctor inactiv (concediu, plecat etc)
```

**Pas 10: Salvează**
```
Click buton albastru "Salvează"
→ Validare formular
→ Salvare în DB
→ Modal se inchide
→ Medic apare în lista
```

### Error posibile

| Error | Motiv | Soluție |
|-------|-------|---------|
| ❌ Email duplicate | Email deja exista | Folosește alt email |
| ❌ Departament invalid | Nu-ti ai acces | Contact admin |
| ❌ Supervisor invalid | Doctor supervisor sters | Selectează alt supervisor |
| ❌ Campo gol | Obligatoriu necompletate | Umple "Prenume" + "Nume" + "Email" |

---

## 🔍 Căutare și Filtrare

### Scenar: Cauți "Dr. Andrei"

**Pas 1: Deschide filtrul**
```
Sus pagina: Search box "Cauta medic..."
Click → se activează
```

**Pas 2: Scrie cuvânt cheie**
```
Tipează: "Andrei"
Tabel se auto-refill LIVE
(debounce 500ms - asteapta 0.5 sec după typing)
```

**Pas 3: Se-ntoarce rezultatele**
```
Rânduri cu Andrei în:
- Prenume
- Nume
- Email
- Cod medical
```

### Cautare avansată (cu filtre)

| Filtru | Unde | Opțiuni |
|--------|------|---------|
| **Departament** | Dropdown | Cardiologie, Neurologie, etc. |
| **Specialitate** | Dropdown | Interventional, Non-invasive, etc. |
| **Status** | Toggle | Activ / Inactiv |

**Pas: Aplică filtre**
```
1. Click dropdown "Departament"
2. Selectează "Cardiologie"
3. Tabel arată nur doctori din Cardiologie
4. Click "Resetează filtre" pentru restart
```

### Reset
```
Click buton "🔄 Resetează filtre"
→ Curat search box
→ Întoarce toate criticele
```

---

## ✏️ Editare medic

### Scenar: Update email Dr. Popescu

**Pas 1: Cauta medicul**
```
Search "Popescu" → apare în lista
```

**Pas 2: Click rând doctor**
```
Row expand: apare "Dr. Ion Popescu, Cardiologie"
```

**Pas 3: Click buton "✏️ Editează"**
```
ActionButtons din dreapta
Click "Edit" (al doilea buton)
→ Deschide modal cu date pre-populate
```

**Pas 4: Modifica câmp**
```
Email: ion.pop@email.com -> ion.popescu@hospital.ro
Alte câmpuri: la fel
```

**Pas 5: Click "Salvează"**
```
Validator: check email format, required fields
Save: POST /api/doctors/{id}
Modal close, lista refresh cu date noi
```

### Ce NU poți edita?
```
❌ Email - NU poți schimba
   (este ID unic în sistem)
❌ Cod Medical (Parafa)
   (dacă medic are consultații active)
```

---

## 👁️ Vizualizare detalii

### Scenar: Vrei să vezi toată history Dr. Popescu

**Pas 1: Click doctor din lista**
```
Rând cu Ion Popescu
Click pe "👁️ Detalii"
```

**Pas 2: Modal read-only se deschide**
```
Toate date medic (NU poți edita)
Inclusiv: createdAt, updatedAt, audit trail
```

**Pas 3: Istoric schimbări**
```
Tabel special "Audit Log"
Arată: cine a modificat ce și când
Ex: 2025-03-08 10:30 - Ion (admin) schimbă email
    2025-03-08 09:15 - Elena (hr) adauga medic
```

**Pas 4: Inchide**
```
Click "X" or click outside modal
```

---

## 🗑️ Ștergere medic

### Scenar: Dr. Popescu pleacă din clinică

**Pas 1: Cauta medicul**
```
Search "Popescu" → hit
```

**Pas 2: Click "🗑️ Șterge"**
```
ActionButtons dreapta
Click "Delete" (icon 🗑️)
```

**Pas 3: Confirma ștergere**
```
Dialog popup: "Sigur ștergi Dr. Ion Popescu?"
Butoane: 
  - "Ștergere" (red) - confirm
  - "Anulare" - cancel
```

**Pas 4: Ștergere se execută**
```
Soft delete: medic marchează isDeleted = true
HID din lista dare normala
Data de ștergere: saved în DB pentru audit
```

### Ștergere NU poți dacă:
```
❌ Medic are consultații active
❌ Medic are prescripții active
❌ Medic are pacienti sub supervizare
→ Aceste constrain-uri au sens medical/legal
```

### Alternativă la ștergere:
```
✅ Deactivare: Editează → toggle OFF "Activ"
   (Medic dispare din lista active, dar rămâne în DB)
```

---

## 📊 Export Excel

### Scenar: Vrei raport cu toți medicii

**Pas 1: Click "📊 Export Excel"**
```
Dreapta sus: buton "Export Excel"
Click → Dialog se deschide
```

**Pas 2: Selectează coloane**
```
Checkboxes pentru:
☑ Nume
☑ Email
☑ Telefon
☑ Departament
☑ Specialitate
☑ Status
☑ Data Înregistrare
(Select all / Deselect all options)
```

**Pas 3: Click "Exportă"**
```
File download inițiat
Format: XLSX (Excel modern)
Filename: Doctors_2025-03-08.xlsx
```

**Pas 4: Deschide în Excel**
```
Downloads folder
Double-click file
Excel se deschide
Preformatare automată cu headere
```

### Ce conține export?
```
Coloană 1: Prenume
Coloană 2: Nume
Coloană 3: Email
Coloană 4: Telefon
Coloană 5: Departament
Coloană 6: Specialitate
Coloană 7: Licență CMR
Coloană 8: Expiry Date
Coloană 9: Status (Activ/Inactiv)
...
```

---

## 📈 Statistici dashboard

### Sus pagina, card-uri cu metrici:

| Metric | Descriere | Actualizare |
|--------|-----------|------------|
| **👨‍⚕️ Total Medici** | Count toți medicii (activi + inactivi) | Live |
| **✅ Medici Activi** | Count nur medicii cu isActive = true | Live |
| **⏰ Licență Expiring** | Count medici cu CMR expiring < 60 zile | Live |
| **🎓 Per Specialitate** | Breakdown count per specialitate | Live |

---

## 📱 Tabel - Coloane și Funcționalități

### Coloane afișate

| Coloană | Descriere | Sortabil |
|---------|-----------|----------|
| **Medic** | Prenume + Nume + initiale avatar | ✓ Yes |
| **Email** | Email address link | ✓ Yes |
| **Telefon** | Phone number cu international format | - |
| **Departament** | Dept name cu color badge | ✓ Yes |
| **Specialitate** | Primary specialty | ✓ Yes |
| **Titlu Medical** | Doctor, Rezident, etc. | ✓ Yes |
| **CMR Expire** | License expiry date cu indicator | ✓ Yes |
| **Status** | Activ (green) / Inactiv (gray) | ✓ Yes |
| **Acțiuni** | Edit, Delete, Details buttons | - |

### Sortare
```
Click pe header coloană → sort ascending
Click din nou → sort descending
Click X → clear sort
```

### Paginație
```
Jos pagina: "Page 1 of 5" indicator
Next / Previous buttons
Go to page: input box de tip "5 out of 20 rows"
```

---

## 🎨 UI Elements Explained

| Element | Tip | Acțiune |
|---------|-----|--------|
| 🔵 Buton albastru | Primary button | Actiune principă (Add, Save, Export) |
| ⚪ Buton gri | Secondary button | Cancel, Close |
| 🔴 Buton roșu | Destructive button | Delete, che-i irevocabil |
| 🟢 Toggle ON | Activ | Status = enabled |
| ⚫ Toggle OFF | Inactiv | Status = disabled |
| 🔶 Badge | Status indicator | Active, Expiring soon |
| ⚠️ Warning | Alert | Email duplicate, validation error |

---

## ⌨️ Scurțături Keyboard

| Shortcut | Acțiune |
|----------|--------|
| `Ctrl + N` | Deschide form Adaug medic |
| `Ctrl + F` | Focus search box |
| `Escape` | Inchide modal |
| `Tab` | Navigate form fields |
| `Enter` | Submit form |

---

## 🔒 Permisiuni - Ce poți face?

### Role: Receptionist (Level 2)
- ✅ Vizualizează medici
- ✅ Adauga medic nou
- ✅ Editează date
- ❌ Șterge medic
- ❌ Export Excel
- ❌ Access audit logs

### Role: Doctor (Level 3)
- ✅ Vizualizează medici
- ✅ Adauga medic nou
- ✅ Editează date
- ✅ Șterge medic (cu constrain-uri)
- ❌ Export Excel
- ❌ Access configuration

### Role: Administrator (Level 4)
- ✅ Vizualizează medici
- ✅ Adauga medic nou
- ✅ Editează date
- ✅ Șterge medic
- ✅ Export Excel
- ✅ Access audit logs
- ✅ Configurare permisiuni

---

## 💡 Tips & Tricks

### Optimize search
```
"Ion" → slow (many Ions)
"Ion Popescu" → fast (fewer matches)
"ion.pop@email.com" → fastest (email unique)
"P050312" → medical code search
```

### Bulk deactivate
```
NU poti deactivate multi din once
Deactivează individual: Edit → toggle OFF
```

### Supervisor hierarchy
```
Department Head: no supervisor
Team lead: supervised by Dept Head
Junior doctor: supervised by Team lead
Verifică: cascading selection e corect
```

### License expiry warnings
```
🔴 Red badge = EXPIRED (action needed)
🟠 Orange badge = <60 days (fix soon)
🟢 Green badge = > 60 days (OK)
```

---

## 🆘 Common Issues

### "Email duplicate" error
```
Problem: Nici un error pe screen dar nu save-aza
Cauza: Email deja folosit alt doctor
Soluție: Schimba email, ex: ion.popescu2@email.com
```

### "No access" error
```
Problem: Button "Adaug" dezactivat
Cauza: Nu ai permisie Doctors > Create (Level 2+)
Soluție: Contact admin ca sa iti do permisii
```

### Search nu merge
```
Problem: Tipez "Ion" dar nu apare
Cauza: Debounce delay (500ms) or eroare network
Soluție: Asteapta 1 sec, refresh pagina (F5), retry
```

### Export blank file
```
Problem: Download file dar nu conține date
Cauza: Network interrupt or permission issue
Soluție: Retry, check internet connection
```

---

## 📞 Contact Support

| Caz | Contact |
|-----|---------|
| Docstring necomplet | docs@valyan-clinic.local |
| Bug în pagina | Github Issues `#doctors-page` |
| Feedback | feedback@valyan-clinic.ro |
| Urgent sos | IT Team Slack |

---

**© 2025 ValyanClinic. Ghid utilizator confidențial.**

*Ultima actualizare: 2025-03-08*
