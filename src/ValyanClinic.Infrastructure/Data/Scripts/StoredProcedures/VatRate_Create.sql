SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: VatRate_Create — regim / cotă TVA nouă (nomenclator global)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.VatRate_Create
    @ClinicId            UNIQUEIDENTIFIER,
    @Code                NVARCHAR(30),
    @Name                NVARCHAR(150),
    @Percent             DECIMAL(5,2),
    @UblCategoryCode     NVARCHAR(3),
    @ExemptionReasonCode NVARCHAR(30)  = NULL,
    @ExemptionReasonText NVARCHAR(300) = NULL,
    @CreatedBy           UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.VatRates WITH (UPDLOCK, HOLDLOCK) WHERE Code = @Code)
        BEGIN
            ;THROW 50617, N'Există deja un regim TVA cu acest cod.', 1;
        END;

        DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
        DECLARE @SortOrder INT = ISNULL((SELECT MAX(SortOrder) FROM dbo.VatRates), 0) + 1;

        INSERT INTO dbo.VatRates
            (Id, Code, Name, [Percent], UblCategoryCode, ExemptionReasonCode, ExemptionReasonText,
             SortOrder, IsActive, CreatedAt, CreatedBy)
        VALUES
            (@NewId, @Code, @Name, @Percent, @UblCategoryCode, @ExemptionReasonCode, @ExemptionReasonText,
             @SortOrder, 1, GETDATE(), @CreatedBy);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'VatRate', @NewId, N'Create', NULL,
                (SELECT @Code AS Code, @Name AS Name, @Percent AS [Percent], @UblCategoryCode AS UblCategoryCode,
                        @ExemptionReasonCode AS ExemptionReasonCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @NewId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
