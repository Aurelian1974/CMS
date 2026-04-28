SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Investigation_Create
-- Creaza o investigatie paraclinica noua si returneaza Id-ul.
-- Verifica existenta consultatiei si ca nu este blocata.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Investigation_Create
    @ClinicId           UNIQUEIDENTIFIER,
    @ConsultationId     UNIQUEIDENTIFIER,
    @PatientId          UNIQUEIDENTIFIER,
    @DoctorId           UNIQUEIDENTIFIER,
    @InvestigationType  NVARCHAR(50),
    @InvestigationDate  DATE,
    @StructuredData     NVARCHAR(MAX) = NULL,
    @Narrative          NVARCHAR(MAX) = NULL,
    @IsExternal         BIT           = 0,
    @ExternalSource     NVARCHAR(200) = NULL,
    @Status             TINYINT       = 2,
    @AttachedDocumentId UNIQUEIDENTIFIER = NULL,
    @HasStructuredData  BIT           = 0,
    @CreatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Consultations
                   WHERE Id = @ConsultationId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50020, N'Consultatia nu a fost gasita.', 1;
    END;

    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50021, N'Consultatia este blocata si nu poate fi modificata.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.InvestigationTypeDefinitions WHERE TypeCode = @InvestigationType AND IsActive = 1)
    BEGIN
        ;THROW 50022, N'Tipul de investigatie nu este valid sau este inactiv.', 1;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.ConsultationInvestigations
        (Id, ClinicId, ConsultationId, PatientId, DoctorId, InvestigationType,
         InvestigationDate, StructuredData, Narrative, IsExternal, ExternalSource,
         Status, AttachedDocumentId, HasStructuredData, CreatedBy)
    VALUES
        (@NewId, @ClinicId, @ConsultationId, @PatientId, @DoctorId, @InvestigationType,
         @InvestigationDate, @StructuredData, @Narrative, @IsExternal, @ExternalSource,
         @Status, @AttachedDocumentId, @HasStructuredData, @CreatedBy);

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationInvestigation', @NewId, N'Create', NULL,
            (SELECT @InvestigationType AS InvestigationType, @InvestigationDate AS InvestigationDate, @Status AS Status FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @CreatedBy);

    SELECT @NewId;
END;
GO
