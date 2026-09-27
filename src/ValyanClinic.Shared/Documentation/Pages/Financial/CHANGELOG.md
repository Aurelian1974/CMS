# Changelog — Modulul financiar

## [Unreleased] - 2026-09-27

### Added
- Nomenclator de tarife: servicii medicale pe categorii, prețuri versionate (ValidFrom / ValidTo), regimuri TVA configurabile (seed: scutit, art. 292), dezactivare în loc de ștergere.
- Servicii pe consultație (tab „Servicii" și fișa de încasare) cu snapshot de preț; total = suma liniilor.
- Status consultație „Facturată": fișa și serviciile devin doar citire după primul document fiscal (protejat server-side).
- Încasări: numerar, card, transfer; plăți parțiale prin transfer; idempotență pe cheie; anulare cu motiv; statusuri Neplătit / Parțial / Plătit.
- Facturi: serii cu numerotare continuă, furnizor din datele clinicii, client PF / PJ, CNP doar la cerere, PDF (QuestPDF), stornare în aceeași serie, factură de corecție; model pregătit pentru e-Factura (fără transmitere).
- Bon fiscal: mașina de stări PENDING → PRINTING → PRINTED / FAILED / UNKNOWN, reconciliere manuală, fără retipărire automată.
- Fiscal bridge (serviciu Windows local): token DPAPI, CORS, jurnal persistent per bon, `MockFiscalPrinter`, `DatecsFiscalPrinter` pentru DP-25 (protocol clasic, serial / TCP) — comenzi marcate NEVERIFICAT PE APARAT.
- Setări financiare: statut TVA, mapări TVA / plăți pe aparat, adresa bridge-ului, serii facturi.
- Teste: unitare BE, integrare pe BD (flux complet), bridge (protocol + stări), FE (scheme, orchestrare tipărire), E2E pagini.

### Changed
- Pagina „Facturi" (anterior placeholder) — listă cu filtre, detalii, PDF, stornare.
- Fixture-ul E2E folosește un context comun per worker (rotația refresh token-ului).
