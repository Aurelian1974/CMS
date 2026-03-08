# ❓ FAQ - Pagina Personal Medical

## 1. Creație și Adăugare Staff

### Q1: Cum adaug un staff nou?
A: Click "+ Adaug" → Completeaza formular → "Salvează". Obligatoriu: Prenume, Nume, Email, Titlu Medical.

### Q2: Ce-i diferența staff vs doctor?
A: Staff = non-doctor (infirmieră, asistent, laborant). Doctor = physician. Pages separate, permissions separate.

### Q3: Email trebuie unic?
A: DA, per clinic. Same email nu poate fi folosit 2 staff.

### Q4: Departament obligatoriu?
A: NU, optional. Staff poate fi "floating" (no department).

### Q5: Pot lăsa supervisor gol?
A: DA, optional. Doar assign dacă staff report-ează la doctor anume.

### Q6: Care sunt medical titles valide?
A: Infirmieră, Asistent, Laborant, Moașă, Flebotomist, etc. (configurable).

### Q7: Pot edita email după creare?
A: DA, unlike doctors. Email nu-i immutable pentru staff.

### Q8: Ce se întâmplă dacă șterg staff?
A: Soft delete = marcarea isDeleted, staff dispare din lista, dar rămâne în DB.

---

## 2. Căutare și Filtrare

### Q9: Cum caut staff?
A: Search box → Tipează "Ionela" → rezultate în real-time.

### Q10: Search merge pe ce câmpuri?
A: Prenume + Nume + Email + Titlu Medical.

### Q11: Cum filtrez după departament?
A: Dropdown "Departament" → Select → tabel refill.

### Q12: Pot combine search + filtre?
A: DA. Filtrele funcționează server-side, combinabile.

### Q13: De ce search e lent?
A: Internet lent sau server overload. Debounce introduce delay intențional (500ms).

---

## 3. Editare și Modificare

### Q14: Cum editez staff?
A: Cauta → click rând → "Editează" → modifica → "Salvează".

### Q15: Pot schimba departamentul?
A: DA, fully editable.

### Q16: Pot schimba email?
A: DA, unlike doctors. Email-ul staff-ului nu-i immutable.

### Q17: Pot editare telefon?
A: DA, optional field.

### Q18: De ce nu pot edita prenume?
A: Trebuia sa poti. If bug → contact support.

---

## 4. Ștergere și Dezactivare

### Q19: Care-i diferența soft delete vs deactivare?
A: Soft delete = marchează isDeleted, hidden permanent. Deactivate = toggle OFF "Activ", reversibil.

### Q20: De ce nu pot șterge staff?
A: Constraints: staff are consultații/prescripții active. Sau: permisii Level 3+ required.

### Q21: Pot restora staff după ștergere?
A: Soft delete = DA (admin only, 7 days). Hard delete = NU.

### Q22: Ce-i "isActive" toggle?
A: ON = staff activ, poate lucra. OFF = inactiv (concediu, plecat).

---

## 5. Export și Rapoarte

### Q23: Cum exporter staff în Excel?
A: "📊 Export Excel" → Selectează coloane → "Exportă".

### Q24: Care coloane pot selecta?
A: Prenume, Nume, Email, Telefon, Departament, Titlu, Supervisor, Status, etc.

### Q25: Format export?
A: XLSX (Excel modern).

### Q26: Pot export-a toți staff-ul?
A: DA, dialog include total count, export max 5000.

---

## 6. Permisiuni și Acces

### Q27: De ce nu pot adauga staff?
A: Level 2+ required. Contact admin.

### Q28: De ce "Șterge" e dezactivat?
A: Level 3+ required pentru delete. Request upgrade.

### Q29: De ce nu-i visible staff din alt departament?
A: Nu-i hidden. Folosește filters să-i cauți. Multi-tenant isolation numai per clinic.

### Q30: Ce rol poate face X?
A: L1 Read / L2 Create+Edit / L3 Delete / L4 Admin.

---

## 7. Probleme Tehnice

### Q31: Pagina nu încarcă?
A: Check: internet, auth token, network status (F12).

### Q32: Tabel gol?
A: Check: filtre prea restrictive, stats card show 0, dat server 500.

### Q33: Form nu submit-a?
A: Check: validation errors (red), required fields, server error (F12 Network).

### Q34: Export blank file?
A: Network interrupt. Retry, check internet.

### Q35: Search nu merge?
A: Debounce delay, network slow, server error. Refresh page.

---

## 8. Nomenclatură și Relații

### Q36: De ce prea puține titulaturi?
A: Configurat sistem-wide. Contact admin add job titles.

### Q37: De ce supervisor doctor dropdown gol?
A: No doctors în clinic, sau toți inactive. Deactivează supervisor field.

### Q38: Pot assign staff la alte staff?
A: NU. Supervisor e sempre doctor (if needed).

---

## 9. Migrare Și Upgrade

### Q39: De ce feature X missing?
A: Planificat v1.1 (bulk import), v1.2 (analytics). v1.0 = core.

### Q40: Cum upgrade clinic?
A: Admin notificare → new version deploy → page auto-refresh.

---

## 10. Miscellaneous

### Q41: Ce-i full name în tabel?
A: Auto-generated: firstName + space + lastName (read-only).

### Q42: Avatar initials?
A: First letter prenume + first letter nume în color badge.

### Q43: Telefon format?
A: +40... (international) sau 0721... (local).

### Q44: Status badge colors?
A: 🟢 Green = Active, ⚫ Gray = Inactive.

### Q45: Cât timp pe pagina?
A: Paginated, 20 per page default.

### Q46: Pot multi-select staff?
A: NU. Operații individual.

### Q47: Bulk operations?
A: NU planificat v1.0. Planned v1.1.

### Q48: Staff sync from doctor module?
A: NU automatic. Manual add.

### Q49: Can export to CSV?
A: Momentan nur Excel. CSV planned v1.1.

### Q50: Unde gasesc error logs?
A: Admin Panel > Logs, or email support.

---

**© 2025 ValyanClinic. FAQ confidențial.**

*Ultima actualizare: 2025-03-08*
