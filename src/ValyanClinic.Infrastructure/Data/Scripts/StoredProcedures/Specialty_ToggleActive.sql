-- ============================================================================
-- SP: Specialty_ToggleActive — Activează/dezactivează o specializare
--     Dezactivarea unei categorii/specialități dezactivează și copiii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Specialty_ToggleActive
    @Id       UNIQUEIDENTIFIER,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Specialties WHERE Id = @Id)
        BEGIN
            ;THROW 50102, N'Specializarea nu a fost găsită.', 1;
        END;

        -- Actualizează elementul specificat
        UPDATE Specialties
        SET IsActive  = @IsActive,
            UpdatedAt = GETDATE()
        WHERE Id = @Id;

        -- Dacă dezactivăm, dezactivăm și toți copiii (Level 1 + Level 2)
        IF @IsActive = 0
        BEGIN
            -- Copii direcți
            UPDATE Specialties
            SET IsActive  = 0,
                UpdatedAt = GETDATE()
            WHERE ParentId = @Id AND IsActive = 1;

            -- Nepoții (copiii copiilor)
            UPDATE Specialties
            SET IsActive  = 0,
                UpdatedAt = GETDATE()
            WHERE ParentId IN (SELECT Id FROM Specialties WHERE ParentId = @Id)
                  AND IsActive = 1;
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
