SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationService_UpdateQuantity — doar cantitatea; prețul rămâne snapshot
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationService_UpdateQuantity
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @Quantity  DECIMAL(10,3),
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ConsultationId UNIQUEIDENTIFIER, @OldQuantity DECIMAL(10,3), @StatusCode NVARCHAR(50);

        SELECT @ConsultationId = ConsultationId, @OldQuantity = Quantity
        FROM dbo.ConsultationServices
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        IF @ConsultationId IS NULL
        BEGIN
            ;THROW 50604, N'Linia de serviciu nu a fost găsită.', 1;
        END;

        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @StatusCode IS NULL OR @StatusCode NOT IN (N'INLUCRU', N'FINALIZATA')
        BEGIN
            ;THROW 50601, N'Consultația a fost facturată sau blocată; serviciile nu mai pot fi modificate. Corecțiile se fac prin storno.', 1;
        END;

        IF @Quantity IS NULL OR @Quantity <= 0
        BEGIN
            ;THROW 50603, N'Cantitatea trebuie să fie mai mare decât zero.', 1;
        END;

        UPDATE dbo.ConsultationServices
        SET Quantity = @Quantity, UpdatedAt = GETDATE(), UpdatedBy = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'ConsultationService', @Id, N'Update',
                (SELECT @OldQuantity AS Quantity FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                (SELECT @Quantity AS Quantity FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
