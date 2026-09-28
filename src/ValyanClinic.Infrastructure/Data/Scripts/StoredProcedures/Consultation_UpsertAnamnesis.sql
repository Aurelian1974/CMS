SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_UpsertAnamnesis
-- Descriere: INSERT sau UPDATE pe dbo.ConsultationAnamnesis (per ConsultationId).
-- Verifică existența și că nu este blocată consultația.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_UpsertAnamnesis
    @ConsultationId         UNIQUEIDENTIFIER,
    @ClinicId               UNIQUEIDENTIFIER,
    @Motiv                  NVARCHAR(MAX)    = NULL,
    @IstoricMedicalPersonal NVARCHAR(MAX)    = NULL,
    @TratamentAnterior      NVARCHAR(MAX)    = NULL,
    @IstoricBoalaActuala    NVARCHAR(MAX)    = NULL,
    @IstoricFamilial        NVARCHAR(MAX)    = NULL,
    @FactoriDeRisc          NVARCHAR(MAX)    = NULL,
    @AlergiiConsultatie     NVARCHAR(MAX)    = NULL,
    @UpdatedBy              UNIQUEIDENTIFIER
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
    WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

    IF @StatusCode IS NULL
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
    END;

    IF @StatusCode <> 'INLUCRU'
    BEGIN
        ;THROW 50021, N'Consultația nu mai este în lucru și nu poate fi modificată.', 1;
    END;

    DECLARE @OldValues NVARCHAR(MAX) = (
        SELECT Motiv, IstoricMedicalPersonal, TratamentAnterior, IstoricBoalaActuala,
               IstoricFamilial, FactoriDeRisc, AlergiiConsultatie
        FROM dbo.ConsultationAnamnesis WHERE ConsultationId = @ConsultationId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
    );

    -- HOLDLOCK: fără el, două sesiuni pot intra simultan pe NOT MATCHED → violare de PK
    MERGE dbo.ConsultationAnamnesis WITH (HOLDLOCK) AS t
    USING (SELECT @ConsultationId AS ConsultationId) AS s
       ON t.ConsultationId = s.ConsultationId
    WHEN MATCHED THEN UPDATE SET
        Motiv                  = @Motiv,
        IstoricMedicalPersonal = @IstoricMedicalPersonal,
        TratamentAnterior      = @TratamentAnterior,
        IstoricBoalaActuala    = @IstoricBoalaActuala,
        IstoricFamilial        = @IstoricFamilial,
        FactoriDeRisc          = @FactoriDeRisc,
        AlergiiConsultatie     = @AlergiiConsultatie,
        UpdatedAt              = SYSDATETIME(),
        UpdatedBy              = @UpdatedBy
    WHEN NOT MATCHED THEN INSERT
        (ConsultationId, Motiv, IstoricMedicalPersonal, TratamentAnterior,
         IstoricBoalaActuala, IstoricFamilial, FactoriDeRisc, AlergiiConsultatie,
         UpdatedAt, UpdatedBy)
        VALUES
        (@ConsultationId, @Motiv, @IstoricMedicalPersonal, @TratamentAnterior,
         @IstoricBoalaActuala, @IstoricFamilial, @FactoriDeRisc, @AlergiiConsultatie,
         SYSDATETIME(), @UpdatedBy);

    -- Sincronizare timestamp pe header
    UPDATE dbo.Consultations
    SET UpdatedAt = SYSDATETIME(), UpdatedBy = @UpdatedBy
    WHERE Id = @ConsultationId AND ClinicId = @ClinicId;

    DECLARE @NewValues NVARCHAR(MAX) = (
        SELECT Motiv, IstoricMedicalPersonal, TratamentAnterior, IstoricBoalaActuala,
               IstoricFamilial, FactoriDeRisc, AlergiiConsultatie
        FROM dbo.ConsultationAnamnesis WHERE ConsultationId = @ConsultationId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationAnamnesis', @ConsultationId, N'Upsert', @OldValues, @NewValues, @UpdatedBy);

    COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
