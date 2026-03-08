SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicContact_Create
-- Descriere: Adaugă un contact pentru o clinică
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicContact_Create
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

        IF NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE Id = @ClinicId)
        BEGIN
            ;THROW 50201, N'Clinica nu a fost găsită.', 1;
        END;

        -- Dacă noul contact e principal pentru tipul său, resetează celelalte de același tip
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicContacts
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND ContactType = @ContactType AND IsMain = 1 AND IsDeleted = 0;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO dbo.ClinicContacts (ClinicId, ContactType, Value, Label, IsMain)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @ContactType, @Value, @Label, @IsMain);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
