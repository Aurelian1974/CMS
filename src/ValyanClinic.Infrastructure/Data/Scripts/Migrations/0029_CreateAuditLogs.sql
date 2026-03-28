-- ============================================================
-- Migration 0029: Tabel AuditLogs — jurnal de audit complet
-- Scop: conformitate medicală și GDPR — cine, când, ce a schimbat
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AuditLogs')
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL,
        EntityType  NVARCHAR(100)    NOT NULL,   -- 'Patient', 'User', 'Doctor', 'Appointment'
        EntityId    UNIQUEIDENTIFIER NOT NULL,    -- Id-ul entității modificate
        Action      NVARCHAR(50)     NOT NULL,    -- 'Create', 'Update', 'Delete'
        OldValues   NVARCHAR(MAX)    NULL,        -- JSON cu valorile vechi (NULL pentru Create)
        NewValues   NVARCHAR(MAX)    NULL,        -- JSON cu valorile noi (NULL pentru Delete)
        ChangedBy   UNIQUEIDENTIFIER NOT NULL,    -- UserId care a făcut modificarea
        ChangedAt   DATETIME2        NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT FK_AuditLogs_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
    );

    PRINT 'Tabelul AuditLogs a fost creat.';
END;
GO

-- Index principal: căutare jurnal pentru o entitate specifică
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLogs_EntityType_EntityId' AND object_id = OBJECT_ID('AuditLogs'))
    CREATE NONCLUSTERED INDEX IX_AuditLogs_EntityType_EntityId
        ON dbo.AuditLogs (ClinicId, EntityType, EntityId, ChangedAt DESC);
GO

-- Index pentru vizualizare cronologică per clinică
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLogs_ClinicId_ChangedAt' AND object_id = OBJECT_ID('AuditLogs'))
    CREATE NONCLUSTERED INDEX IX_AuditLogs_ClinicId_ChangedAt
        ON dbo.AuditLogs (ClinicId, ChangedAt DESC)
        INCLUDE (EntityType, EntityId, Action, ChangedBy);
GO

-- Index pentru căutare după utilizatorul care a făcut modificarea
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLogs_ChangedBy' AND object_id = OBJECT_ID('AuditLogs'))
    CREATE NONCLUSTERED INDEX IX_AuditLogs_ChangedBy
        ON dbo.AuditLogs (ClinicId, ChangedBy, ChangedAt DESC);
GO
