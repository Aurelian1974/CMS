SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: AnalysesResult_Update
-- Descriere: Actualizeaza header + sterge si reinserteaza liniile detaliu.
--            Daca @ResultDate este NULL, se foloseste @CollectionDate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.AnalysesResult_Update
    @Id               UNIQUEIDENTIFIER,
    @ClinicId         UNIQUEIDENTIFIER,
    @Laboratory       NVARCHAR(200)    = NULL,
    @BulletinNumber   NVARCHAR(100)    = NULL,
    @CollectionDate   DATE,
    @ResultDate       DATE             = NULL,
    @DoctorName       NVARCHAR(300)    = NULL,
    @DetailsJson      NVARCHAR(MAX),
    @UpdatedBy        UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Daca ResultDate nu e completata, folosim CollectionDate
    IF @ResultDate IS NULL
        SET @ResultDate = @CollectionDate;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.AnalysesResults
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
    )
    BEGIN
        ;THROW 50401, N'Buletinul de analize nu a fost gasit.', 1;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Actualizare header
        UPDATE dbo.AnalysesResults SET
            Laboratory      = @Laboratory,
            BulletinNumber  = @BulletinNumber,
            CollectionDate  = @CollectionDate,
            ResultDate      = @ResultDate,
            DoctorName      = @DoctorName,
            UpdatedAt       = SYSDATETIME(),
            UpdatedBy       = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        -- Soft-delete linii vechi
        UPDATE dbo.AnalysesResultDetails SET IsDeleted = 1
        WHERE ResultId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        -- Reinserare linii noi
        IF @DetailsJson IS NOT NULL AND @DetailsJson != N'[]'
        BEGIN
            INSERT INTO dbo.AnalysesResultDetails
                (ClinicId, ResultId, Section, TestName, Value, Unit,
                 ReferenceRange, RefMin, RefMax, Flag, Method, Notes,
                 Category, Subcategory, SortOrder, CreatedBy)
            SELECT
                @ClinicId,
                @Id,
                ISNULL(j.Section, N'GENERAL'),
                j.TestName,
                j.Value,
                j.Unit,
                j.ReferenceRange,
                j.RefMin,
                j.RefMax,
                j.Flag,
                j.Method,
                j.Notes,
                j.Category,
                j.Subcategory,
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1,
                @UpdatedBy
            FROM OPENJSON(@DetailsJson)
            WITH (
                Section        NVARCHAR(100)  '$.section',
                TestName       NVARCHAR(300)  '$.testName',
                Value          NVARCHAR(200)  '$.value',
                Unit           NVARCHAR(50)   '$.unit',
                ReferenceRange NVARCHAR(200)  '$.referenceRange',
                RefMin         DECIMAL(18,4)  '$.refMin',
                RefMax         DECIMAL(18,4)  '$.refMax',
                Flag           NVARCHAR(20)   '$.flag',
                Method         NVARCHAR(200)  '$.method',
                Notes          NVARCHAR(500)  '$.notes',
                Category       NVARCHAR(200)  '$.category',
                Subcategory    NVARCHAR(200)  '$.subcategory'
            ) j
            WHERE LTRIM(RTRIM(j.TestName)) != N'';
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
