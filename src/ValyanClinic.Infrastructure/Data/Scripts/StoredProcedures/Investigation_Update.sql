SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Investigation_Update
-- Actualizeaza StructuredData, Narrative, Status si meta-date asociate.
-- Permis doar pe consultatii in lucru si pe investigatii nesterse.
-- Linia de serviciu legata se aliniaza (ex. investigatie devenita externa / anulata).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Investigation_Update
    @Id                 UNIQUEIDENTIFIER,
    @ClinicId           UNIQUEIDENTIFIER,
    @InvestigationDate  DATE,
    @StructuredData     NVARCHAR(MAX) = NULL,
    @Narrative          NVARCHAR(MAX) = NULL,
    @IsExternal         BIT           = 0,
    @ExternalSource     NVARCHAR(200) = NULL,
    @Status             TINYINT       = 2,
    @AttachedDocumentId UNIQUEIDENTIFIER = NULL,
    @HasStructuredData  BIT           = 0,
    @UpdatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ConsultationId UNIQUEIDENTIFIER;
    SELECT @ConsultationId = ConsultationId
    FROM dbo.ConsultationInvestigations
    WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

    IF @ConsultationId IS NULL
    BEGIN
        ;THROW 50023, N'Investigatia nu a fost gasita.', 1;
    END;

    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code <> 'INLUCRU'
    )
    BEGIN
        ;THROW 50021, N'Consultatia este finalizata si nu mai poate fi modificata.', 1;
    END;

    UPDATE dbo.ConsultationInvestigations
    SET InvestigationDate  = @InvestigationDate,
        StructuredData     = @StructuredData,
        Narrative          = @Narrative,
        IsExternal         = @IsExternal,
        ExternalSource     = @ExternalSource,
        Status             = @Status,
        AttachedDocumentId = @AttachedDocumentId,
        HasStructuredData  = @HasStructuredData,
        UpdatedAt          = SYSDATETIME(),
        UpdatedBy          = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationInvestigation', @Id, N'Update', NULL, NULL, @UpdatedBy);

    EXEC dbo.ConsultationService_SyncFromInvestigations
        @ClinicId = @ClinicId, @ConsultationId = @ConsultationId, @UserId = @UpdatedBy;

    COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
