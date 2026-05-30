SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: AnalysesResult_Create
-- Descriere: Creeaza header buletin + linii detaliu intr-o singura tranzactie.
--            Daca @ResultDate este NULL, se foloseste @CollectionDate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.AnalysesResult_Create
    @ClinicId         UNIQUEIDENTIFIER,
    @PatientId        UNIQUEIDENTIFIER,
    @ConsultationId   UNIQUEIDENTIFIER = NULL,
    @Laboratory       NVARCHAR(200)    = NULL,
    @BulletinNumber   NVARCHAR(100)    = NULL,
    @CollectionDate   DATE,
    @ResultDate       DATE             = NULL,
    @DoctorName       NVARCHAR(300)    = NULL,
    @DetailsJson      NVARCHAR(MAX),             -- JSON array AnalysesResultDetails
    @CreatedBy        UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Daca ResultDate nu e completata, folosim CollectionDate
    IF @ResultDate IS NULL
        SET @ResultDate = @CollectionDate;

    -- Validare pacient exista in clinica
    IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50400, N'Pacientul nu a fost gasit sau nu apartine acestei clinici.', 1;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Inserare header
        INSERT INTO dbo.AnalysesResults
            (Id, ClinicId, PatientId, ConsultationId, Laboratory, BulletinNumber,
             CollectionDate, ResultDate, DoctorName, CreatedBy)
        VALUES
            (@NewId, @ClinicId, @PatientId, @ConsultationId, @Laboratory, @BulletinNumber,
             @CollectionDate, @ResultDate, @DoctorName, @CreatedBy);

        -- Inserare linii din JSON
        IF @DetailsJson IS NOT NULL AND @DetailsJson != N'[]'
        BEGIN
            INSERT INTO dbo.AnalysesResultDetails
                (ClinicId, ResultId, Section, TestName, Value, Unit,
                 ReferenceRange, RefMin, RefMax, Flag, Method, Notes, SortOrder, CreatedBy)
            SELECT
                @ClinicId,
                @NewId,
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
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1,
                @CreatedBy
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
                Notes          NVARCHAR(500)  '$.notes'
            ) j
            WHERE LTRIM(RTRIM(j.TestName)) != N'';
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT @NewId;
END;
GO
