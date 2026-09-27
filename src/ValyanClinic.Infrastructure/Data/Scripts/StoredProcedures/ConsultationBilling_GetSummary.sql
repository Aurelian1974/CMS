SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationBilling_GetSummary
-- Tot ce vede recepția la încasare — FĂRĂ date clinice (minimizare GDPR).
-- Result sets:
--   1) antet + totaluri + status plată (NEPLATIT / PARTIAL / PLATIT)
--   2) linii servicii  3) plăți  4) defalcare plăți pe metode
--   5) bonuri fiscale  6) facturi
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationBilling_GetSummary
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Total DECIMAL(18,2) = ISNULL((
        SELECT SUM(LineTotal) FROM dbo.ConsultationServices
        WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId AND IsDeleted = 0), 0);

    DECLARE @Paid DECIMAL(18,2) = ISNULL((
        SELECT SUM(Amount) FROM dbo.Payments
        WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId AND IsCancelled = 0), 0);

    SELECT
        c.Id AS ConsultationId, c.Date, c.StatusId, s.Code AS StatusCode, s.Name AS StatusName,
        c.PatientId, CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        p.Address AS PatientAddress, p.City AS PatientCity, p.County AS PatientCounty,
        CAST(CASE WHEN p.Cnp IS NOT NULL AND LEN(p.Cnp) = 13 THEN 1 ELSE 0 END AS BIT) AS PatientHasCnp,
        c.DoctorId, CONCAT(d.LastName, N' ', d.FirstName) AS DoctorName,
        @Total AS Total, @Paid AS Paid, @Total - @Paid AS Balance,
        CASE WHEN @Paid <= 0 THEN N'NEPLATIT'
             WHEN @Paid < @Total THEN N'PARTIAL'
             ELSE N'PLATIT' END AS PaymentStatus
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Patients p ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = c.DoctorId
    WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

    SELECT
        cs.Id, cs.ConsultationId, cs.MedicalServiceId, cs.ServiceCode, cs.ServiceName,
        sc.Name AS CategoryName, cs.UnitPrice, cs.Quantity, cs.LineTotal,
        cs.VatRateId, cs.VatPercent, cs.VatCategoryCode, cs.SortOrder, cs.CreatedAt
    FROM dbo.ConsultationServices cs
    INNER JOIN dbo.MedicalServices ms ON ms.Id = cs.MedicalServiceId
    INNER JOIN dbo.ServiceCategories sc ON sc.Id = ms.CategoryId
    WHERE cs.ConsultationId = @ConsultationId AND cs.ClinicId = @ClinicId AND cs.IsDeleted = 0
    ORDER BY cs.SortOrder, cs.CreatedAt;

    SELECT
        pay.Id, pay.Amount, pay.PaidAt, pay.Notes, pay.IsCancelled, pay.CancelReason, pay.CancelledAt,
        CONCAT(u.LastName, N' ', u.FirstName) AS OperatorName,
        fr.Id AS FiscalReceiptId
    FROM dbo.Payments pay
    LEFT JOIN dbo.Users u ON u.Id = pay.CreatedBy
    LEFT JOIN dbo.FiscalReceipts fr ON fr.PaymentId = pay.Id
    WHERE pay.ConsultationId = @ConsultationId AND pay.ClinicId = @ClinicId
    ORDER BY pay.PaidAt;

    SELECT pt.PaymentId, pt.PaymentMethodId, pm.Code AS PaymentMethodCode, pm.Name AS PaymentMethodName, pt.Amount
    FROM dbo.PaymentTenders pt
    INNER JOIN dbo.Payments pay ON pay.Id = pt.PaymentId
    INNER JOIN dbo.PaymentMethods pm ON pm.Id = pt.PaymentMethodId
    WHERE pay.ConsultationId = @ConsultationId AND pay.ClinicId = @ClinicId
    ORDER BY pm.SortOrder;

    SELECT
        fr.Id, fr.PaymentId, fr.StatusId, st.Code AS StatusCode, st.Name AS StatusName, fr.Amount,
        fr.ReceiptNumber, fr.PrintedAt, fr.AttemptCount, fr.LastError, fr.IsManuallyReconciled, fr.CreatedAt
    FROM dbo.FiscalReceipts fr
    INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
    WHERE fr.ConsultationId = @ConsultationId AND fr.ClinicId = @ClinicId
    ORDER BY fr.CreatedAt;

    SELECT
        i.Id, i.Series, i.Number, i.IssueDate, i.Total, i.IsStorno, i.OriginalInvoiceId,
        i.StatusId, st.Code AS StatusCode, st.Name AS StatusName, i.CustomerName
    FROM dbo.Invoices i
    INNER JOIN dbo.InvoiceStatuses st ON st.Id = i.StatusId
    WHERE i.ConsultationId = @ConsultationId AND i.ClinicId = @ClinicId
    ORDER BY i.IssuedAt;
END;
GO
