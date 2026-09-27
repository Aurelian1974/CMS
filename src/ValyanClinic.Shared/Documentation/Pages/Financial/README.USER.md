# Ghid utilizator — Servicii, încasări, bon fiscal, facturi

## 1. Medic: serviciile efectuate

1. Deschideți consultația → tab-ul **7. Servicii**.
2. Alegeți serviciul din nomenclator (apare cu prețul în vigoare), cantitatea → **Adaugă**.
3. Cantitatea se poate modifica direct în tabel (Enter sau click în afară salvează); linia se elimină cu coșul.
4. Serviciile se pot corecta cât timp consultația e *În lucru* sau *Finalizată*. După emiterea bonului sau a facturii, tab-ul devine doar citire.

> Prețul liniei rămâne cel de la momentul adăugării, chiar dacă tariful se schimbă ulterior.

## 2. Recepție: încasarea

Meniu **Financiar → Încasări**. Lista arată consultațiile finalizate cu total, încasat, rest, status plată, bon, factură.

1. Deschideți consultația (ochiul din dreapta sau dublu-click).
2. Verificați / completați serviciile (dacă medicul nu le-a trecut).
3. **Încasează** → alegeți metoda:
   - **Numerar / Card** → se emite **bon fiscal** pe întreaga sumă. Numerar + card se pot combina pe același bon (ex: 100 numerar + 50 card).
   - **Transfer bancar** → fără bon; se poate încasa și parțial (plățile în rate apar ca „Plătit parțial").
   - Transferul nu se combină cu numerar / card pe aceeași încasare.
4. După încasarea cu numerar / card, bonul se trimite automat la casa de marcat.

### Starea bonului

| Status | Ce înseamnă | Ce faceți |
|---|---|---|
| În așteptare | Nu a fost trimis la aparat | **Tipărește** |
| În tipărire | Trimis, fără rezultat salvat | **Reconciliere** |
| Emis | Tipărit, are număr | — |
| Eșuat | Sigur netipărit (hârtie, capac, aparat oprit) | Remediați → **Reîncearcă** |
| Necunoscut | Conexiune pierdută în timpul tipăririi | **Reconciliere** |
| Anulat | Plata a fost anulată înainte de tipărire | — |

### Reconcilierea (bon cu rezultat necunoscut)

**Nu reîncercați tipărirea.** Un al doilea bon ar însemna o încasare dublă în memoria fiscală.

1. Pe casa de marcat verificați ultimul bon emis (sumă, oră) — sau raportul de jurnal.
2. În fișa de încasare → **Reconciliere** → opțional **Verifică** (jurnalul fiscal bridge-ului de pe acest PC).
3. Alegeți: *bonul a fost emis* (introduceți numărul) sau *nu a fost emis* (bonul redevine retipăribil).

### Anularea unei plăți

Se poate anula o plată fără bon sau cu bon netipărit (motiv obligatoriu). O plată cu bon **emis** nu se anulează — corecția se face la casa de marcat (bon storno) și în contabilitate.

## 3. Factura

În fișa de încasare → **Emite factură** (independent de bon; pe factură apar numerele bonurilor emise).

- **Persoană fizică**: numele pacientului, adresa. CNP-ul apare **doar** dacă bifați „Trece CNP-ul pe factură" (la cererea pacientului).
- **Persoană juridică**: denumire, CUI (obligatoriu, ex: RO12345678), Nr. Reg. Com., adresă (obligatorie).
- Liniile sunt serviciile consultației. Seria implicită se alege automat.
- Factura emisă nu se modifică și nu se șterge.

### Stornare și factură de corecție (manager / admin)

1. **Facturi** → deschideți factura → **Stornează** (motiv obligatoriu). Se emite o factură cu valori negative în aceeași serie; originalul devine *Stornată*.
2. Din **Încasări** → **Emite factură** → apare **Factură de corecție**, cu liniile editabile.

PDF-ul se descarcă din fișa de încasare (**PDF**) sau din **Facturi → Descarcă PDF**.

## 4. Casa de marcat pe PC-ul de la recepție

**Încasări → Casa de marcat**: asocierea PC-ului (token primit de la administrator) și **Verifică** starea aparatului (hârtie, capac, bon deschis).
