# 👤 Ghid Utilizator - Pagina Pacienți

## Bine ai venit!

Aceasta este pagina de gestionare a pacienților. Aqui poți adăuga pacienți noi, căuta și edita informații existente.

---

## 📋 Cum să adaugi un pacient nou

### Pas 1: Deschide formularul
```
Click butonul verde "✚ Pacient nou" (dreapta sus)
```

### Pas 2: Completează informații personale

**Campuri obligatorii (cu *):**
- **Nume complet** - Prenume și Nume (ex: "Ion Popescu")
- **CNP** - 13 cifre (ex: "1850312123456")
- **Data nașterii** - Calendar picker sau manual (DD.MM.YYYY)
- **Gen** - Selectează din dropdown (Masculin / Feminin / Altul)
- **Medic primar** - Selectează doctor din listă

**Campuri opționale:**
- Telefon principal
- Telefon secundar
- Email
- Adresă (stradă, nr.)
- Oraș / Județ / Cod poștal

### Pas 3: Adaugă detalii medicale

**Grup sanguín:**
- Selectează din: O+, O-, A+, A-, B+, B-, AB+, AB-

**Alergii (opțional):**
1. Click "✚ Adaugă alergie"
2. Selectează tip alergie (Medicamente, Alimente, Alte)
3. Introduceți substanța (ex: "Penicilină")
4. Severitate: Critică / Ridicată / Medie / Scăzută
5. Click "+ Alergie" pentru a adăuga mai mult

**Boli cronice (opțional):**
- Introduceți text: "Diabet tip 2, Hipertensiune"

**Note:**
- Orice informații suplimentare (ex: "Fobic la seringi")

### Pas 4: Informații asigurare (opțional)

```
☐ Pacient asigurat?  [Bifează dacă da]
    ↓
Număr asigurare: [123456789]
Valabilă până: [Selectează dată]
```

### Pas 5: Salvează

```
Click "Salvează pacient"
```

**Rezultat:**
- ✅ Mesaj verde: "Pacientul a fost adăugat cu succes"
- 📋 Pacient apare în listă
- 🔄 Formularul se închide automat

---

## 🔍 Căutare și filtrare

### Căutare rapidă (Search box)

```
[🔍 Introdu nume, CNP sau email...]
```

**Funcționează pe:**
- Nume pacient (exact sau parțial)
- CNP (codul numeric personal)
- Email
- Telefon

**Exemplu:**
```
Tastezi: "popescu"
        ↓
Rezultat: "Ion Popescu", "Maria Popescu"
```

### Filtre avansate

**Afișate sub bara de search:**

#### Statusul
```
○ Toți
○ Activi
○ Inactivi
```

#### Gen
```
Selectează: [Toate] / [Masculin] / [Feminin] / [Altul]
```

#### Grup sanguín
```
Selectează: [Toate grupele] / [O+] / [A-] / etc.
```

#### Medic primar
```
Selectează: [Toți medicii] / [Dr. Ion] / [Dr. Maria]
```

#### Alergii
```
☐ Doar pacienți cu alergii
```

### Aplicare filtre

```
1. Selectează opțiuni dorite
2. Apasă [Aplică filtre]
3. Tabel se reîncarcă automat
4. Click [Resetează] pentru a șterge filtri
```

---

## ✏️ Editare pacient

### Pas 1: Deschide formularul de editare

**Opțiunea 1** - Din rând tabel:
```
Caută pacientul
    ↓
Click butonul [Editare] (pencil icon ✏️) pe rândul pacientului
    ↓
Modal se deschide cu date curente
```

**Opțiunea 2** - Din detalii:
```
Click pe rând pentru detalii
    ↓
Click "Editare"
    ↓
Modal formular se deschide
```

### Pas 2: Modifică campuri

```
Campaniile se umplesc cu valorile curente
Editează ce e necesar
```

### Pas 3: Salvează

```
Click "Salvează modificări"
```

**Rezultat:**
- ✅ Mesaj verde: "Pacientul a fost actualizat"
- 📋 Datele din tabel se actualizează
- 🔄 Modal se închide

---

## 👁️ Vizualizare detalii pacient

### Deschidere detalii

```
Click pe rândul pacientului din tabel
        ↓
Modal cu informații complete se deschide (read-only)
```

### Informații afișate

```
┌─────────────────────────────────────────┐
│ Informații personale                    │
│ Nume, CNP, Vârstă, Gen, Data nașterii  │
├─────────────────────────────────────────┤
│ Contact                                 │
│ Telefon, Email, Adresă                  │
├─────────────────────────────────────────┤
│ Date medicale                           │
│ Grup sanguín, Medic primar              │
├─────────────────────────────────────────┤
│ ALERGII                                 │
│ [Tabela cu: Substanță | Severitate]     │
├─────────────────────────────────────────┤
│ Asigurare                               │
│ Tipă, Număr, Valabilă până              │
├─────────────────────────────────────────┤
│ Plan medical (viitor)                   │
│ Consulturi, Prescripții, Internări      │
└─────────────────────────────────────────┘
```

### Acțiuni din detalii

```
[Editare] - Deschide formular edit
[Ștergere] - Confirmă și șterge
[Tipărire] - Printează fișă completă
[Înapoi] - Revine la listă
```

---

## 🗑️ Ștergere pacient

### Pas 1: Selectează pacientul

```
Găsește rândul cu pacientul
Click "Ștergere" (trash icon 🗑️)
```

### Pas 2: Confirmare

```
Dialog de confirmare:
"Ești sigur că vrei să ștergi acestpacient?
Această acțiune nu se poate anula!"

[Anulare] [Ștergere]
```

### Pas 3: Execuție

```
Click "Ștergere"
    ↓
✅ Mesaj: "Pacient șters cu succes"
    ↓
Pacientul dispare din lista
```

> ⚠️ **Notă:** Ștergerea este soft-delete — datele rămân în bază pentru audit.

---

## 📤 Export Excel

### Pas 1: Click export

```
Click "📊 Export Excel" (buton dreapta sus)
```

### Pas 2: Selectează date

```
Dialog:
☑ Informații personale (Nume, CNP, Vârstă)
☑ Contact (Telefon, Email, Adresă)
☑ Medicale (Grup sanguín, Medic, Alergii)
☑ Asigurare
☑ Status
☑ Date creare

[Selectează tot] [Anulare] [Exportă]
```

### Pas 3: Download

```
Click "Exportă"
    ↓
File download: "Pacienti_2025-03-08.xlsx"
    ↓
Se deschide în Excel / Google Sheets
```

**Format export:**
- Coloană per câmp selectat
- Header-uri în limba română
- Format date: DD.MM.YYYY
- Formatare: Color header, borders

---

## 📊 Statistici și dashboard

### Afișate în top pagină

```
┌──────────────────┬──────────────────┬──────────────────┐
│ 👥 Total pacienți│ ✅ Pacienți activi│ ⚠️ Cu alergii     │
│ 1,234            │ 1,100             │ 340              │
└──────────────────┴──────────────────┴──────────────────┘
```

**Numeric:**
- Actualizate în real-time
- Click pentru a filtra (ex: click "Cu alergii" → filtru automat)

### Grafice (viitor)
- 📊 Distribuție per gen
- 📈 Trend înregistrări (ultimele 30 zile)
- 🩸 Cele mai frecvente grupe de sânge

---

## ⌨️ Scurțături keyboard

| Tasta | Acțiune |
|-------|---------|
| `Ctrl+N` | Deschide formular pacient nou |
| `Ctrl+F` | Focus pe search box |
| `Escape` | Închide modal deschis |
| `Tab` | Navighează între campuri |
| `Enter` | Salvează formular |

---

## ⚠️ Probleme și soluții

### ❌ "CNP invalid"
**Problemă:** Error când introduceți CNP  
**Cauze:** CNP trebuie să aibă exact 13 cifre  
**Soluție:**
- Verifică: "1850312123456" (13 cifre)
- NU include spații: "1850 312 123 456" ❌
- CNP din buletinul inițial (NU modificat)

---

### ❌ "Email invalid"
**Problemă:** Error: "Formatul email nu e corect"  
**Soluție:**
- Format corect: "ion.popescu@gmail.com"
- NU: "ion popescu@gmail" (spații, fără extensie)
- NU: "ion@" (fără domeniu)

---

### ❌ "Data nașterii trebuie în trecut"
**Problemă:** Data viitoare e respingă  
**Soluție:**
- Introduceți dată din trecut
- Validare: Data ≤ Azi - 18 ani (pentru minori, altă validare)

---

### ❌ "Pacientul nu poate fi șters"
**Problemă:** Ștergerea e dezactivată  
**Cauze:**
- Pacientul are consultații/prescripții active
- NU aveți permisiune Delete
**Soluție:**
- Dezactivează în loc de ștergere: Edit → Inactive → Salvează
- Contactează admin dacă NU se poate dezactiva

---

### ❌ "Tabel nu se reîncarcă"
**Problemă:** După editare, date vechi se afișează  
**Soluție:**
1. Refresh pagina (F5)
2. Clear filtre
3. Așteptă 2-3 secunde
4. Contactă support dacă persistă

---

## 💡 Sfaturi și bune practici

### ✅ Ce SĂ faci
- ✓ Copy-paste din documente CVPentru CNP corect
- ✓ Completează alergiile — important pentru tratament
- ✓ Update contact des — pentru notificări urgente
- ✓ Use search pentru pacienți existenți

### ❌ Ce NU trebuie să faci
- ✗ NU introduce date false/fictive (pentru test)
- ✗ NU editezi alte pacienți fără permisiune
- ✗ NU export date pentru uz personal
- ✗ NU ștergi pacienți cu istoric medical activ

---

## 📞 Contact suport

**E-mail:** support@valyan-clinic.ro  
**Telefon:** +40 (XXX) XXX-XXXX  
**Program:** Luni-Vineri 09:00-17:00  
**Urgent:** Apelează direct managerul clinic

---

**© 2025 ValyanClinic. Documentație utilizator.**
