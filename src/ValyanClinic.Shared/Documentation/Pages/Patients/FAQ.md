# ❓ FAQ - Pagina Pacienți

## Creație și editare

### Q1: Care sunt campurile obligatorii la creare?
**A:** Obligatorii:
- ✓ **Nume complet** (minim 2 caractere)
- ✓ **CNP** (exact 13 cifre)
- ✓ **Data nașterii**
- ✓ **Gen**
- ✓ **Medic primar**

După salvare, poți completa. Alergiile se pot adaugă mai târziu.

---

### Q2: Ce format trebuie să aibă CNP-ul?
**A:** 
- Exact **13 cifre**
- Format: `1850312123456`
- **NU** acceptă spații: `1850 312 123 456` ❌
- **NU** acceptă diacritice

---

### Q3: Pot ediata CNP după creație?
**A:** **NU!** CNP e imutabil pentru a menține integritatea datelor.

Dacă e greșit:
1. Șterge pacientul (dacă nu are istorice)
2. Crează nou cu CNP corect
3. Contactează admin pentru caz special

---

### Q4: Pacientul meu are birthDate greșit. Cum modific?
**A:**
1. Deschide pacientul (click rând)
2. Click "Editare"
3. Selectează data noua
4. Click "Salvează"
5. ✅ Data se actualizează imediat

---

### Q5: Cum adaug mai multe alergii?
**A:**
1. Deschide formularul
2. Secțiune "Alergii"
3. Click "✚ Adaugă alergie"
4. Selectează: Tip alergie + Substanță + Severitate
5. Click "Adaugă"
6. Repetă pentru alte alergii
7. Click "Salvează"

---

### Q6: Care sunt nivelele de severitate pentru alergii?
**A:**
- 🔴 **Critică** - Riscul anafilaxie, interzis total
- 🟠 **Ridicată** - Reacție severa, evitat dacă posibil
- 🟡 **Medie** - Reacție moderata, cu precauție
- 🟢 **Scăzută** - Disconfort ușor, monitorizare

---

## Căutare și filtrare

### Q7: Search-ul nu găsește pacientul. De ce?
**A:** Search funcționează pe:
- Nume (exact sau parțial)
- CNP
- Email

Ce NU găsește:
- ❌ Adresa
- ❌ Telefon
- ❌ Medic primar (pentru asta folosește filtru!)

**Sfat:** Folosește filtrele pentru mai mult control.

---

### Q8: Cum filtrez pacienți cu alergii critice?
**A:**
1. Filtrele bajo search
2. ☑ Bifează "Doar pacienți cu alergii"
3. Click "Aplică"
4. Rezultatele îți arată severitate maxima

NU filtrează per severitate specific, dar poți sorta după "AllergyMaxSeverity".

---

### Q9: Pot salva filtrele mele?
**A:** **NU.** Filtrele sunt temp și se reseteaza la refresh.

**Workaround:**
1. Copy URL (contine parametiri query)
2. Salvează bookmark
3. Bookmark te conect la același filter

---

## Ștergere și export

### Q10: Pot șterge pacient cu consultații?
**A:** **NU!** Sistem nu permite din motiv de integritate medicală.

**Alternativa - Dezactivare:**
1. Deschide pacient
2. Edit → Bifează "Inactiv"
3. Salvează
4. Pacientul dispare din lista (dar rămâne în bază)

---

### Q11: Cum export datele în Excel?
**A:**
1. Click "📊 Export Excel" (dreapta sus)
2. Selectează coloane dorite
3. Click "Exportă"
4. File se descarcă

**Format:** `Pacienti_2025-03-08.xlsx` (spreadsheet cu header)

---

### Q12: Ce date se exporta în Excel?
**A:** Depinde de selecție:
- Personale: Nume, CNP, Vârstă, Gen
- Contact: Telefon, Email, Adresă
- Medicale: Grup sanguín, Medic, Alergii
- Asigurare: Status, Număr, Data expirare
- Management: Status activ, Data creare

---

## Permisiuni și acces

### Q13: Nu pot edita un pacient. De ce?
**A:** Verifică permisiuni:
- ✓ Role trebuie Level 2+ (Write)
- ✓ NU poti edita alt clinic (multitenancy)
- ✓ Admin poate restricționa editare

Contactează admin dacă crezi e error.

---

### Q14: Pot vedea pacienți din alte clinici?
**A:** **NU!** Sistem filtrează automat pe: "My clinic only"

Isolation complet per clinic din motive GDPR/confidențialitate.

---

## Probleme tehnice

### Q15: Tabel se încarc foarte lent
**A:** Cauze posibile:
1. **Mulți pacienți (>10K)** - Use search/filtre
2. **Network lent** - Check internet connection
3. **Server down** - Contact IT

**Quick fix:**
1. Refresh pagina (F5)
2. Clear search/filtre
3. Reduce pageSize (setări grid)

---

### Q16: Ștergerea nu merge. Error "Conflict"
**A:** Pacientul nu poate fi șters dacă:
- ❌ Are consultații
- ❌ Are prescripții
- ❌ Are facturi active
- ❌ Are interne

**Soluție:** Dezactivează în loc de ștergere.

---

### Q17: Form nu trimite. "Validation error"
**A:** Ceva campuri e invalid:
1. Check mesajele de error roșii
2. Verifica: Email format, CNP 13 cifre
3. Verifica: Data nașterii în trecut
4. Verifica: Alergii cu tip + severitate selectate

**Debug:**
- Open DevTools (F12)
- Check Network tab
- Cauta POST request error details

---

## Date și sincronizare

### Q18: Un coleg a editat pacientul în același timp. Cine câștigă?
**A:** **Last-write-wins** (lazy concurrency).

Colegul care salvează ultimul, datele lui se păstrează.

**Soluție:** Comunică cu echipa, evita editare simultana.

---

### Q19: Datele se sincronizează automat în app mobile?
**A:** **NU automat.** Aplicația mobilă are sesiune separata.

Trebui re-login pe app pentru date actualizate.

---

### Q20: Cum merg stats-urile? Se actualizează?
**A:** Stats (Total, Activi, Cu alergii) se actualizează:
- ✓ În **real-time** când adaugi/editezi
- ✓ Cache resets la refresh pagina
- ✓ Calcul pe backend la query time

---

## Complianță și securitate

### Q21: Pacientele sunt protejate GDPR?
**A:** **DA!** Măsuri:
- ✓ Criptare în tranzit (HTTPS)
- ✓ Criptare în repaus (DB encryption)
- ✓ Access control (role-based)
- ✓ Audit trail (cine a accesat ce)
- ✓ Data retention policy

---

### Q22: Pot exporte date pacient pentru research?
**A:** **NU direkt din app.** Doar admin cu permisiuni.

Process:
1. Contactează Medical Director
2. Completeaza approval form
3. Admin executa export anonymized
4. Data e furnished cu cuvinte cheie (nu CNP)

---

### Q23: Cât timp se păstrează datele deletate?
**A:** Soft deletes:
- **Inactive:** Păstrate indefinit
- **Actual delete:** Nu e permis dacă are istoric

Hard delete (cu permisiune admin):
- Audit trail preserved 10 ani
- Patient data deleted (GDPR Request)
- Backup-uri purged după retention policy

---

## Integrări viitoare

### Q24: Se va integra cu CNAS?
**A:** **Planificat pentru v1.1!**

Funcționalități viitoare:
- ☐ Export automata asigurare
- ☐ Download documente CNAS
- ☐ Verificare validitate asigurare
- ☐ Backup-up date din CNAS registry

---

### Q25: Vor fi poze/documentele scanate?
**A:** **Da!** Planificat v1.2:
- ☐ Upload foto profil
- ☐ Scan buletine
- ☐ Scan documente medicale (PDF)
- ☐ OCR extraction CNP automat
- ☐ Full-text search în documente

---

## Feedback și sugestii

### Q26: Cum sugerez o funcție nouă (ex: tags)?
**A:** 
1. Email: **feedback@valyan-clinic.ro**
2. Describe feature clearly
3. Use case: when would use it
4. Priority: nice-to-have vs critical

Suggestiile bune mergin viitoarele release-uri!

---

**© 2025 ValyanClinic. FAQ Documentation.**  
**Ultima actualizare:** 2025-03-08
