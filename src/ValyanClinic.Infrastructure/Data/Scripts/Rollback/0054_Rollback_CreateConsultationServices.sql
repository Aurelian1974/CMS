-- ============================================================================
-- ROLLBACK 0054 — rulat MANUAL (nu este preluat de DbUp).
-- Precondiție: rollback 0055 și 0056 rulate înainte.
-- ============================================================================
SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.ConsultationServices', 'U') IS NOT NULL DROP TABLE dbo.ConsultationServices;
GO

DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DROP PROCEDURE dbo.' + QUOTENAME(name) + N';' + CHAR(10)
FROM sys.procedures WHERE name LIKE N'ConsultationService[_]%';
EXEC sp_executesql @sql;
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0054_CreateConsultationServices.sql';
GO
