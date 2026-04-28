SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Investigation_GetTrending
-- Extrage o valoare numerica din StructuredData (JSON) pentru trending in timp.
-- @JsonPath = JSON path expression valid pentru SQL Server (ex: '$.FEV1' sau '$.RespiratoryEvents.AHI_Total').
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Investigation_GetTrending
    @PatientId          UNIQUEIDENTIFIER,
    @ClinicId           UNIQUEIDENTIFIER,
    @InvestigationType  NVARCHAR(50),
    @JsonPath           NVARCHAR(200),
    @DateFrom           DATE = NULL,
    @DateTo             DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        i.InvestigationDate,
        @JsonPath AS ParameterPath,
        TRY_CAST(JSON_VALUE(i.StructuredData, @JsonPath) AS DECIMAL(18,4)) AS Value,
        i.Id AS InvestigationId
    FROM dbo.ConsultationInvestigations i
    WHERE i.PatientId = @PatientId
      AND i.ClinicId = @ClinicId
      AND i.IsDeleted = 0
      AND i.InvestigationType = @InvestigationType
      AND i.StructuredData IS NOT NULL
      AND (@DateFrom IS NULL OR i.InvestigationDate >= @DateFrom)
      AND (@DateTo   IS NULL OR i.InvestigationDate <= @DateTo)
    ORDER BY i.InvestigationDate ASC;
END;
GO
