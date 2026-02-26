CREATE OR ALTER PROCEDURE dbo.Permission_SyncRolePermissions
    @RoleId         UNIQUEIDENTIFIER,
    @Permissions    NVARCHAR(MAX),      -- JSON array: [{"moduleId":"...","accessLevelId":"..."}]
    @UpdatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Parsare JSON în tabel temporar
        DECLARE @PermTable TABLE (
            ModuleId      UNIQUEIDENTIFIER NOT NULL,
            AccessLevelId UNIQUEIDENTIFIER NOT NULL
        );

        INSERT INTO @PermTable (ModuleId, AccessLevelId)
        SELECT
            JSON_VALUE(value, '$.moduleId'),
            JSON_VALUE(value, '$.accessLevelId')
        FROM OPENJSON(@Permissions);

        -- Validare: toate modulele și access levels există
        IF EXISTS (
            SELECT 1 FROM @PermTable pt
            WHERE NOT EXISTS (SELECT 1 FROM Modules m WHERE m.Id = pt.ModuleId AND m.IsActive = 1)
        )
        BEGIN
            ;THROW 50100, 'Unul sau mai multe module nu există sau sunt inactive.', 1;
        END;

        IF EXISTS (
            SELECT 1 FROM @PermTable pt
            WHERE NOT EXISTS (SELECT 1 FROM AccessLevels al WHERE al.Id = pt.AccessLevelId)
        )
        BEGIN
            ;THROW 50101, 'Unul sau mai multe niveluri de acces nu există.', 1;
        END;

        -- Șterge permisiunile existente ale rolului
        DELETE FROM RoleModulePermissions WHERE RoleId = @RoleId;

        -- Inserează noile permisiuni
        INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId)
        SELECT @RoleId, pt.ModuleId, pt.AccessLevelId
        FROM @PermTable pt;

        COMMIT TRANSACTION;

        -- Returnează numărul de permisiuni actualizate
        SELECT COUNT(*) AS UpdatedCount FROM @PermTable;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
