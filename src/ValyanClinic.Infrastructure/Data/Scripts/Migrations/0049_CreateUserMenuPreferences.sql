-- =============================================================================
-- Migrare 0049: Preferintele sidebar-ului per utilizator
--
-- O singura coloana dedicata: FavoriteRoutes, JSON (array ordonat de rute din
-- sidebar). Ordinea din array E ordinea de afisare — reordonarea prin drag and
-- drop inseamna doar salvarea unui nou array, fara o coloana separata de ordine.
-- Multi-tenancy prin ClinicId, desi cheia primara e UserId — un utilizator
-- apartine unei singure clinici.
--
-- Coloana ramane NULL pana la prima salvare din UI; absenta unui rand pentru un
-- utilizator inseamna pur si simplu "fara favorite", nu eroare.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserMenuPreferences')
BEGIN
    CREATE TABLE dbo.UserMenuPreferences (
        UserId         UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ClinicId       UNIQUEIDENTIFIER NOT NULL,
        FavoriteRoutes NVARCHAR(MAX)    NULL,
        UpdatedAt      DATETIME2        NOT NULL DEFAULT SYSDATETIME(),
        UpdatedBy      UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT FK_UserMenuPreferences_Users   FOREIGN KEY (UserId)   REFERENCES dbo.Users(Id),
        CONSTRAINT FK_UserMenuPreferences_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
    );

    PRINT 'Tabelul UserMenuPreferences a fost creat.';
END;
GO

-- Citirile filtreaza intotdeauna dupa ClinicId (multi-tenancy), desi UserId e deja unic.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_UserMenuPreferences_ClinicId' AND object_id = OBJECT_ID('UserMenuPreferences'))
    CREATE NONCLUSTERED INDEX IX_UserMenuPreferences_ClinicId
        ON dbo.UserMenuPreferences (ClinicId)
        INCLUDE (UserId);
GO

PRINT 'Migrarea 0049_CreateUserMenuPreferences finalizata cu succes.';
GO
