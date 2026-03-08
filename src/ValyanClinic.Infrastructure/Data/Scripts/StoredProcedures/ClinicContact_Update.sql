SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicContact_Update
-- Descriere: Actualizează un contact al clinicii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicContact_Update
    @Id          UNIQUEIDENTIFIER,
    @ClinicId    UNIQUEIDENTIFIER,
    @ContactType NVARCHAR(20),
    @Value       NVARCHAR(200),
    @Label       NVARCHAR(100) = NULL,
    @IsMain      BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.ClinicContacts WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50270, N'Contactul nu a fost găsit.', 1;
        END;

        -- Dacă contactul devine principal pentru tipul său, resetează celelalte
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicContacts
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND ContactType = @ContactType AND IsMain = 1 AND IsDeleted = 0 AND Id <> @Id;
        END;

        UPDATE dbo.ClinicContacts
        SET ContactType = @ContactType,
            Value       = @Value,
            Label       = @Label,
            IsMain      = @IsMain,
            UpdatedAt   = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
