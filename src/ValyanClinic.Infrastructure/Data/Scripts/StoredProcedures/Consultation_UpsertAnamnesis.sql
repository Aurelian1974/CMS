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

    IF NOT EXISTS (SELECT 1 FROM dbo.Consultations
                   WHERE Id = @ConsultationId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
    END;

    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50021, N'Consultația este blocată și nu poate fi modificată.', 1;
    END;

    MERGE dbo.ConsultationAnamnesis AS t
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

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationAnamnesis', @ConsultationId, N'Upsert', NULL, NULL, @UpdatedBy);
END;
GO
