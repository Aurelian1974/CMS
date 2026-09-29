SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_Finalize
-- Descriere: Tranziția atomică INLUCRU → FINALIZATA — singura cale de
-- finalizare (Consultation_Update nu mai schimbă statusul).
-- Minim clinic obligatoriu: diagnostic principal ICD-10.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Finalize
    @Id          UNIQUEIDENTIFIER,
    @ClinicId    UNIQUEIDENTIFIER,
    @FinalizedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(50);

        -- UPDLOCK/HOLDLOCK: serializează finalizarea cu orice altă scriere pe același rând
        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        END;

        IF @StatusCode <> 'INLUCRU'
        BEGIN
            ;THROW 50021, N'Consultația nu mai este în lucru și nu poate fi modificată.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses
                       WHERE ConsultationId = @Id AND IsPrimary = 1)
        BEGIN
            ;THROW 50034, N'Diagnosticul principal este obligatoriu la finalizare.', 1;
        END;

        DECLARE @FinalizedStatusId UNIQUEIDENTIFIER =
            (SELECT Id FROM dbo.ConsultationStatuses WHERE Code = 'FINALIZATA');

        UPDATE dbo.Consultations SET
            StatusId  = @FinalizedStatusId,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @FinalizedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        DECLARE @OldValues NVARCHAR(MAX) =
            (SELECT @StatusCode AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        DECLARE @NewValues NVARCHAR(MAX) =
            (SELECT N'FINALIZATA' AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Consultation', @Id, N'Finalize', @OldValues, @NewValues, @FinalizedBy);

        -- Investigațiile care au primit tarif după ce au fost introduse intră acum la plată
        EXEC dbo.ConsultationService_SyncFromInvestigations
            @ClinicId = @ClinicId, @ConsultationId = @Id, @UserId = @FinalizedBy;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
