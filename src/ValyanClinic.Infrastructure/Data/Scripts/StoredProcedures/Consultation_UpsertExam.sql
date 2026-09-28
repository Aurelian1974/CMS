SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_UpsertExam
-- Descriere: INSERT sau UPDATE pe dbo.ConsultationExam (per ConsultationId).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_UpsertExam
    @ConsultationId         UNIQUEIDENTIFIER,
    @ClinicId               UNIQUEIDENTIFIER,
    @StareGenerala          NVARCHAR(50)     = NULL,
    @Tegumente              NVARCHAR(50)     = NULL,
    @Mucoase                NVARCHAR(50)     = NULL,
    @Greutate               DECIMAL(5,1)     = NULL,
    @Inaltime               INT              = NULL,
    @TensiuneSistolica      INT              = NULL,
    @TensiuneDiastolica     INT              = NULL,
    @Puls                   INT              = NULL,
    @FrecventaRespiratorie  INT              = NULL,
    @Temperatura            DECIMAL(4,1)     = NULL,
    @SpO2                   INT              = NULL,
    @Edeme                  NVARCHAR(50)     = NULL,
    @Glicemie               DECIMAL(6,1)     = NULL,
    @GanglioniLimfatici     NVARCHAR(100)    = NULL,
    @ExamenClinic           NVARCHAR(MAX)    = NULL,
    @AlteObservatiiClinice  NVARCHAR(MAX)    = NULL,
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
        SELECT StareGenerala, Tegumente, Mucoase, Greutate, Inaltime,
               TensiuneSistolica, TensiuneDiastolica, Puls, FrecventaRespiratorie,
               Temperatura, SpO2, Edeme, Glicemie, GanglioniLimfatici,
               ExamenClinic, AlteObservatiiClinice
        FROM dbo.ConsultationExam WHERE ConsultationId = @ConsultationId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
    );

    -- HOLDLOCK: fără el, două sesiuni pot intra simultan pe NOT MATCHED → violare de PK
    MERGE dbo.ConsultationExam WITH (HOLDLOCK) AS t
    USING (SELECT @ConsultationId AS ConsultationId) AS s
       ON t.ConsultationId = s.ConsultationId
    WHEN MATCHED THEN UPDATE SET
        StareGenerala         = @StareGenerala,
        Tegumente             = @Tegumente,
        Mucoase               = @Mucoase,
        Greutate              = @Greutate,
        Inaltime              = @Inaltime,
        TensiuneSistolica     = @TensiuneSistolica,
        TensiuneDiastolica    = @TensiuneDiastolica,
        Puls                  = @Puls,
        FrecventaRespiratorie = @FrecventaRespiratorie,
        Temperatura           = @Temperatura,
        SpO2                  = @SpO2,
        Edeme                 = @Edeme,
        Glicemie              = @Glicemie,
        GanglioniLimfatici    = @GanglioniLimfatici,
        ExamenClinic          = @ExamenClinic,
        AlteObservatiiClinice = @AlteObservatiiClinice,
        UpdatedAt             = SYSDATETIME(),
        UpdatedBy             = @UpdatedBy
    WHEN NOT MATCHED THEN INSERT
        (ConsultationId, StareGenerala, Tegumente, Mucoase,
         Greutate, Inaltime,
         TensiuneSistolica, TensiuneDiastolica, Puls, FrecventaRespiratorie,
         Temperatura, SpO2, Edeme, Glicemie, GanglioniLimfatici,
         ExamenClinic, AlteObservatiiClinice,
         UpdatedAt, UpdatedBy)
        VALUES
        (@ConsultationId, @StareGenerala, @Tegumente, @Mucoase,
         @Greutate, @Inaltime,
         @TensiuneSistolica, @TensiuneDiastolica, @Puls, @FrecventaRespiratorie,
         @Temperatura, @SpO2, @Edeme, @Glicemie, @GanglioniLimfatici,
         @ExamenClinic, @AlteObservatiiClinice,
         SYSDATETIME(), @UpdatedBy);

    UPDATE dbo.Consultations
    SET UpdatedAt = SYSDATETIME(), UpdatedBy = @UpdatedBy
    WHERE Id = @ConsultationId AND ClinicId = @ClinicId;

    DECLARE @NewValues NVARCHAR(MAX) = (
        SELECT StareGenerala, Tegumente, Mucoase, Greutate, Inaltime,
               TensiuneSistolica, TensiuneDiastolica, Puls, FrecventaRespiratorie,
               Temperatura, SpO2, Edeme, Glicemie, GanglioniLimfatici,
               ExamenClinic, AlteObservatiiClinice
        FROM dbo.ConsultationExam WHERE ConsultationId = @ConsultationId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationExam', @ConsultationId, N'Upsert', @OldValues, @NewValues, @UpdatedBy);

    COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
