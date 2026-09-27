-- ============================================================================
-- ROLLBACK 0057 — rulat MANUAL (nu este preluat de DbUp).
--
-- Reactivează modulele `reports` și `documents`. Nedistructiv: migrarea 0057 a
-- schimbat doar IsActive, deci nu e nimic de recreat.
--
-- ATENȚIE: reactivarea readuce modulele în ecranul de permisiuni, NU granturile
-- pe roluri care s-au pierdut între timp. Permission_SyncRolePermissions șterge
-- și reinserează toate permisiunile unui rol la fiecare salvare, iar payload-ul
-- UI conține doar module active — deci orice rol salvat după 0057 și-a pierdut
-- rândurile de `reports` / `documents`. Verifică ce a mai rămas:
--
--   SELECT r.Code AS RoleCode, m.Code AS ModuleCode, al.Code AS AccessLevel
--   FROM dbo.RoleModulePermissions rmp
--   INNER JOIN dbo.Roles r         ON r.Id  = rmp.RoleId
--   INNER JOIN dbo.Modules m       ON m.Id  = rmp.ModuleId
--   INNER JOIN dbo.AccessLevels al ON al.Id = rmp.AccessLevelId
--   WHERE m.Code IN (N'reports', N'documents')
--   ORDER BY m.Code, r.Code;
--
-- Reactivarea cere și readăugarea constantelor în ModuleCodes.cs ȘI în MODULE
-- (client/src/hooks/useHasAccess.ts) — cele două trebuie să rămână sincrone.
-- ============================================================================

SET NOCOUNT ON;
GO

UPDATE dbo.Modules SET IsActive = 1 WHERE Code IN (N'reports', N'documents');
PRINT N'Modulele `reports` și `documents` au fost reactivate.';
GO
