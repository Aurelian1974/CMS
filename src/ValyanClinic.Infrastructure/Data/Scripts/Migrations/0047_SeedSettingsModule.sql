-- =============================================================================
-- Migrare 0047: Modulul de permisiuni 'settings'
--
-- Ecranul de administrare a politicilor de securitate va fi protejat cu
-- [HasAccess(settings, ...)]. Modulul trebuie sa existe in tabela Modules inainte,
-- altfel ModuleAccessAuthorizationHandler nu gaseste codul si refuza cererea —
-- exact ce s-a intamplat cu modulul 'audit', care a raspuns 403 pentru toata lumea
-- pana la migrarea 0045.
--
-- Full doar pentru admin: setarile guverneaza politica de securitate a intregii
-- aplicatii.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM Modules WHERE Code = 'settings')
    INSERT INTO Modules (Id, Code, Name, Description, SortOrder)
    VALUES ('E2000001-0000-0000-0000-000000000010', 'settings', N'Setari securitate',
            N'Politica de parole, durata sesiunii per rol si praguri de securitate', 15);
GO

IF NOT EXISTS (
        SELECT 1
        FROM RoleModulePermissions rmp
        JOIN Modules m ON m.Id = rmp.ModuleId
        JOIN Roles   r ON r.Id = rmp.RoleId
        WHERE m.Code = 'settings' AND r.Code = 'admin')
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId)
    SELECT r.Id, m.Id, al.Id
    FROM Roles r
    CROSS JOIN Modules m
    CROSS JOIN (SELECT TOP 1 Id FROM AccessLevels WHERE Level = 3) al
    WHERE r.Code = 'admin' AND m.Code = 'settings';
GO

PRINT 'Migrarea 0047_SeedSettingsModule finalizata cu succes.';
GO
