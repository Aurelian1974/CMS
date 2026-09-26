SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: ConsultationMedication_Update
-- Actualizeaza posologia pe momente, durata, lista de compensare si observatiile.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationMedication_Update
    @Id                UNIQUEIDENTIFIER,
    @ClinicId          UNIQUEIDENTIFIER,
    @CopaymentListType NVARCHAR(20)   = NULL,
    @DoseMorning       DECIMAL(4,2)   = NULL,
    @DoseAfternoon     DECIMAL(4,2)   = NULL,
    @DoseEvening       DECIMAL(4,2)   = NULL,
    @DurationDays      INT            = NULL,
    @Notes             NVARCHAR(1000) = NULL,
    @UpdatedBy         UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @DrugCode NVARCHAR(50), @StatusCode NVARCHAR(50);

        SELECT @DrugCode = cm.DrugCode, @StatusCode = s.Code
        FROM dbo.ConsultationMedications cm
        INNER JOIN dbo.Consultations c ON c.Id = cm.ConsultationId AND c.IsDeleted = 0
        LEFT JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE cm.Id = @Id AND cm.ClinicId = @ClinicId AND cm.IsDeleted = 0;

        IF @DrugCode IS NULL
        BEGIN
            ;THROW 50026, N'Medicamentul din tratament nu a fost găsit.', 1;
        END;

        IF @StatusCode = N'BLOCATA'
        BEGIN
            ;THROW 50021, N'Consultația este blocată și nu poate fi modificată.', 1;
        END;

        IF @CopaymentListType IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.Cnas_CopaymentListDrug
            WHERE DrugCode = @DrugCode AND CopaymentListType = @CopaymentListType AND IsActive = 1)
        BEGIN
            ;THROW 50028, N'Medicamentul nu este compensat pe lista selectată.', 1;
        END;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT CopaymentListType, DoseMorning, DoseAfternoon, DoseEvening, DurationDays, Notes
            FROM dbo.ConsultationMedications WHERE Id = @Id
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        UPDATE dbo.ConsultationMedications
        SET CopaymentListType = @CopaymentListType,
            DoseMorning       = @DoseMorning,
            DoseAfternoon     = @DoseAfternoon,
            DoseEvening       = @DoseEvening,
            DurationDays      = @DurationDays,
            Notes             = @Notes,
            UpdatedAt         = GETDATE(),
            UpdatedBy         = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'ConsultationMedication', @Id, N'Update', @OldValues,
                (SELECT @CopaymentListType AS CopaymentListType, @DoseMorning AS DoseMorning,
                        @DoseAfternoon AS DoseAfternoon, @DoseEvening AS DoseEvening,
                        @DurationDays AS DurationDays, @Notes AS Notes
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
