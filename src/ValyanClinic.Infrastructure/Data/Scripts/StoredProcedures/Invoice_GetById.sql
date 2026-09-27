SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Invoice_GetById — antet (cu referințe storno) + linii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Invoice_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        i.Id, i.ConsultationId, i.PatientId, i.Series, i.Number, i.IssueDate, i.IssuedAt, i.InvoiceTypeCode,
        i.IsStorno, i.OriginalInvoiceId, o.Series AS OriginalSeries, o.Number AS OriginalNumber,
        o.IssueDate AS OriginalIssueDate, i.StornoReason,
        s.Id AS StornoInvoiceId, s.Series AS StornoSeries, s.Number AS StornoNumber,
        i.StatusId, st.Code AS StatusCode, st.Name AS StatusName, i.Currency,
        i.SupplierName, i.SupplierFiscalCode, i.SupplierTradeRegisterNumber, i.SupplierAddress,
        i.SupplierCity, i.SupplierCounty, i.SupplierBankName, i.SupplierBankAccount, i.SupplierIsVatPayer,
        i.CustomerIsLegalEntity, i.CustomerName, i.CustomerCnp, i.CustomerFiscalCode, i.CustomerTradeRegisterNumber,
        i.CustomerAddress, i.CustomerCity, i.CustomerCounty, i.CustomerCountryCode,
        i.TotalNet, i.TotalVat, i.Total, i.Notes, i.CreatedAt,
        CONCAT(u.LastName, N' ', u.FirstName) AS CreatedByName
    FROM dbo.Invoices i
    INNER JOIN dbo.InvoiceStatuses st ON st.Id = i.StatusId
    LEFT JOIN dbo.Invoices o ON o.Id = i.OriginalInvoiceId
    LEFT JOIN dbo.Invoices s ON s.OriginalInvoiceId = i.Id
    LEFT JOIN dbo.Users u ON u.Id = i.CreatedBy
    WHERE i.Id = @Id AND i.ClinicId = @ClinicId;

    SELECT
        l.Id, l.Code, l.Name, l.UnitCode, l.Quantity, l.UnitPrice, l.LineTotal,
        l.VatRateId, l.VatPercent, l.VatCategoryCode, l.VatExemptionReasonCode, l.VatExemptionReasonText,
        l.VatAmount, l.NetAmount, l.SortOrder
    FROM dbo.InvoiceLines l
    INNER JOIN dbo.Invoices i ON i.Id = l.InvoiceId
    WHERE l.InvoiceId = @Id AND i.ClinicId = @ClinicId
    ORDER BY l.SortOrder;
END;
GO
