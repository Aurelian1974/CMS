-- ============================================================================
-- Migrare 0058: Indecși pentru agregatele de dashboard
-- Descriere: dashboard-ul nu introduce tabele noi; citește din cele existente.
--            Lipseau indecșii pe coloanele după care agregă. Toți sunt filtrați,
--            deci nu cresc costul de scriere pe rândurile din afara predicatului.
-- Rollback:  Scripts/Rollback/0058_Rollback_DashboardIndexes.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Patients_Clinic_CreatedAt' AND object_id = OBJECT_ID('dbo.Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_Clinic_CreatedAt
        ON dbo.Patients (ClinicId, CreatedAt DESC)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_AnalysesResults_Clinic_ResultDate' AND object_id = OBJECT_ID('dbo.AnalysesResults'))
    CREATE NONCLUSTERED INDEX IX_AnalysesResults_Clinic_ResultDate
        ON dbo.AnalysesResults (ClinicId, ResultDate DESC)
        INCLUDE (PatientId, ConsultationId, Laboratory, BulletinNumber)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Doctors_Clinic_LicenseExpiry' AND object_id = OBJECT_ID('dbo.Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_Clinic_LicenseExpiry
        ON dbo.Doctors (ClinicId, LicenseExpiresAt)
        INCLUDE (FirstName, LastName, LicenseNumber, IsActive)
        WHERE IsDeleted = 0 AND LicenseExpiresAt IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Patients_Clinic_InsuranceExpiry' AND object_id = OBJECT_ID('dbo.Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_Clinic_InsuranceExpiry
        ON dbo.Patients (ClinicId, InsuranceExpiry)
        INCLUDE (FirstName, LastName, PhoneNumber, InsuranceNumber)
        WHERE IsDeleted = 0 AND InsuranceExpiry IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Consultations_Clinic_NextVisit' AND object_id = OBJECT_ID('dbo.Consultations'))
    CREATE NONCLUSTERED INDEX IX_Consultations_Clinic_NextVisit
        ON dbo.Consultations (ClinicId, DataUrmatoareiVizite)
        INCLUDE (PatientId, DoctorId)
        WHERE IsDeleted = 0 AND DataUrmatoareiVizite IS NOT NULL;
GO

-- SecurityEvents.ClinicId e NULL-abil: rândurile fără clinică sunt citite separat.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_SecurityEvents_Clinic_OccurredAt' AND object_id = OBJECT_ID('dbo.SecurityEvents'))
    CREATE NONCLUSTERED INDEX IX_SecurityEvents_Clinic_OccurredAt
        ON dbo.SecurityEvents (ClinicId, OccurredAt DESC)
        INCLUDE (EventType, Succeeded, EmailAttempted, IpAddress, UserId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Users_Clinic_Lockout' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE NONCLUSTERED INDEX IX_Users_Clinic_Lockout
        ON dbo.Users (ClinicId, LockoutEnd)
        INCLUDE (FirstName, LastName, Email, FailedLoginAttempts, LastLoginAt)
        WHERE IsDeleted = 0 AND LockoutEnd IS NOT NULL;
GO

PRINT N'Migrarea 0058_DashboardIndexes finalizata cu succes.';
GO
