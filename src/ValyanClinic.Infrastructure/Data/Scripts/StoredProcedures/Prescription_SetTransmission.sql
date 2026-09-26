SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_SetTransmission
-- Înregistrează rezultatul transmiterii în SIPE a unei rețete compensate emise:
--   * succes (@ErrorMessage NULL): identificatorul electronic + status TRANSMISA;
--   * eșec: mesajul de eroare, statusul rămâne EMISA pentru retransmitere.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_SetTransmission
    @Id           UNIQUEIDENTIFIER,
    @ClinicId     UNIQUEIDENTIFIER,
    @ElectronicId NVARCHAR(50)   = NULL,
    @IsOffline    BIT            = 0,
    @ErrorMessage NVARCHAR(1000) = NULL,
    @UpdatedBy    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(30), @IsCnas BIT;

        SELECT @StatusCode = s.Code, @IsCnas = t.IsCnas
        FROM dbo.Prescriptions p WITH (UPDLOCK)
        INNER JOIN dbo.PrescriptionStatuses s ON s.Id = p.StatusId
        INNER JOIN dbo.PrescriptionTypes t    ON t.Id = p.PrescriptionTypeId
        WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50041, N'Rețeta nu a fost găsită.', 1;
        END;

        IF @IsCnas = 0 OR @StatusCode <> N'EMISA'
        BEGIN
            ;THROW 50049, N'Doar rețetele compensate emise (netransmise) pot fi transmise în SIPE.', 1;
        END;

        IF @ErrorMessage IS NOT NULL
            UPDATE dbo.Prescriptions SET
                TransmissionError = @ErrorMessage,
                UpdatedAt         = GETDATE(),
                UpdatedBy         = @UpdatedBy
            WHERE Id = @Id AND ClinicId = @ClinicId;
        ELSE
            UPDATE dbo.Prescriptions SET
                StatusId          = (SELECT Id FROM dbo.PrescriptionStatuses WHERE Code = N'TRANSMISA'),
                ElectronicId      = @ElectronicId,
                IsOffline         = @IsOffline,
                TransmittedAt     = GETDATE(),
                TransmissionError = NULL,
                UpdatedAt         = GETDATE(),
                UpdatedBy         = @UpdatedBy
            WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Prescription', @Id, N'Transmit', NULL,
                (SELECT @ElectronicId AS ElectronicId, @IsOffline AS IsOffline, @ErrorMessage AS Error
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
