-- ============================================================================
-- ROLLBACK 0056 — rulat MANUAL (nu este preluat de DbUp).
-- Atenție: șterge definitiv istoricul bonurilor fiscale. Faceți backup înainte.
-- ============================================================================
SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.FiscalReceiptEvents', 'U')   IS NOT NULL DROP TABLE dbo.FiscalReceiptEvents;
IF OBJECT_ID('dbo.FiscalReceiptLines', 'U')    IS NOT NULL DROP TABLE dbo.FiscalReceiptLines;
IF OBJECT_ID('dbo.FiscalReceipts', 'U')        IS NOT NULL DROP TABLE dbo.FiscalReceipts;
IF OBJECT_ID('dbo.FiscalReceiptStatuses', 'U') IS NOT NULL DROP TABLE dbo.FiscalReceiptStatuses;
IF OBJECT_ID('dbo.FiscalVatMappings', 'U')     IS NOT NULL DROP TABLE dbo.FiscalVatMappings;
IF OBJECT_ID('dbo.FiscalPaymentMappings', 'U') IS NOT NULL DROP TABLE dbo.FiscalPaymentMappings;
IF OBJECT_ID('dbo.FiscalSettings', 'U')        IS NOT NULL DROP TABLE dbo.FiscalSettings;
GO

DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DROP PROCEDURE dbo.' + QUOTENAME(name) + N';' + CHAR(10)
FROM sys.procedures
WHERE name LIKE N'FiscalReceipt[_]%' OR name LIKE N'FiscalSettings[_]%';
EXEC sp_executesql @sql;
GO

IF TYPE_ID('dbo.FiscalVatMappingTableType')     IS NOT NULL DROP TYPE dbo.FiscalVatMappingTableType;
IF TYPE_ID('dbo.FiscalPaymentMappingTableType') IS NOT NULL DROP TYPE dbo.FiscalPaymentMappingTableType;
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0056_CreateFiscalReceipts.sql';
GO
