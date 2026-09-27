SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: ConsultationMedication_Delete (soft delete)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationMedication_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Found BIT = 0, @StatusCode NVARCHAR(50);

        SELECT @Found = 1, @StatusCode = s.Code
        FROM dbo.ConsultationMedications cm
        INNER JOIN dbo.Consultations c ON c.Id = cm.ConsultationId AND c.IsDeleted = 0
        LEFT JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE cm.Id = @Id AND cm.ClinicId = @ClinicId AND cm.IsDeleted = 0;

        IF @Found = 0
        BEGIN
            ;THROW 50026, N'Medicamentul din tratament nu a fost găsit.', 1;
        END;

        IF @StatusCode <> N'INLUCRU'
        BEGIN
            ;THROW 50021, N'Consultația este finalizată și nu mai poate fi modificată.', 1;
        END;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT DrugCode, DrugName, CopaymentListType, DoseMorning, DoseAfternoon, DoseEvening,
                   DurationDays, TotalQuantity
            FROM dbo.ConsultationMedications WHERE Id = @Id
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        UPDATE dbo.ConsultationMedications
        SET IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'ConsultationMedication', @Id, N'Delete', @OldValues, NULL, @DeletedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
