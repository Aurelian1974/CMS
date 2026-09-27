-- ============================================================================
-- ROLLBACK 0053 — rulat MANUAL (nu este preluat de DbUp).
-- Precondiție: rollback 0054–0056 rulate înainte.
-- ============================================================================
SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.MedicalServicePrices', 'U') IS NOT NULL DROP TABLE dbo.MedicalServicePrices;
IF OBJECT_ID('dbo.MedicalServices', 'U')      IS NOT NULL DROP TABLE dbo.MedicalServices;
IF OBJECT_ID('dbo.ServiceCategories', 'U')    IS NOT NULL DROP TABLE dbo.ServiceCategories;
IF OBJECT_ID('dbo.VatRates', 'U')             IS NOT NULL DROP TABLE dbo.VatRates;
GO

DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DROP PROCEDURE dbo.' + QUOTENAME(name) + N';' + CHAR(10)
FROM sys.procedures
WHERE name LIKE N'MedicalService[_]%' OR name LIKE N'MedicalServicePrice[_]%'
   OR name LIKE N'ServiceCategory[_]%' OR name LIKE N'VatRate[_]%';
EXEC sp_executesql @sql;
GO

DELETE rmp FROM dbo.RoleModulePermissions rmp
INNER JOIN dbo.Modules m ON m.Id = rmp.ModuleId WHERE m.Code = 'tariffs';
DELETE uo FROM dbo.UserModuleOverrides uo
INNER JOIN dbo.Modules m ON m.Id = uo.ModuleId WHERE m.Code = 'tariffs';
DELETE FROM dbo.Modules WHERE Code = 'tariffs';
GO

IF COL_LENGTH('dbo.Clinics', 'IsVatPayer') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Clinics DROP CONSTRAINT DF_Clinics_IsVatPayer;
    ALTER TABLE dbo.Clinics DROP COLUMN IsVatPayer;
END
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0053_CreateTariffs.sql';
GO
