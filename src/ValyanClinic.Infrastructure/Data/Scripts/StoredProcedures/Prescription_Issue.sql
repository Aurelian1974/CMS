SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_Issue
-- Emite o rețetă din ciornă: validează durata față de tipul de afecțiune,
-- alocă seria + numărul din contorul clinicii, calculează valabilitatea
-- (compensată: după tipul de afecțiune; simplă: valabilitatea implicită a tipului).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_Issue
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER,
    @IssuedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(30), @TypeId UNIQUEIDENTIFIER, @IsCnas BIT, @Series NVARCHAR(10),
                @MaxItems INT, @DefaultValidity INT, @CareTypeId UNIQUEIDENTIFIER, @MaxDays INT,
                @CareValidity INT, @TreatmentDays INT, @ConsultationId UNIQUEIDENTIFIER;

        SELECT @StatusCode      = s.Code,
               @TypeId          = t.Id,
               @IsCnas          = t.IsCnas,
               @Series          = t.DefaultSeries,
               @MaxItems        = t.MaxItems,
               @DefaultValidity = t.DefaultValidityDays,
               @CareTypeId      = p.CareTypeId,
               @MaxDays         = ct.MaxDays,
               @CareValidity    = ct.ValidityDays,
               @TreatmentDays   = p.TreatmentDays,
               @ConsultationId  = p.ConsultationId
        FROM dbo.Prescriptions p WITH (UPDLOCK)
        INNER JOIN dbo.PrescriptionStatuses s     ON s.Id = p.StatusId
        INNER JOIN dbo.PrescriptionTypes t        ON t.Id = p.PrescriptionTypeId
        LEFT  JOIN dbo.PrescriptionCareTypes ct   ON ct.Id = p.CareTypeId
        WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50041, N'Rețeta nu a fost găsită.', 1;
        END;

        IF @StatusCode <> N'CIORNA'
        BEGIN
            ;THROW 50042, N'Rețeta a fost deja emisă.', 1;
        END;

        DECLARE @ItemCount INT = (SELECT COUNT(*) FROM dbo.PrescriptionItems
                                  WHERE PrescriptionId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0);

        IF @ItemCount = 0
        BEGIN
            ;THROW 50043, N'Rețeta trebuie să conțină cel puțin un medicament.', 1;
        END;

        IF @MaxItems IS NOT NULL AND @ItemCount > @MaxItems
        BEGIN
            DECLARE @MaxMsg NVARCHAR(200) = CONCAT(N'Rețeta poate conține maximum ', @MaxItems, N' medicamente.');
            ;THROW 50048, @MaxMsg, 1;
        END;

        IF @IsCnas = 1 AND @CareTypeId IS NULL
        BEGIN
            ;THROW 50047, N'Selectați tipul de afecțiune (acut / subacut / cronic) pentru rețeta compensată.', 1;
        END;

        IF @IsCnas = 1 AND @TreatmentDays IS NULL
        BEGIN
            ;THROW 50047, N'Completați numărul de zile de tratament pentru rețeta compensată.', 1;
        END;

        IF @MaxDays IS NOT NULL AND @TreatmentDays > @MaxDays
        BEGIN
            DECLARE @DaysMsg NVARCHAR(300) = CONCAT(N'Durata tratamentului (', @TreatmentDays,
                N' zile) depășește maximul de ', @MaxDays, N' zile pentru tipul de afecțiune selectat.');
            ;THROW 50047, @DaysMsg, 1;
        END;

        -- Numărul se alocă sub lock pe rândul contorului, deci e unic per clinică / tip / serie
        DECLARE @Number INT;

        UPDATE dbo.PrescriptionSeriesCounters WITH (UPDLOCK, HOLDLOCK)
        SET @Number = LastNumber = LastNumber + 1,
            UpdatedAt = GETDATE()
        WHERE ClinicId = @ClinicId AND PrescriptionTypeId = @TypeId AND Series = @Series;

        IF @Number IS NULL
        BEGIN
            SET @Number = 1;
            INSERT INTO dbo.PrescriptionSeriesCounters (ClinicId, PrescriptionTypeId, Series, LastNumber)
            VALUES (@ClinicId, @TypeId, @Series, @Number);
        END;

        DECLARE @ValidityDays INT = COALESCE(IIF(@IsCnas = 1, @CareValidity, NULL), @DefaultValidity);

        UPDATE dbo.Prescriptions SET
            StatusId   = (SELECT Id FROM dbo.PrescriptionStatuses WHERE Code = N'EMISA'),
            Series     = @Series,
            Number     = @Number,
            IssueDate  = GETDATE(),
            ValidUntil = IIF(@ValidityDays IS NULL, NULL, CAST(DATEADD(DAY, @ValidityDays, GETDATE()) AS DATE)),
            UpdatedAt  = GETDATE(),
            UpdatedBy  = @IssuedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        EXEC dbo.Prescription_SyncConsultation
            @ClinicId = @ClinicId, @ConsultationId = @ConsultationId, @UpdatedBy = @IssuedBy;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Prescription', @Id, N'Issue', NULL,
                (SELECT @Series AS Series, @Number AS Number FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @IssuedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
