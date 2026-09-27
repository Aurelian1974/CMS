-- ============================================================================
-- Migrare 0057: Hardening Appointments
-- Descriere: BlocksSlot pe statusuri, matrice de tranziții, CHECK durată,
--            RowVersion pentru concurență optimistă, indecși filtrați
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ── 1. AppointmentStatuses.BlocksSlot ────────────────────────────────────────
-- Statusurile ANULAT / NEPREZENTARE eliberează slotul din calendar.
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.AppointmentStatuses') AND name = 'BlocksSlot')
BEGIN
    ALTER TABLE dbo.AppointmentStatuses
        ADD BlocksSlot BIT NOT NULL CONSTRAINT DF_AppointmentStatuses_BlocksSlot DEFAULT 1;
    PRINT 'Coloana AppointmentStatuses.BlocksSlot adaugata.';
END
GO

UPDATE dbo.AppointmentStatuses
   SET BlocksSlot = 0
 WHERE Code IN ('ANULAT', 'NEPREZENTARE') AND BlocksSlot <> 0;
GO

-- ── 2. Matrice de tranziții de status ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES
               WHERE TABLE_NAME = 'AppointmentStatusTransitions')
BEGIN
    CREATE TABLE dbo.AppointmentStatusTransitions (
        FromStatusId UNIQUEIDENTIFIER NOT NULL,
        ToStatusId   UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_AppointmentStatusTransitions PRIMARY KEY (FromStatusId, ToStatusId),
        CONSTRAINT FK_AST_From FOREIGN KEY (FromStatusId) REFERENCES dbo.AppointmentStatuses(Id),
        CONSTRAINT FK_AST_To   FOREIGN KEY (ToStatusId)   REFERENCES dbo.AppointmentStatuses(Id)
    );

    DECLARE @Programat    UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000001';
    DECLARE @Confirmat    UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000002';
    DECLARE @Finalizat    UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000003';
    DECLARE @Anulat       UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000004';
    DECLARE @Neprezentare UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000005';

    -- FINALIZAT este terminal: nicio tranziție de ieșire.
    INSERT INTO dbo.AppointmentStatusTransitions (FromStatusId, ToStatusId) VALUES
        (@Programat,    @Confirmat),
        (@Programat,    @Finalizat),
        (@Programat,    @Anulat),
        (@Programat,    @Neprezentare),
        (@Confirmat,    @Finalizat),
        (@Confirmat,    @Anulat),
        (@Confirmat,    @Neprezentare),
        (@Confirmat,    @Programat),
        (@Anulat,       @Programat),
        (@Neprezentare, @Programat);

    PRINT 'Tabel AppointmentStatusTransitions creat + seed.';
END
GO

-- ── 3. CHECK durată pozitivă ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Appointments_Times')
BEGIN
    -- Corectează eventualele rânduri istorice invalide înainte de constrângere.
    UPDATE dbo.Appointments
       SET EndTime = DATEADD(MINUTE, 30, StartTime)
     WHERE EndTime <= StartTime;

    ALTER TABLE dbo.Appointments
        ADD CONSTRAINT CK_Appointments_Times CHECK (EndTime > StartTime);
    PRINT 'Constrangere CK_Appointments_Times adaugata.';
END
GO

-- ── 4. RowVersion pentru concurență optimistă ────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Appointments') AND name = 'RowVersion')
BEGIN
    ALTER TABLE dbo.Appointments ADD RowVersion ROWVERSION NOT NULL;
    PRINT 'Coloana Appointments.RowVersion adaugata.';
END
GO

-- ── 5. Indecși ───────────────────────────────────────────────────────────────
-- Index filtrat pentru verificarea de conflict (acces cel mai frecvent la scriere).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Appointments_Conflict')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Appointments_Conflict
        ON dbo.Appointments (ClinicId, DoctorId, StartTime, EndTime)
        INCLUDE (StatusId)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Appointments_Conflict creat.';
END
GO

-- Index pentru listare + statistici pe status.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Appointments_ClinicId_Status_StartTime')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Appointments_ClinicId_Status_StartTime
        ON dbo.Appointments (ClinicId, StatusId, StartTime DESC)
        INCLUDE (PatientId, DoctorId, EndTime)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Appointments_ClinicId_Status_StartTime creat.';
END
GO

PRINT 'Migrarea 0057_AppointmentsHardening finalizata cu succes.';
GO
