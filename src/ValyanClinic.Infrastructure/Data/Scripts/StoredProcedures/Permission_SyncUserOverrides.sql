CREATE OR ALTER PROCEDURE dbo.Permission_SyncUserOverrides
    @UserId      UNIQUEIDENTIFIER,
    @Overrides   NVARCHAR(MAX),      -- JSON array: [{"moduleId":"...","accessLevelId":"...","reason":"..."}]
    @GrantedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Parsare JSON în tabel temporar
        DECLARE @OvrTable TABLE (
            ModuleId      UNIQUEIDENTIFIER NOT NULL,
            AccessLevelId UNIQUEIDENTIFIER NOT NULL,
            Reason        NVARCHAR(500)    NULL
        );

        INSERT INTO @OvrTable (ModuleId, AccessLevelId, Reason)
        SELECT
            JSON_VALUE(value, '$.moduleId'),
            JSON_VALUE(value, '$.accessLevelId'),
            JSON_VALUE(value, '$.reason')
        FROM OPENJSON(@Overrides);

        -- Validare
        IF EXISTS (
            SELECT 1 FROM @OvrTable ot
            WHERE NOT EXISTS (SELECT 1 FROM Modules m WHERE m.Id = ot.ModuleId AND m.IsActive = 1)
        )
        BEGIN
            ;THROW 50100, 'Unul sau mai multe module nu există sau sunt inactive.', 1;
        END;

        IF EXISTS (
            SELECT 1 FROM @OvrTable ot
            WHERE NOT EXISTS (SELECT 1 FROM AccessLevels al WHERE al.Id = ot.AccessLevelId)
        )
        BEGIN
            ;THROW 50101, 'Unul sau mai multe niveluri de acces nu există.', 1;
        END;

        -- Șterge override-urile existente ale utilizatorului
        DELETE FROM UserModuleOverrides WHERE UserId = @UserId;

        -- Inserează noile override-uri (doar cele care diferă de rol — se trimite doar ce e schimbat)
        INSERT INTO UserModuleOverrides (UserId, ModuleId, AccessLevelId, Reason, GrantedBy, GrantedAt)
        SELECT @UserId, ot.ModuleId, ot.AccessLevelId, ot.Reason, @GrantedBy, GETDATE()
        FROM @OvrTable ot;

        COMMIT TRANSACTION;

        SELECT COUNT(*) AS UpdatedCount FROM @OvrTable;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
