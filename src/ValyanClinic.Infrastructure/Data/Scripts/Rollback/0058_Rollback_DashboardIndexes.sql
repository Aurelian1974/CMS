-- ============================================================================
-- ROLLBACK 0058 — rulat MANUAL (nu este preluat de DbUp).
-- Șterge doar indecșii; nu afectează date.
-- ============================================================================
SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_Clinic_CreatedAt' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_Clinic_CreatedAt ON dbo.Patients;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AnalysesResults_Clinic_ResultDate' AND object_id = OBJECT_ID('dbo.AnalysesResults'))
    DROP INDEX IX_AnalysesResults_Clinic_ResultDate ON dbo.AnalysesResults;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_Clinic_LicenseExpiry' AND object_id = OBJECT_ID('dbo.Doctors'))
    DROP INDEX IX_Doctors_Clinic_LicenseExpiry ON dbo.Doctors;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_Clinic_InsuranceExpiry' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_Clinic_InsuranceExpiry ON dbo.Patients;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Consultations_Clinic_NextVisit' AND object_id = OBJECT_ID('dbo.Consultations'))
    DROP INDEX IX_Consultations_Clinic_NextVisit ON dbo.Consultations;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityEvents_Clinic_OccurredAt' AND object_id = OBJECT_ID('dbo.SecurityEvents'))
    DROP INDEX IX_SecurityEvents_Clinic_OccurredAt ON dbo.SecurityEvents;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Clinic_Lockout' AND object_id = OBJECT_ID('dbo.Users'))
    DROP INDEX IX_Users_Clinic_Lockout ON dbo.Users;
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0058_DashboardIndexes.sql';
GO
