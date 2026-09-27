# Ghid administrator — Modulul financiar

## 1. Permisiuni

| Modul | Acoperă | Implicit |
|---|---|---|
| `tariffs` | Nomenclator tarife (Read = vizualizare, Write = servicii/prețuri, Full = regimuri TVA) | admin, clinic_manager: Full; restul: Read |
| `consultations` | Tab-ul „Servicii" din fișa consultației (Write = adăugare/modificare linii) | conform rolului |
| `payments` | Încasări, bonuri, reconciliere, anulare plăți (Write) | recepție: Write |
| `invoices` | Facturi (Write = emitere, Full = stornare + setări financiare) | clinic_manager: Full |

Setările financiare cer Read pe `invoices` **și** `payments`; salvarea cere **Full** pe `invoices`.

## 2. Tarife (Financiar → Tarife)

- **Serviciu nou**: cod unic, denumire, categorie, preț inițial (TVA inclus), regim TVA, valabil de la.
- **Istoric prețuri** (ochiul): prețurile sunt versionate. Un preț nou închide automat versiunea curentă la data aleasă; aceeași dată cu ultima versiune = corecție. Nu se pot introduce prețuri în trecut.
- Serviciile nu se șterg — se **dezactivează** (butonul de pornire/oprire). Liniile existente pe consultații rămân neatinse.
- **Regimuri TVA** (Full): cod, cotă, categorie UBL (S = standard, E = scutit, O = în afara sferei, Z = cota zero), motiv scutire. Seed: „Scutit de TVA conform art. 292 din Codul fiscal", cotă 0, categoria E.

## 3. Setări financiare

- **Statut TVA**: „Clinica este plătitoare de TVA" — apare în datele furnizorului pe factură.
- **Casa de marcat**:
  - activare emitere bon la numerar / card;
  - adresa fiscal bridge-ului (doar loopback: `http://127.0.0.1:5199`);
  - **grupa TVA a aparatului** pentru fiecare regim TVA și **codul tipului de plată** pentru Numerar / Card. Fără mapare, încasarea cu bon e refuzată.
- **Serii facturi**: serie nouă (1–10 litere/cifre, primul număr), implicită, activ/inactiv. Numerotarea e continuă, fără goluri (alocare tranzacțională). Stornările folosesc seria facturii stornate.

Datele furnizorului de pe factură (denumire, CUI, Reg. Com., adresă, bancă, IBAN) vin din **Administrare → Clinica**. Factura e refuzată dacă lipsesc denumirea sau CUI-ul.

## 4. Fiscal bridge (PC-ul de la recepție)

Serviciu Windows care primește bonurile din browser și le trimite la casa de marcat. Ascultă **doar pe 127.0.0.1** (nu e accesibil din rețea), cere token și acceptă doar originile configurate (CORS).

### Instalare

Cerințe: Windows 10/11, .NET 10 Runtime (ASP.NET Core), driverul USB→COM al casei de marcat.

```powershell
# PowerShell ca administrator, din src\ValyanClinic.FiscalBridge
.\install-service.ps1 -InstallDir "C:\ValyanClinic\FiscalBridge"
```

Scriptul publică aplicația, creează serviciul `ValyanClinicFiscalBridge` (pornire automată, repornire la cădere) și afișează token-ul.

### Configurare — `C:\ValyanClinic\FiscalBridge\appsettings.json`

| Cheie | Exemplu | Observații |
|---|---|---|
| `Bridge:Port` | 5199 | Același port ca în Setări financiare |
| `Bridge:AllowedOrigins` | `["http://server-cabinet:5173"]` | Adresa exactă din bara browserului |
| `Printer:Driver` | `Datecs` | `Mock` = simulare (fără bon real) |
| `Printer:Transport` | `Serial` / `Tcp` | |
| `Printer:PortName`, `BaudRate` | `COM3`, `115200` | Din Device Manager / service |
| `Printer:OperatorCode`, `TillNumber` | `1`, `1` | Programate în aparat |
| `Printer:TextEncoding` | `windows-1250` | Diacritice pe bon — de confirmat |

Parola operatorului **nu** se scrie în fișier:

```powershell
C:\ValyanClinic\FiscalBridge\ValyanClinic.FiscalBridge.exe --set-operator-password   # citită de la tastatură, salvată cu DPAPI
C:\ValyanClinic\FiscalBridge\ValyanClinic.FiscalBridge.exe --show-token              # token de asociere
C:\ValyanClinic\FiscalBridge\ValyanClinic.FiscalBridge.exe --rotate-token            # invalidează asocierile existente
Restart-Service ValyanClinicFiscalBridge
```

Asocierea: pe PC-ul recepției, **Încasări → Casa de marcat** → token → **Asociază** → **Verifică**.

Date locale: `%ProgramData%\ValyanClinic\FiscalBridge\` (jurnalul bonurilor `journal\*.json`, secretele criptate). Includeți directorul în backup-ul PC-ului — jurnalul e sursa de adevăr la reconciliere.

## 5. De validat înainte de producție

### Cu contabilul
1. **Scutirea de TVA**: temeiul exact din art. 292 Cod fiscal și **codul de motiv VATEX** pentru e-Factura (seed-ul îl lasă gol intenționat; pentru îngrijiri medicale candidatul uzual e `VATEX-EU-132-1C`) — se completează în Tarife → Regimuri TVA. Verificați și dacă există servicii taxabile (ex: certificate, servicii nemedicale).
2. **Statutul de plătitor TVA** al cabinetului.
3. **Factura storno**: cod tip document 380 cu valori negative (implementat) vs 381 (notă de credit).
4. **Factura după bon**: menționarea bonului pe factură (implementat în note) și tratamentul contabil pentru a nu dubla venitul.
5. **e-Factura**: obligațiile B2C / B2B pentru cabinet (modelul UBL e pregătit, transmiterea către SPV **nu** e implementată).
6. **Încasări parțiale în numerar**: blocate intenționat (bonul acoperă tot); confirmați dacă e nevoie de avansuri.
7. **Seriile** de facturi și numărul de start (continuitate cu numerotarea existentă).

### Cu furnizorul / service-ul casei de marcat
1. Modelul exact (DP-25 clasic vs DP-25X/MX — protocoalele diferă) și firmware-ul.
2. **Grupele TVA** programate (litera pentru „scutit") și **codurile tipurilor de plată** (numerar, card).
3. Parametrii comunicației (port, viteză, TCP), codul și parola operatorului, numărul casei.
4. Formatul comenzilor 48/49/53/56/60/74/90 (vezi README.DEVELOPER.md) și semnificația biților de status.
5. Comportamentul la retransmiterea aceleiași secvențe (aparatul nu reexecută comanda?).
6. Codificarea diacriticelor și lungimea maximă a denumirii articolului.
7. Test complet în mod service / training înainte de fiscalizare.
