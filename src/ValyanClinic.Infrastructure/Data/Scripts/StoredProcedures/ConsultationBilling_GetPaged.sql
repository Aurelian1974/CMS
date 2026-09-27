SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationBilling_GetPaged — lista de încasări pentru recepție
-- Consultații finalizate / facturate, cu total, încasat, rest și status plată.
-- Result sets: 1) rânduri  2) total  3) statistici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationBilling_GetPaged
    @ClinicId      UNIQUEIDENTIFIER,
    @Search        NVARCHAR(200) = NULL,
    @PaymentStatus NVARCHAR(20)  = NULL,
    @DateFrom      DATE          = NULL,
    @DateTo        DATE          = NULL,
    @Page          INT           = 1,
    @PageSize      INT           = 20
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Term NVARCHAR(202) = CASE WHEN NULLIF(LTRIM(RTRIM(@Search)), '') IS NULL THEN NULL
                                       ELSE N'%' + LTRIM(RTRIM(@Search)) + N'%' END;

    ;WITH Base AS (
        SELECT
            c.Id AS ConsultationId, c.Date, c.StatusId, s.Code AS StatusCode, s.Name AS StatusName,
            c.PatientId, CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
            CONCAT(d.LastName, N' ', d.FirstName) AS DoctorName,
            ISNULL(t.Total, 0) AS Total,
            ISNULL(pd.Paid, 0) AS Paid,
            inv.InvoiceNumber,
            fr.ReceiptStatusCode,
            fr.ReceiptStatusName
        FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        INNER JOIN dbo.Patients p ON p.Id = c.PatientId
        INNER JOIN dbo.Doctors d  ON d.Id = c.DoctorId
        OUTER APPLY (SELECT SUM(cs.LineTotal) AS Total FROM dbo.ConsultationServices cs
                     WHERE cs.ConsultationId = c.Id AND cs.IsDeleted = 0) t
        OUTER APPLY (SELECT SUM(pay.Amount) AS Paid FROM dbo.Payments pay
                     WHERE pay.ConsultationId = c.Id AND pay.IsCancelled = 0) pd
        OUTER APPLY (SELECT TOP (1) CONCAT(i.Series, N' ', i.Number) AS InvoiceNumber FROM dbo.Invoices i
                     WHERE i.ConsultationId = c.Id AND i.IsStorno = 0
                       AND i.StatusId = 'F4000000-0000-0000-0000-000000000001'
                     ORDER BY i.IssuedAt DESC) inv
        OUTER APPLY (SELECT TOP (1) rs.Code AS ReceiptStatusCode, rs.Name AS ReceiptStatusName
                     FROM dbo.FiscalReceipts r
                     INNER JOIN dbo.FiscalReceiptStatuses rs ON rs.Id = r.StatusId
                     WHERE r.ConsultationId = c.Id AND rs.Code <> N'CANCELLED'
                     ORDER BY r.CreatedAt DESC) fr
        WHERE c.ClinicId = @ClinicId
          AND c.IsDeleted = 0
          AND s.Code IN (N'FINALIZATA', N'FACTURATA')
          AND (@DateFrom IS NULL OR c.Date >= @DateFrom)
          AND (@DateTo IS NULL OR c.Date < DATEADD(DAY, 1, @DateTo))
          AND (@Term IS NULL
               OR CONCAT(p.LastName, N' ', p.FirstName) COLLATE Latin1_General_CI_AI LIKE @Term
               OR CONCAT(p.FirstName, N' ', p.LastName) COLLATE Latin1_General_CI_AI LIKE @Term)
    ),
    WithStatus AS (
        SELECT *,
            Total - Paid AS Balance,
            CASE WHEN Paid <= 0 THEN N'NEPLATIT'
                 WHEN Paid < Total THEN N'PARTIAL'
                 ELSE N'PLATIT' END AS PaymentStatus
        FROM Base
    )
    SELECT *
    INTO #Rows
    FROM WithStatus;

    SELECT *
    FROM #Rows
    WHERE @PaymentStatus IS NULL OR PaymentStatus = @PaymentStatus
    ORDER BY Date DESC, PatientName
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) FROM #Rows WHERE @PaymentStatus IS NULL OR PaymentStatus = @PaymentStatus;

    -- Statisticile ignoră filtrul de status plată (rămân vizibile toate contoarele)
    SELECT
        ISNULL(SUM(CASE WHEN PaymentStatus = N'NEPLATIT' THEN 1 ELSE 0 END), 0) AS UnpaidCount,
        ISNULL(SUM(CASE WHEN PaymentStatus = N'PARTIAL'  THEN 1 ELSE 0 END), 0) AS PartialCount,
        ISNULL(SUM(CASE WHEN PaymentStatus = N'PLATIT'   THEN 1 ELSE 0 END), 0) AS PaidCount,
        ISNULL(SUM(CASE WHEN ReceiptStatusCode IN (N'PENDING', N'PRINTING', N'FAILED', N'UNKNOWN')
                        THEN 1 ELSE 0 END), 0) AS ReceiptsNeedingAttentionCount
    FROM #Rows;

    DROP TABLE #Rows;
END;
GO
