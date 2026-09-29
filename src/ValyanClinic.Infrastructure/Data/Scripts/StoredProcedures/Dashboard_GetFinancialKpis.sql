SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetFinancialKpis
-- Statusul de plată e calculat identic cu ConsultationBilling_GetPaged (total din
-- servicii vs. încasat din plăți necancelate) — altfel cele două ecrane diferă.
-- Restanțele se caută doar din @BillableSince (implicit 6 luni): contorul și lista
-- folosesc aceeași fereastră. Nicio coloană clinică (acces pe modulul payments).
-- Result sets: 1) contoare  2) de încasat  3) bonuri fiscale de rezolvat
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetFinancialKpis
    @ClinicId      UNIQUEIDENTIFIER,
    @Today         DATE,
    @BillableSince DATE = NULL,
    @Top           INT  = 10
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow   DATE = DATEADD(DAY, 1, @Today);
    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);
    DECLARE @NextMonth  DATE = DATEADD(MONTH, 1, @MonthStart);
    IF @BillableSince IS NULL SET @BillableSince = DATEADD(MONTH, -6, @Today);

    SELECT
        c.Id AS ConsultationId,
        c.Date,
        c.PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        DoctorName  = CONCAT(d.LastName, N' ', d.FirstName),
        LastChange  = ISNULL(c.UpdatedAt, c.CreatedAt),
        Total = ISNULL(t.Total, 0),
        Paid  = ISNULL(pd.Paid, 0)
    INTO #Billable
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors d              ON d.Id = c.DoctorId
    OUTER APPLY (SELECT SUM(cs.LineTotal) AS Total FROM dbo.ConsultationServices cs
                 WHERE cs.ConsultationId = c.Id AND cs.IsDeleted = 0) t
    OUTER APPLY (SELECT SUM(pay.Amount) AS Paid FROM dbo.Payments pay
                 WHERE pay.ConsultationId = c.Id AND pay.IsCancelled = 0) pd
    WHERE c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND s.Code IN (N'FINALIZATA', N'FACTURATA')
      AND c.Date >= @BillableSince
      AND c.Date <  @Tomorrow;

    -- ── 1. Contoare ─────────────────────────────────────────────────────────
    SELECT
        RevenueToday = (
            SELECT ISNULL(SUM(pay.Amount), 0)
            FROM dbo.Payments pay
            WHERE pay.ClinicId = @ClinicId
              AND pay.IsCancelled = 0
              AND pay.PaidAt >= @Today AND pay.PaidAt < @Tomorrow
        ),
        RevenueThisMonth = (
            SELECT ISNULL(SUM(pay.Amount), 0)
            FROM dbo.Payments pay
            WHERE pay.ClinicId = @ClinicId
              AND pay.IsCancelled = 0
              AND pay.PaidAt >= @MonthStart AND pay.PaidAt < @NextMonth
        ),
        InvoicesThisMonthCount = (
            SELECT COUNT(*)
            FROM dbo.Invoices i
            WHERE i.ClinicId = @ClinicId
              AND i.IsStorno = 0
              AND i.IssueDate >= @MonthStart AND i.IssueDate < @NextMonth
        ),
        -- Stornările au Total negativ: suma simplă e valoarea netă (ca Invoice_GetPaged)
        InvoicesThisMonthNetTotal = (
            SELECT ISNULL(SUM(i.Total), 0)
            FROM dbo.Invoices i
            WHERE i.ClinicId = @ClinicId
              AND i.IssueDate >= @MonthStart AND i.IssueDate < @NextMonth
        ),
        UnpaidCount      = (SELECT COUNT(*) FROM #Billable WHERE Paid <= 0 AND Total > 0),
        PartialCount     = (SELECT COUNT(*) FROM #Billable WHERE Paid > 0 AND Paid < Total),
        OutstandingTotal = (SELECT ISNULL(SUM(Total - Paid), 0) FROM #Billable WHERE Total > Paid),
        ReceiptsNeedingAttentionCount = (
            SELECT COUNT(*)
            FROM dbo.FiscalReceipts r
            INNER JOIN dbo.FiscalReceiptStatuses rs ON rs.Id = r.StatusId
            WHERE r.ClinicId = @ClinicId
              AND rs.Code IN (N'PENDING', N'PRINTING', N'FAILED', N'UNKNOWN')
        );

    -- ── 2. De încasat — consultațiile tocmai finalizate primele (pacientul e la recepție) ──
    SELECT TOP (@Top)
        ConsultationId, Date, PatientId, PatientName, DoctorName, Total, Paid,
        Balance       = Total - Paid,
        PaymentStatus = CASE WHEN Paid <= 0 THEN N'NEPLATIT' ELSE N'PARTIAL' END
    FROM #Billable
    WHERE Total > 0 AND Total > Paid
    ORDER BY Date DESC, LastChange DESC;

    -- ── 3. Bonuri fiscale de rezolvat ───────────────────────────────────────
    SELECT TOP (@Top)
        r.Id,
        r.ConsultationId,
        StatusCode  = rs.Code,
        StatusName  = rs.Name,
        r.CreatedAt,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName)
    FROM dbo.FiscalReceipts r
    INNER JOIN dbo.FiscalReceiptStatuses rs ON rs.Id = r.StatusId
    INNER JOIN dbo.Consultations c          ON c.Id = r.ConsultationId
    INNER JOIN dbo.Patients p               ON p.Id = c.PatientId
    WHERE r.ClinicId = @ClinicId
      AND rs.Code IN (N'PENDING', N'PRINTING', N'FAILED', N'UNKNOWN')
    ORDER BY r.CreatedAt;

    DROP TABLE #Billable;
END;
GO
