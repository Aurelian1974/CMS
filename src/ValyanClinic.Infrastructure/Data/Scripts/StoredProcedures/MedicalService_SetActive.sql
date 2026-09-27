SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalService_SetActive — dezactivare în loc de ștergere
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalService_SetActive
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @IsActive  BIT,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @OldActive BIT;
        SELECT @OldActive = IsActive
        FROM dbo.MedicalServices WITH (UPDLOCK)
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        IF @OldActive IS NULL
        BEGIN
            ;THROW 50611, N'Serviciul nu a fost găsit.', 1;
        END;

        IF @OldActive <> @IsActive
        BEGIN
            UPDATE dbo.MedicalServices
            SET IsActive = @IsActive, UpdatedAt = GETDATE(), UpdatedBy = @UpdatedBy
            WHERE Id = @Id AND ClinicId = @ClinicId;

            INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
            VALUES (@ClinicId, N'MedicalService', @Id, N'Update',
                    (SELECT @OldActive AS IsActive FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                    (SELECT @IsActive AS IsActive FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                    @UpdatedBy);
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
