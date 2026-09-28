SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_Delete
-- Descriere: Soft delete pentru o consultație. Refuză consultațiile blocate,
-- facturate sau cu încasări (coduri distincte → 409 în handler).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(50);

        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        END;

        IF @StatusCode IN ('BLOCATA', 'FACTURATA')
        BEGIN
            ;THROW 50032, N'Consultația este blocată sau facturată și nu poate fi ștearsă.', 1;
        END;

        -- Încasările (chiar și fără document fiscal) păstrează consultația
        IF EXISTS (SELECT 1 FROM dbo.Payments WHERE ConsultationId = @Id AND ClinicId = @ClinicId AND IsCancelled = 0)
        BEGIN
            ;THROW 50029, N'Consultația are încasări înregistrate și nu poate fi ștearsă.', 1;
        END;

        DECLARE @OldValues NVARCHAR(MAX);
        SELECT @OldValues = (
            SELECT PatientId, DoctorId, AppointmentId, Date,
                   Diagnostic, DiagnosticCodes,
                   Recomandari, Observatii, StatusId
            FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.Consultations SET
            IsDeleted = 1,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Consultation', @Id, N'Delete', @OldValues, NULL, @DeletedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
