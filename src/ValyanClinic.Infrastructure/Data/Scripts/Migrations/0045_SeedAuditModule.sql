-- =============================================================================
-- Migrare 0045: Seed pentru modulul de permisiuni 'audit'
--
-- ModuleCodes.Audit = "audit" exista in cod din prima zi, iar AuditLogsController
-- este protejat cu [HasAccess(audit, Read)] — dar randul corespunzator nu a fost
-- niciodata inserat in Modules. ModuleAccessAuthorizationHandler cauta codul in
-- permisiunile efective ale utilizatorului, nu il gaseste si refuza: endpoint-ul
-- de audit raspundea 403 pentru absolut toata lumea, inclusiv pentru administratori.
-- Acelasi lucru s-ar fi intamplat cu SecurityEventsController.
--
-- Nivelul e Full pentru admin si nimic pentru restul: ambele jurnale contin adrese
-- IP, user agent si adrese de email incercate la autentificare.
--
-- Fiecare instructiune e idempotenta prin ea insasi, fara variabile intre batch-uri.
-- Id-ul ...000E este deja ocupat de modulul 'anm', adaugat printr-o migrare
-- ulterioara seed-ului initial; folosim urmatorul liber.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM Modules WHERE Code = 'audit')
    INSERT INTO Modules (Id, Code, Name, Description, SortOrder)
    VALUES ('E2000001-0000-0000-0000-00000000000F', 'audit', N'Audit',
            N'Jurnal de audit si jurnal de evenimente de securitate', 14);
GO

IF NOT EXISTS (
        SELECT 1
        FROM RoleModulePermissions rmp
        JOIN Modules m ON m.Id = rmp.ModuleId
        JOIN Roles   r ON r.Id = rmp.RoleId
        WHERE m.Code = 'audit' AND r.Code = 'admin')
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId)
    SELECT r.Id, m.Id, al.Id
    FROM Roles r
    CROSS JOIN Modules m
    CROSS JOIN (SELECT TOP 1 Id, Level FROM AccessLevels WHERE Level = 3) al
    WHERE r.Code = 'admin' AND m.Code = 'audit';
GO

PRINT 'Migrarea 0045_SeedAuditModule finalizata cu succes.';
GO
