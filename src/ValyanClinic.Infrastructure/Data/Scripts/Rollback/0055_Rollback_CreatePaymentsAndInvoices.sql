-- ============================================================================
-- ROLLBACK 0055 — rulat MANUAL (nu este preluat de DbUp).
-- Precondiție: rollback 0056 rulat înainte (FiscalReceipts referă Payments).
-- Atenție: șterge definitiv facturile și plățile. Faceți backup înainte.
-- ============================================================================
SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.InvoiceLines', 'U')    IS NOT NULL DROP TABLE dbo.InvoiceLines;
IF OBJECT_ID('dbo.Invoices', 'U')        IS NOT NULL DROP TABLE dbo.Invoices;
IF OBJECT_ID('dbo.InvoiceSeries', 'U')   IS NOT NULL DROP TABLE dbo.InvoiceSeries;
IF OBJECT_ID('dbo.InvoiceStatuses', 'U') IS NOT NULL DROP TABLE dbo.InvoiceStatuses;
IF OBJECT_ID('dbo.PaymentTenders', 'U')  IS NOT NULL DROP TABLE dbo.PaymentTenders;
IF OBJECT_ID('dbo.Payments', 'U')        IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.PaymentMethods', 'U')  IS NOT NULL DROP TABLE dbo.PaymentMethods;
GO

DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DROP PROCEDURE dbo.' + QUOTENAME(name) + N';' + CHAR(10)
FROM sys.procedures
WHERE name LIKE N'Invoice[_]%' OR name LIKE N'InvoiceSeries[_]%' OR name LIKE N'Payment[_]%'
   OR name LIKE N'PaymentMethod[_]%' OR name LIKE N'ConsultationBilling[_]%';
EXEC sp_executesql @sql;
GO

IF TYPE_ID('dbo.PaymentTenderTableType')    IS NOT NULL DROP TYPE dbo.PaymentTenderTableType;
IF TYPE_ID('dbo.InvoiceLineInputTableType') IS NOT NULL DROP TYPE dbo.InvoiceLineInputTableType;
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0055_CreatePaymentsAndInvoices.sql';
GO
