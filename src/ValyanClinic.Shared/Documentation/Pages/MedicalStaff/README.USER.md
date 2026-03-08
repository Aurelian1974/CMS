# 👤 Ghid Utilizator - Pagina Personal Medical

## 🎯 Ce faci pe pagina asta?

Pagina Personal Medical te ajută să **gestionezi staff clinic non-doctor** - infirmieri, asistenți, laboranți, etc. Adaugi, cauți, editezi, ștergi, exportezi date staff.

### Acțiuni principale
- ➕ Adaugă staff nou
- 🔍 Caută și filtrează
- ✏️ Editează informații
- 👁️ Vizualizează detalii
- 🗑️ Șterge staff
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

### Pas 2: Navigă la Personal Medical
```
1. Sidebar stânga
2. Click pe "Personal Medical" (sub Resurse Umane)
   sau "Resources > Medical Staff"
3. Apare pagina lista staff
```

### Pas 3: Check permisiuni
- ✅ Poți **vizualiza** = ai minimum Level 1
- ✅ Poți **crea/edita** = ai minimum Level 2
- ✅ Poți **șterge** = ai minimum Level 3
- ✅ Poți **export** = ai minimum Level 4

---

## ➕ Adăugare staff medical nou

### Scenar: Vrei să registrezi Ionela Popescu (infirmieră)

**Pas 1: Click buton "+ Adaug staff"**
```
Sus stânga: Buton albastru "+ Adaug"
Click → Deschide modal Formular
```

**Pas 2: Completeaza Informații Personale**
```
Câmp         | Exemplu         | Obligatoriu
─────────────────────────────────────────────
Prenume      | Ionela          | ✓ YES
Nume         | Popescu         | ✓ YES
Email        | ionela@clinic.co| ✓ YES (unic!)
Telefon      | +40721234567    | - optional
```

**Pas 3: Selectează Departament**
```
Dropdown "Departament"
Opțiuni: Cardiologie, Urgență, Laborator, etc.
Selectează departamentul alocat
Optional (dacă e staff "floating")
```

**Pas 4: Selectează Titlu Medical**
```
Dropdown "Titlu Medical"
Opțiuni: Infirmieră, Asistent, Laborant, etc.
Select relevant job title
```

**Pas 5: Selectează Doctor Supervizor (optional)**
```
Dropdown "Doctor Supervizor"
Selectează doctor care supervision-ează staff
Fie lasi gol dacă nu-i cazul
```

**Pas 6: Selectează Status**
```
Toggle "Activ"
ON (default) = staff activ în sistem
OFF = staff inactiv (concediu, plecat etc)
```

**Pas 7: Salvează**
```
Click buton albastru "Salvează"
→ Validare formular
→ Salvare în DB
→ Modal se inchide
→ Staff apare în lista
```

### Error posibile

| Error | Motiv | Soluție |
|-------|-------|---------|
| ❌ Email duplicate | Email deja exista | Folosește alt email |
| ❌ Departament invalid | Nu exista sau fără acces | Contact admin |
| ❌ Campo gol | Obligatoriu necompletate | Umple "Prenume" + "Nume" + "Email" |

---

## 🔍 Căutare și Filtrare

### Scenar: Cauți "Ionela"

**Pas 1: Deschide search box**
```
Sus pagina: Search box "Cauta staff..."
Click → se activează
```

**Pas 2: Scrie cuvânt cheie**
```
Tipează: "Ionela"
Tabel se auto-refill LIVE
(debounce 500ms - asteapta 0.5 sec)
```

**Pas 3: Se-ntoarce rezultatele**
```
Rânduri cu Ionela în:
- Prenume
- Nume
- Email
- Titlu Medical
```

### Filtrare avansată

| Filtru | Unde | Opțiuni |
|--------|------|---------|
| **Departament** | Dropdown | Urgență, Laborator, etc. |
| **Titlu Medical** | Dropdown | Infirmieră, Asistent, etc. |
| **Status** | Toggle | Activ / Inactiv |

**Pas: Aplică filtre**
```
1. Click dropdown "Departament"
2. Selectează "Urgență"
3. Tabel arată nur staff din Urgență
4. Click "Resetează filtre" pentru restart
```

---

## ✏️ Editare staff

### Scenar: Update email Ionela Popescu

**Pas 1: Cauta staff**
```
Search "Popescu" → apare în lista
```

**Pas 2: Click rând staff**
```
Row expand: apare "Ionela Popescu, Infirmieră"
```

**Pas 3: Click buton "✏️ Editează"**
```
ActionButtons din dreapta
Click "Edit" button
→ Deschide modal cu date pre-populate
```

**Pas 4: Modifica câmp**
```
Email: ionela@clinic.com → ionela.popescu@hospital.ro
Alte câmpuri: la fel
```

**Pas 5: Click "Salvează"**
```
Validator: check email format, required fields
Save: PUT /api/medicalStaff/{id}
Modal close, lista refresh
```

---

## 👁️ Vizualizare detalii

### Scenar: Vrei să vezi detalii Ionela

**Pas 1: Click doctor din lista**
```
Rând cu Ionela Popescu
Click pe "👁️ Detalii"
```

**Pas 2: Modal read-only se deschide**
```
Toate date staff (NU poți edita)
Inclusiv: createdAt, updatedAt, audit trail
```

**Pas 3: Inchide**
```
Click "X" or click outside modal
```

---

## 🗑️ Ștergere staff

### Scenar: Ionela pleacă din clinică

**Pas 1: Cauta staff**
```
Search "Popescu" → hit
```

**Pas 2: Click "🗑️ Șterge"**
```
ActionButtons dreapta
Click "Delete"
```

**Pas 3: Confirma ștergere**
```
Dialog popup: "Sigur ștergi Ionela Popescu?"
Butoane: 
  - "Ștergere" (red) - confirm
  - "Anulare" - cancel
```

**Pas 4: Ștergere se execută**
```
Soft delete: staff marcată isDeleted = true
HID din lista
Data de ștergere: saved în DB
```

### Alternativă la ștergere:
```
✅ Deactivare: Editează → toggle OFF "Activ"
   (Staff dispare din lista active, dar rămâne în DB)
```

---

## 📊 Export Excel

### Scenar: Vrei raport cu tot personalul

**Pas 1: Click "📊 Export Excel"**
```
Dreapta sus: buton "Export Excel"
Click → Dialog se deschide
```

**Pas 2: Selectează coloane**
```
Checkboxes pentru:
☑ Prenume
☑ Nume
☑ Email
☑ Telefon
☑ Departament
☑ Titlu Medical
☑ Doctor Supervizor
☑ Status
(Select all / Deselect all options)
```

**Pas 3: Click "Exportă"**
```
File download inițiat
Format: XLSX (Excel modern)
Filename: MedicalStaff_2025-03-08.xlsx
```

**Pas 4: Deschide în Excel**
```
Downloads folder
Double-click file
Excel se deschide
Preformatare automată
```

---

## 📈 Statistici dashboard

### Sus pagina, card-uri cu metrici:

| Metric | Descriere | Actualizare |
|--------|-----------|------------|
| **👥 Total Staff** | Count toți (activi + inactivi) | Live |
| **✅ Staff Activ** | Count nur activi (isActive = true) | Live |
| **📊 Per Departament** | Breakdown count per dept | Live |
| **🎓 Per Titlu** | Breakdown count per job title | Live |

---

## 📱 Tabel - Coloane și Funcționalități

### Coloane afișate

| Coloană | Descriere | Sortabil |
|---------|-----------|----------|
| **Staff** | Prenume + Nume + initiale avatar | ✓ Yes |
| **Email** | Email address link | ✓ Yes |
| **Telefon** | Phone number | ✓ No |
| **Departament** | Dept name | ✓ Yes |
| **Titlu** | Job title (Infirmieră, etc) | ✓ Yes |
| **Supervizor** | Doctor name (optional) | ✓ No |
| **Status** | Activ (green) / Inactiv (gray) | ✓ Yes |
| **Acțiuni** | Edit, Delete, Details | - |

### Sortare
```
Click pe header coloană → sort ascending
Click din nou → sort descending
```

### Paginație
```
Jos pagina: "Page 1 of X" indicator
Next / Previous buttons
20 rows per page (default)
```

---

## 🎨 UI Elements Explained

| Element | Tip | Acțiune |
|---------|-----|--------|
| 🔵 Buton albastru | Primary button | Actiune (Add, Save) |
| ⚪ Buton gri | Secondary button | Cancel, Close |
| 🔴 Buton roșu | Destructive | Delete |
| 🟢 Toggle ON | Activ | Status = enabled |
| ⚫ Toggle OFF | Inactiv | Status = disabled |

---

## ⌨️ Scurțături Keyboard

| Shortcut | Acțiune |
|----------|--------|
| `Ctrl + N` | Deschide form Adaug staff |
| `Ctrl + F` | Focus search box |
| `Escape` | Inchide modal |
| `Tab` | Navigate form fields |
| `Enter` | Submit form |

---

## 🔒 Permisiuni - Ce poți face?

### Role: Receptionist (Level 2)
- ✅ Vizualizează staff
- ✅ Adauga staff nou
- ✅ Editează date
- ❌ Șterge staff
- ❌ Export Excel

### Role: Doctor (Level 3)
- ✅ Vizualizează staff
- ✅ Adauga staff nou
- ✅ Editează date
- ✅ Șterge staff
- ❌ Export Excel

### Role: Administrator (Level 4)
- ✅ Vizualizează staff
- ✅ Adauga staff nou
- ✅ Editează date
- ✅ Șterge staff
- ✅ Export Excel

---

## 💡 Tips & Tricks

### Optimize search
```
"Ion" → slow (many results)
"Popescu" → better
"ionela.popescu@clinic.com" → fastest (unique)
```

### Bulk operations
```
NU poti bulk-select staff
Operații individual: Edit, Delete
```

### Staff assignment
```
Not required: Department + Supervisor
Optional pentru: "floating" staff
Required: Email + Name
```

---

## 🆘 Common Issues

### "Email duplicate" error
```
Problem: Nici un error pe screen dar nu save-aza
Cauza: Email deja folosit alt staff
Soluție: Schimba email
```

### "No access" error
```
Problem: Button "Adaug" dezactivat
Cauza: Level 2+ required
Soluție: Contact admin upgrade
```

### Search nu merge
```
Problem: Tipez "Ionela" dar nu apare
Cauza: Debounce delay (500ms) or error
Soluție: Asteapta 1 sec, refresh (F5)
```

---

## 📞 Contact Support

| Caz | Contact |
|-----|---------|
| Documentation | docs@valyan-clinic.local |
| Bug | GitHub Issues `#medical-staff` |
| Feedback | feedback@valyan-clinic.ro |

---

**© 2025 ValyanClinic. Ghid utilizator confidențial.**

*Ultima actualizare: 2025-03-08*
