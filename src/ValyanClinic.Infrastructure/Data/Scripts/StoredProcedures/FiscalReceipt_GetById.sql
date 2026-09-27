SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: FiscalReceipt_GetById — bonul + payload-ul pentru casa de marcat
-- Result sets: 1) antet  2) linii (cu grupa TVA)  3) plăți (cu codul aparatului)
--              4) istoric evenimente
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.FiscalReceipt_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        fr.Id, fr.ConsultationId, fr.PaymentId, fr.StatusId, st.Code AS StatusCode, st.Name AS StatusName,
        fr.Amount, fr.ReceiptNumber, fr.DeviceSerialNumber, fr.PrintedAt, fr.AttemptCount, fr.LastError,
        fr.IsManuallyReconciled, fr.ReconciliationNote, fr.ReconciledAt, fr.CreatedAt, fr.UpdatedAt
    FROM dbo.FiscalReceipts fr
    INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
    WHERE fr.Id = @Id AND fr.ClinicId = @ClinicId;

    SELECT l.Id, l.Name, l.UnitPrice, l.Quantity, l.LineTotal, l.VatRateId, l.TaxGroup, l.SortOrder
    FROM dbo.FiscalReceiptLines l
    INNER JOIN dbo.FiscalReceipts fr ON fr.Id = l.FiscalReceiptId
    WHERE l.FiscalReceiptId = @Id AND fr.ClinicId = @ClinicId
    ORDER BY l.SortOrder;

    SELECT pt.PaymentMethodId, pm.Code AS PaymentMethodCode, pm.Name AS PaymentMethodName,
           m.DevicePaymentCode, pt.Amount
    FROM dbo.FiscalReceipts fr
    INNER JOIN dbo.PaymentTenders pt ON pt.PaymentId = fr.PaymentId
    INNER JOIN dbo.PaymentMethods pm ON pm.Id = pt.PaymentMethodId
    LEFT JOIN dbo.FiscalPaymentMappings m ON m.PaymentMethodId = pt.PaymentMethodId AND m.ClinicId = fr.ClinicId
    WHERE fr.Id = @Id AND fr.ClinicId = @ClinicId
    ORDER BY pm.SortOrder;

    SELECT e.Id, e.FromStatusId, fs.Code AS FromStatusCode, e.ToStatusId, ts.Code AS ToStatusCode,
           e.Message, e.CreatedAt, CONCAT(u.LastName, N' ', u.FirstName) AS CreatedByName
    FROM dbo.FiscalReceiptEvents e
    LEFT JOIN dbo.FiscalReceiptStatuses fs ON fs.Id = e.FromStatusId
    INNER JOIN dbo.FiscalReceiptStatuses ts ON ts.Id = e.ToStatusId
    LEFT JOIN dbo.Users u ON u.Id = e.CreatedBy
    WHERE e.FiscalReceiptId = @Id AND e.ClinicId = @ClinicId
    ORDER BY e.CreatedAt;
END;
GO
