-- =============================================================================
-- Migrare 0057: Retragerea modulelor fantomă `reports` și `documents`
--
-- CONTEXT
-- Migrarea 0011 a seed-uit 13 module, printre care `reports` („Rapoarte medicale
-- și statistici") și `documents` („Trimiteri, scrisori medicale, concedii"), cu
-- granturi pe roluri (reports: admin/clinic_manager = Full, doctor = Read;
-- documents: admin = Full, doctor/receptionist = Write).
--
-- Niciunul dintre cele două feature-uri nu a fost construit:
--   * `reports`  — zero referințe în tot codebase-ul în afară de constanta
--                  ModuleCodes.Reports și MODULE.Reports (ambele eliminate în
--                  acest PR). Nicio rută, niciun controller, niciun SP, nicio pagină.
--   * `documents` — zero referințe. ATENȚIE: `DocumentsController` NU aparține
--                  acestui modul. El servește atașamentele investigațiilor din
--                  consultație (dbo.Documents creat în 0036, referit de
--                  ConsultationInvestigations.AttachedDocumentId) și e protejat
--                  corect pe `consultations`. Modulul `documents` din 0011 era
--                  destinat trimiterilor / scrisorilor medicale / concediilor —
--                  un feature diferit, nescris.
--
-- DE CE E O PROBLEMĂ, NU DOAR ZGOMOT
-- Modulele apar în ecranul de administrare a permisiunilor (/permissions/roles,
-- /permissions/users) ca drepturi acordabile. Un administrator putea acorda
-- „Rapoarte: Control total" și să creadă că a deschis un acces — fără ca nimic
-- să se schimbe, pentru că nu există nimic de accesat. În plus, ele intrau în
-- payload-ul de permisiuni de la fiecare login și refresh.
--
-- RISCUL EVITAT DELIBERAT
-- Alinierea inversă — mutarea DocumentsController pe ModuleCodes.Documents —
-- ar fi fost o regresie de securitate, nu o reparație:
--   * recepția are consultations = None dar documents = Write, deci ar fi CÂȘTIGAT
--     upload/download de atașamente clinice de investigații;
--   * asistenta are consultations = Read dar documents = None, deci ar fi PIERDUT
--     accesul de citire pe care îl are azi.
--
-- CE FACE MIGRAREA
-- IsActive = 0 pe cele două module. Toate SP-urile de permisiuni filtrează deja
-- `WHERE m.IsActive = 1` (Permission_GetAllModules, Permission_GetRolePermissions,
-- Permission_GetEffectiveByUser), iar Permission_SyncRolePermissions respinge
-- explicit modulele inactive (THROW 50100), deci dezactivarea e suficientă —
-- nicio schimbare de SP nu e necesară.
--
-- Rândurile din Modules și granturile din RoleModulePermissions rămân pe loc:
-- documentează intenția și fac reactivarea o singură instrucțiune UPDATE.
--
-- LIMITA REVERSIBILITĂȚII — de citit înainte de a te baza pe ea
-- Permission_SyncRolePermissions face `DELETE FROM RoleModulePermissions
-- WHERE RoleId = @RoleId` urmat de insert din payload-ul UI, care conține doar
-- module active. Deci prima salvare a permisiunilor unui rol, după această migrare,
-- îi șterge definitiv rândurile de `reports` / `documents`. Reactivarea readuce
-- modulele, nu granturile pierdute — dar acordarea permisiunilor face oricum parte
-- din construirea feature-ului.
--
-- CUM SE REACTIVEAZĂ când feature-ul se construiește:
--   UPDATE dbo.Modules SET IsActive = 1 WHERE Code = 'reports';
-- plus readăugarea constantei în ModuleCodes.cs ȘI în MODULE (useHasAccess.ts) —
-- cele două trebuie să rămână sincrone.
--
-- Rollback: Scripts/Rollback/0057_Rollback_RetirePhantomModules.sql
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Idempotent: a doua rulare nu mai raportează nimic.
IF EXISTS (SELECT 1 FROM dbo.Modules WHERE Code = N'reports' AND IsActive = 1)
BEGIN
    UPDATE dbo.Modules SET IsActive = 0 WHERE Code = N'reports';
    PRINT N'Modulul `reports` a fost dezactivat (feature neconstruit).';
END
ELSE
    PRINT N'Modulul `reports` este deja inactiv sau absent — ignorat.';
GO

IF EXISTS (SELECT 1 FROM dbo.Modules WHERE Code = N'documents' AND IsActive = 1)
BEGIN
    UPDATE dbo.Modules SET IsActive = 0 WHERE Code = N'documents';
    PRINT N'Modulul `documents` a fost dezactivat (feature neconstruit; DocumentsController rămâne pe `consultations`).';
END
ELSE
    PRINT N'Modulul `documents` este deja inactiv sau absent — ignorat.';
GO

-- Verificare finală: nicio permisiune efectivă nu mai poate cita cele două module.
-- Rândurile din RoleModulePermissions rămân, dar sunt filtrate de SP-uri.
DECLARE @StillActive INT =
    (SELECT COUNT(*) FROM dbo.Modules WHERE Code IN (N'reports', N'documents') AND IsActive = 1);

IF @StillActive > 0
BEGIN
    -- 59999 = auto-verificare de migrare. Deliberat în afara range-urilor de business
    -- alocate în SqlErrorCodes.cs: eroarea nu ajunge la niciun handler, oprește scriptul.
    -- DbUp rulează cu WithTransactionPerScript, deci THROW aici derulează tot scriptul.
    ;THROW 59999, N'Migrarea 0057 nu a reușit să dezactiveze modulele fantomă.', 1;
END;
GO

PRINT N'Migrarea 0057_RetirePhantomModules finalizata cu succes.';
GO
