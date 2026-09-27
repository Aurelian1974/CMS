SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Invoice_GetPaged — registrul facturilor
-- Result sets: 1) rânduri  2) total  3) statistici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Invoice_GetPaged
    @ClinicId UNIQUEIDENTIFIER,
    @Search   NVARCHAR(200)    = NULL,
    @StatusId UNIQUEIDENTIFIER = NULL,
    @DateFrom DATE             = NULL,
    @DateTo   DATE             = NULL,
    @Page     INT              = 1,
    @PageSize INT              = 20,
    @SortBy   NVARCHAR(50)     = 'IssueDate',
    @SortDir  NVARCHAR(4)      = 'desc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Term NVARCHAR(202) = CASE WHEN NULLIF(LTRIM(RTRIM(@Search)), '') IS NULL THEN NULL
                                       ELSE N'%' + LTRIM(RTRIM(@Search)) + N'%' END;

    SELECT
        i.Id, i.ConsultationId, i.Series, i.Number, i.IssueDate, i.IsStorno, i.OriginalInvoiceId,
        i.StatusId, st.Code AS StatusCode, st.Name AS StatusName,
        i.CustomerIsLegalEntity, i.CustomerName, i.CustomerFiscalCode,
        i.TotalNet, i.TotalVat, i.Total, i.CreatedAt
    FROM dbo.Invoices i
    INNER JOIN dbo.InvoiceStatuses st ON st.Id = i.StatusId
    WHERE i.ClinicId = @ClinicId
      AND (@StatusId IS NULL OR i.StatusId = @StatusId)
      AND (@DateFrom IS NULL OR i.IssueDate >= @DateFrom)
      AND (@DateTo IS NULL OR i.IssueDate <= @DateTo)
      AND (@Term IS NULL
           OR i.CustomerName COLLATE Latin1_General_CI_AI LIKE @Term
           OR CONCAT(i.Series, N' ', i.Number) COLLATE Latin1_General_CI_AI LIKE @Term
           OR CONCAT(i.Series, i.Number) COLLATE Latin1_General_CI_AI LIKE @Term
           OR i.CustomerFiscalCode LIKE @Term)
    ORDER BY
        CASE WHEN @SortBy = 'Total' AND @SortDir = 'asc'  THEN i.Total END ASC,
        CASE WHEN @SortBy = 'Total' AND @SortDir = 'desc' THEN i.Total END DESC,
        CASE WHEN @SortBy = 'CustomerName' AND @SortDir = 'asc'  THEN i.CustomerName END ASC,
        CASE WHEN @SortBy = 'CustomerName' AND @SortDir = 'desc' THEN i.CustomerName END DESC,
        CASE WHEN @SortBy NOT IN ('Total', 'CustomerName') AND @SortDir = 'asc' THEN i.IssuedAt END ASC,
        i.IssuedAt DESC, i.Series, i.Number DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*)
    FROM dbo.Invoices i
    WHERE i.ClinicId = @ClinicId
      AND (@StatusId IS NULL OR i.StatusId = @StatusId)
      AND (@DateFrom IS NULL OR i.IssueDate >= @DateFrom)
      AND (@DateTo IS NULL OR i.IssueDate <= @DateTo)
      AND (@Term IS NULL
           OR i.CustomerName COLLATE Latin1_General_CI_AI LIKE @Term
           OR CONCAT(i.Series, N' ', i.Number) COLLATE Latin1_General_CI_AI LIKE @Term
           OR CONCAT(i.Series, i.Number) COLLATE Latin1_General_CI_AI LIKE @Term
           OR i.CustomerFiscalCode LIKE @Term);

    SELECT
        COUNT(*)                                               AS TotalCount,
        ISNULL(SUM(CASE WHEN IsStorno = 1 THEN 1 ELSE 0 END), 0) AS StornoCount,
        ISNULL(SUM(Total), 0)                                  AS NetTotalValue
    FROM dbo.Invoices
    WHERE ClinicId = @ClinicId
      AND (@DateFrom IS NULL OR IssueDate >= @DateFrom)
      AND (@DateTo IS NULL OR IssueDate <= @DateTo);
END;
GO
