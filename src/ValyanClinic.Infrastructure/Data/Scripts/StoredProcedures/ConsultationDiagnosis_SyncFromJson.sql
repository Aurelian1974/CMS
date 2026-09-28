SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationDiagnosis_SyncFromJson
-- Descriere: Rescrie ConsultationDiagnoses din JSON-ul ICD-10 salvat în
-- Consultations.Diagnostic. Apelat din Consultation_Create / _Update, în
-- tranzacția apelantului. Text liber (non-JSON) → nu există coduri de salvat.
-- Forma JSON: { primaryCode: { code, shortDescriptionRo, ... }, primaryDetails,
--   secondaryDiagnoses: [{ id, description, icd10Codes: [{ code, shortDescriptionRo }] }] }
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationDiagnosis_SyncFromJson
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER,
    @Diagnostic     NVARCHAR(MAX),
    @UserId         UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DELETE FROM dbo.ConsultationDiagnoses WHERE ConsultationId = @ConsultationId;

    IF ISJSON(@Diagnostic) <> 1
        RETURN;

    -- JSON_VALUE întoarce NULL peste 4000 caractere → textele se citesc prin OPENJSON WITH
    INSERT INTO dbo.ConsultationDiagnoses
        (ConsultationId, ClinicId, Icd10Code, Icd10Description, IsPrimary, GroupNo, Details, SortOrder, CreatedBy)
    SELECT @ConsultationId, @ClinicId, j.Code, j.Descr, 1, 0, j.Details, 0, @UserId
    FROM OPENJSON(@Diagnostic) WITH (
        Code    NVARCHAR(20)  '$.primaryCode.code',
        Descr   NVARCHAR(500) '$.primaryCode.shortDescriptionRo',
        Details NVARCHAR(MAX) '$.primaryDetails') j
    WHERE NULLIF(LTRIM(RTRIM(j.Code)), N'') IS NOT NULL;

    INSERT INTO dbo.ConsultationDiagnoses
        (ConsultationId, ClinicId, Icd10Code, Icd10Description, IsPrimary, GroupNo, Details, SortOrder, CreatedBy)
    SELECT @ConsultationId, @ClinicId, cc.Code, cc.Descr, 0,
           CAST(sec.[key] AS INT) + 1,
           CASE WHEN CAST(codes.[key] AS INT) = 0 THEN sd.Description END,
           ROW_NUMBER() OVER (ORDER BY CAST(sec.[key] AS INT), CAST(codes.[key] AS INT)),
           @UserId
    FROM OPENJSON(@Diagnostic, '$.secondaryDiagnoses') sec
    CROSS APPLY OPENJSON(CASE WHEN sec.type = 5 THEN sec.value END) WITH (
        Description NVARCHAR(MAX) '$.description',
        Icd10Codes  NVARCHAR(MAX) '$.icd10Codes' AS JSON) sd
    CROSS APPLY OPENJSON(sd.Icd10Codes) codes
    CROSS APPLY OPENJSON(CASE WHEN codes.type = 5 THEN codes.value END) WITH (
        Code  NVARCHAR(20)  '$.code',
        Descr NVARCHAR(500) '$.shortDescriptionRo') cc
    WHERE NULLIF(LTRIM(RTRIM(cc.Code)), N'') IS NOT NULL;
END;
GO
