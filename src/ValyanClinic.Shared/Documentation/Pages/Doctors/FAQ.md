# ❓ FAQ - Pagina Medici

## 1. Creație și Adăugare Medic

### Q1: Cum adaug un medic nou?
A: Click buton "+ Adaug medic" → Completează formular → Apasă "Salvează". Campuri obligatorii: Prenume, Nume, Email, Specialitate, Sub-specialitate, Titlu Medical.

### Q2: Ce fac dacă primesc error "Email duplicate"?
A: Email-ul introdus deja există în sistem. Folosește alt email unic (ex: andrei.popescu2@clinic.local). Verifica dacă medicul nu e deja în bază.

### Q3: Ce-i specialitatea vs sub-specialitatea?
A: **Specialitate** = categoria principală (Cardiologie, Neurologie). **Sub-specialitate** = sub-categorie (Cardiology → Interventional). Sub-specialitatea se umple după selectarea specialității.

### Q4: Pot lăsa supervisor gol?
A: DA, e opțional. Medicii cu rol de department head nu au supervisor. Doar completează dacă medicul raportează unui doctor mai senior.

### Q5: Ce-i medic code (parafa)?
A: E cod unic pentru identificarea rapidă în consultații (ex: POPESCU.ION). Optional, dar recomandat. Format: max 20 caractere.

### Q6: Cum selectez licență CMR?
A: Licență = aviz de lucru din Colegiul Medicilor. Câmpuri: Număr licență (ex: A-123456) și Data expirare. System alertează dacă scade sub 60 zile.

### Q7: Ce se întâmplă dacă licența expiry e trecut?
A: System arată alert orange în tabel. Médic NU e automat dezactivat, dar apare ca "Expiring soon". HR/Admin trebuie să contacteze doctor pentru reînnoire.

### Q8: Pot edita email după creație?
A: NU, email e imutabil (primary key sistem). Dacă trebuie schimbat, contact admin (hard delete + recreate).

### Q9: Trebuie departament pentru medic?
A: Optional în formular, dar recomandat. Ajută la organizare și filtrare în clinică.

### Q10: Cum fac supervisor hierarchy?
A: 1. Creează dept head (no supervisor). 2. Creează others cu supervisor = dept head. OK pentru cascada (head → team lead → juniors).

---

## 2. Căutare și Filtrare

### Q11: Cum caut medic după nume?
A: Search box sus pagină "Cauta medic..." → Tipează prenume/nume/email → Tabel se reîncarcă live (debounce 500ms). Asteapta 0.5 sec după typing.

### Q12: Caut "Ion" dar nu găsesc Dr. Ioan?
A: Search e case-insensitive dar literal. "Ion" nu match-uiește "Ioan". Dindu: "io" → match-uiește amândouă.

### Q13: Cum filtrez după departament?
A: Dropdown "Departament" sus → Select "Cardiologie" → Tabel arată nur medici Cardiologie. Combinează cu search pentru filtrare avansată.

### Q14: Merge filtrare după CMR status?
A: NU direct, dar afișez "CMR Expired" în tabel cu culoare. Manual filter: sort by "CMR Expiry" coloană.

### Q15: Cum resetez filtrele?
A: Click buton "🔄 Resetează filtre" → Curat search + dropdowns → Arată toți medicii.

### Q16: De ce resultatele se reîncarcă lent?
A: Check internet (Network tab F12). Daca merge: server overload → contact admin. Debounce introduce delay intențional (500ms).

### Q17: Pot sorta după CMR expiry?
A: DA, click header coloană "CMR Expiry" → sort ascending (ne-expired first) sau descending.

---

## 3. Editare și Modificare

### Q18: Cum editez medic deja creat?
A: Cauta medic → Click rând → Apasă "✏️ Editează" → Modifică câmpuri → "Salvează". Nu poți edita: Email (imutabil).

### Q19: Pot schimba especialitate după creare?
A: DA, e editabil. Tine minte: trebuie selectează sub-specialitate din nou.

### Q20: Ce se întâmplă dacă schimb supervisorul?
A: Medicul se reassign-ează la noul supervisor. Consultații active rămân cu medicul înainte (nu transfer automat).

### Q21: Merge editare telefonului?
A: DA, phoneNumber e fully editable. Format: international +40... sau local 0721...

### Q22: De ce nu pot edita email?
A: Email e unique key sistem, schimbarea destabilizeaza relații. Soluție: contact admin pentru hard delete + recreate.

---

## 4. Ștergere și Dezactivare

### Q23: Care-i diferența soft delete vs deactivate?
A: **Soft delete** = marchează isDeleted în DB, ascunde permanent. **Deactivate** = toggle OFF "Activ", ascunde dar reversibil. Recomandare: deactivate pentru concedii, soft delete pentru plecare.

### Q24: De ce nu pot șterge medic?
A: Constraints: doctor are consultații/prescripții/pacienți active. Soluție: mută consultații la alt doctor, apoi șterge.

### Q25: Pot restora medic după ștergere?
A: Soft delete = DA (admin only, 7 days window). Hard delete = NU (permanent). Contact admin cu data ștergerii.

### Q26: Ce-i "isActive" toggle?
A: ON = doctor vizibil, pode accepta pacienți. OFF = medic inactiv (concediu, sabbatical, contract suspendat).

---

## 5. Export și Rapoarte

### Q27: Cum exporter medici în Excel?
A: Click "📊 Export Excel" → Dialog apare → Selectează coloane (checkboxes) → "Exportă" → Download .xlsx file.

### Q28: Pot export-a toți medicii dintr-o data?
A: DA, list se pagin-ează dar dialog export include count total (max 10,000 rows).

### Q29: Ce format-uri export disponibile?
A: Momentan: Excel (.xlsx) doar. Planuri: PDF, CSV în v1.1.

### Q30: Coloanele export sunt customizabile?
A: DA, checkboxes pentru: Nume, Email, Telefon, Departament, Specialitate, License, Status, etc. "Select all / Deselect all" buttons.

---

## 6. Permisiuni și Acces

### Q31: De ce nu pot adauga medic?
A: Permisii insuficiente. Required: Level 2 (Create) la modul "Doctors". Contact admin.

### Q32: De ce "Șterge" e dezactivat?
A: Required: Level 3 (Full manage) la "Doctors". Receptionist (L2) nu pot șterge. Request admin pentru upgrade.

### Q33: Ce rol pot face X?
A: **L1 Read:** vede lista / L2 Create+Edit:** adauga+editează / **L3 Delete:** șterge / **L4 Admin:** toți + config.

### Q34: Vezi medici din alte clinici?
A: NU (multi-tenant isolation). Doar medici din clinica ta (ClinicId).

### Q35: Cum iau permisii export?
A: Contact IT/Admin. Request: modul "Doctors", Level 4 (Admin).

---

## 7. Probleme Tehnice

### Q36: De ce tabel e gol?
A: Check: 1. Filtre prea restrictive (reset) 2. No results return (search corect?) 3. Network error (F12 Network tab). Stats card arată total?

### Q37: Error "Network timeout" la search?
A: Internet lent / server overload. Refresh pagina (F5). Verify internet Ctrl+Shift+Delete (clear cache).

### Q38: Form se blochează (nu submit)?
A: Check: 1. Validation errors (roșu msg) 2. Server error (F12 Console) 3. Hard refresh (Ctrl+Shift+R).

### Q39: CSV import nu merge?
A: Feature nu exista în v1.0 (planificat v1.1). Momentan: manual add one-by-one.

### Q40: De ce lent load-ul?
A: Check: 1. Internet speed 2. Grid > 1000 rows (paginate) 3. Server performance (contact admin).

---

## 8. Nomenclatură și Relații

### Q41: De ce sunt prea puține specialități?
A: Nomenclatură e configurat sistem-wide. Contact admin adauga specialități în Admin Panel > Nomenclatură.

### Q42: Subspecialty dropdown gol?
A: NU ai selectat Specialty (L1) inainte. Select specialty → subspecialty dropdown se umple.

### Q43: De ce medical title "Doctor" nu apare?
A: Filter-ează titles cu cod "MEDIC*" (system config). Alte titluri: "Nurse", "Technician" nu se arată. Contact admin pentru add.

### Q44: Supervisor doctor dropdown show care medici?
A: Lista lookup = toți medicii clinicii active. Dezactivații nu apare. Deci: deactivează supervisor → nu-l poți selecta.

---

## 9. Probleme GDPR și Compliance

### Q45: Cum respect GDPR pe pagina asta?
A: 1. Nu export-i emails mass (personal data) 2. Ștergeri requesturi → contact admin (right to erasure) 3. Audit logs kept 3 years.

### Q46: Trebuie consent pentru export email-uri?
A: DA, personal data. Export doar pentru internal use (HR, clinică). Nu share to third parties.

### Q47: Cât timp se pun logs de delete?
A: 3 ani audit trail retention. După 3 ani: auto-delete anonymous (privacy).

---

## 10. Integrare și API

### Q48: Pot accesa via API direct?
A: DA, REST API: GET /api/doctors (list), POST create, PUT update, DELETE. See API-ENDPOINTS.md.

### Q49: Token expiry la API?
A: JWT access token = 8 hours. Refresh token (HttpOnly cookie) = 7 days. Auto-refresh via interceptor.

### Q50: Tre să encrypt password API requests?
A: HTTPS transport (TLS 1.3). Payment/passwords: never log. Use standard headers: "Authorization: Bearer {token}".

---

## 11. Migrare Și Upgrade

### Q51: De ce feature X missing în pagina?
A: Planificat: v1.1 (bulk import), v1.2 (bulk operations), v2.0 (advanced analytics). Versiune curent: 1.0 (core).

### Q52: Cum upgrade clinic cu new feature?
A: Admin notificare → new version deploy → page auto-refresh → test new feature.

### Q53: Merge rollback după update?
A: Soft delete = reversibil (7 days). Hard delete = permanent (backup restore only). Check CHANGELOG upgrade impacts.

---

## 12. Troubleshooting Links

### Q54: Nu apare doctor creat acum 5 min?
A: A: Cache issue. Refresh (F5) → check F12 Network (POST success?) → contact admin.

### Q55: Unde gasesc detailed error log?
A: Browser: F12 → Console red errors. Server: Admin Panel > Logs. Support: docs@valyan-clinic.local.

### Q56: Cum report bug?
A: GitHub Issues (tag #doctors-page) or email docs@valyan-clinic.local cu screenshot.

---

## 13. Miscellaneous

### Q57: Ce-i full name în tabel?
A: Auto-generated: firstName + space + lastName (ex: "Ion Popescu"). Read-only, calculated.

### Q58: Avatar inițiale în tabel?
A: First letter prenume + first letter nume în color badge (ex: "IP" for Ion Popescu).

### Q59: Telefon format internațional?
A: +40... (Romania) sau zero- local (0721...). System auto-format cu country code.

### Q60: Status badge colors?
A: 🟢 Green = Active, ⚫ Gray = Inactive, 🔴 Red = License expired, 🟠 Orange = <60 days.

---

**© 2025 ValyanClinic. FAQ confidențial.**

*Ultima actualizare: 2025-03-08*
