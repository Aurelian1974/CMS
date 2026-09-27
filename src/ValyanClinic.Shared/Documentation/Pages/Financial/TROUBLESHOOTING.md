# Troubleshooting — Modulul financiar

| Simptom | Cauză probabilă | Soluție |
|---|---|---|
| „Acest PC nu este asociat cu fiscal bridge-ul" | Token lipsă în browserul curent | Încasări → Casa de marcat → introduceți token-ul (`--show-token` pe PC) |
| „Fiscal bridge-ul nu răspunde" | Serviciul oprit / alt port | `Get-Service ValyanClinicFiscalBridge`; `Start-Service …`; verificați `Bridge:Port` vs Setări financiare |
| Eroare CORS în consola browserului | Originea aplicației lipsește din `Bridge:AllowedOrigins` | Adăugați adresa exactă (protocol + host + port), reporniți serviciul |
| 401 de la bridge | Token regenerat (`--rotate-token`) | Asociați din nou stația |
| „Casa de marcat nu este pregătită: Lipsă hârtie / Capac deschis" | Starea aparatului | Remediați, apoi **Tipărește** / **Reîncearcă** |
| „Există un bon fiscal deschis pe aparat" | Bon rămas neînchis (ex: oprire în timpul tipăririi) | Închideți/anulați din aparat sau `POST /api/device/cancel-open-receipt`; reconciliați bonul afectat |
| „Regimul TVA … nu este mapat" / „Metoda de plată … nu este mapată" | Mapare lipsă în Setări financiare | Completați grupa TVA / codul de plată al aparatului |
| „Emiterea bonurilor fiscale este dezactivată" | Setări financiare → casa de marcat dezactivată | Activați sau încasați prin transfer |
| „Bonul fiscal se emite pentru întreaga valoare…" | Plată parțială numerar/card sau plată anterioară | Încasați toată suma sau folosiți transfer |
| „Factura nu poate fi emisă: datele furnizorului sunt incomplete" | Lipsesc denumirea / CUI-ul clinicii | Administrare → Clinica |
| „Există deja o factură activă" | Consultația are factură emisă | Stornați factura înainte de a emite alta |
| Plata nu se poate anula | Bonul e emis sau nerezolvat | Reconciliați bonul; plățile cu bon emis se corectează la casa de marcat |
| Bonul rămâne „În tipărire" | Rezultatul nu a ajuns la server (rețea) | Reconciliere → **Verifică** în jurnalul bridge-ului |
| Diacritice greșite pe bon | Codificare | `Printer:TextEncoding` (implicit windows-1250) — de confirmat cu service-ul |
| Aparatul respinge toate bonurile | Parolă operator / cod operator | `--set-operator-password`, `Printer:OperatorCode`, reporniți serviciul |

Jurnal bridge: `%ProgramData%\ValyanClinic\FiscalBridge\journal\<jobId>.json` (istoric stări + răspunsul aparatului, fără parolă). Loguri serviciu: Event Viewer → Windows Logs → Application → sursa „ValyanClinic.FiscalBridge".
