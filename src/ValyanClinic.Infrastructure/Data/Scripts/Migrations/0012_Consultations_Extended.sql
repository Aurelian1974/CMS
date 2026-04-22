-- ============================================================================
-- Consultations Extended Fields — Migrare câmpuri noi
-- Adaugă coloane noi în tabelul dbo.Consultations pentru:
--   Tab 1: Anamneză (6 câmpuri noi)
--   Tab 2: Examen Clinic vitale (15 câmpuri noi)
--   Tab 3: Investigații (1 câmp nou)
--   Tab 4: Analize Medicale (1 câmp nou)
--   Tab 6: Concluzii (11 câmpuri noi)
-- ============================================================================

SET NOCOUNT ON;
GO

-- ── Tab 1: Anamneză ──────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='IstoricMedicalPersonal')
    ALTER TABLE dbo.Consultations ADD IstoricMedicalPersonal NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='TratamentAnterior')
    ALTER TABLE dbo.Consultations ADD TratamentAnterior NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='IstoricBoalaActuala')
    ALTER TABLE dbo.Consultations ADD IstoricBoalaActuala NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='IstoricFamilial')
    ALTER TABLE dbo.Consultations ADD IstoricFamilial NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='FactoriDeRisc')
    ALTER TABLE dbo.Consultations ADD FactoriDeRisc NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='AlergiiConsultatie')
    ALTER TABLE dbo.Consultations ADD AlergiiConsultatie NVARCHAR(MAX) NULL;
GO

-- ── Tab 2: Examen Clinic - Vitale ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='StareGenerala')
    ALTER TABLE dbo.Consultations ADD StareGenerala NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Tegumente')
    ALTER TABLE dbo.Consultations ADD Tegumente NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Mucoase')
    ALTER TABLE dbo.Consultations ADD Mucoase NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Greutate')
    ALTER TABLE dbo.Consultations ADD Greutate DECIMAL(5,1) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Inaltime')
    ALTER TABLE dbo.Consultations ADD Inaltime INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='TensiuneSistolica')
    ALTER TABLE dbo.Consultations ADD TensiuneSistolica INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='TensiuneDiastolica')
    ALTER TABLE dbo.Consultations ADD TensiuneDiastolica INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Puls')
    ALTER TABLE dbo.Consultations ADD Puls INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='FrecventaRespiratorie')
    ALTER TABLE dbo.Consultations ADD FrecventaRespiratorie INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Temperatura')
    ALTER TABLE dbo.Consultations ADD Temperatura DECIMAL(4,1) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SpO2')
    ALTER TABLE dbo.Consultations ADD SpO2 INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Edeme')
    ALTER TABLE dbo.Consultations ADD Edeme NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Glicemie')
    ALTER TABLE dbo.Consultations ADD Glicemie DECIMAL(6,1) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='GanglioniLimfatici')
    ALTER TABLE dbo.Consultations ADD GanglioniLimfatici NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='AlteObservatiiClinice')
    ALTER TABLE dbo.Consultations ADD AlteObservatiiClinice NVARCHAR(MAX) NULL;
GO

-- ── Tab 3: Investigații ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Investigatii')
    ALTER TABLE dbo.Consultations ADD Investigatii NVARCHAR(MAX) NULL;
GO

-- ── Tab 4: Analize Medicale ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='AnalizeMedicale')
    ALTER TABLE dbo.Consultations ADD AnalizeMedicale NVARCHAR(MAX) NULL;
GO

-- ── Tab 6: Concluzii ──────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Concluzii')
    ALTER TABLE dbo.Consultations ADD Concluzii NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='EsteAfectiuneOncologica')
    ALTER TABLE dbo.Consultations ADD EsteAfectiuneOncologica BIT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='AreIndicatieInternare')
    ALTER TABLE dbo.Consultations ADD AreIndicatieInternare BIT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SaEliberatPrescriptie')
    ALTER TABLE dbo.Consultations ADD SaEliberatPrescriptie BIT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SeriePrescriptie')
    ALTER TABLE dbo.Consultations ADD SeriePrescriptie NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SaEliberatConcediuMedical')
    ALTER TABLE dbo.Consultations ADD SaEliberatConcediuMedical BIT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SerieConcediuMedical')
    ALTER TABLE dbo.Consultations ADD SerieConcediuMedical NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SaEliberatIngrijiriDomiciliu')
    ALTER TABLE dbo.Consultations ADD SaEliberatIngrijiriDomiciliu BIT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='SaEliberatDispozitiveMedicale')
    ALTER TABLE dbo.Consultations ADD SaEliberatDispozitiveMedicale BIT NOT NULL DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='DataUrmatoareiVizite')
    ALTER TABLE dbo.Consultations ADD DataUrmatoareiVizite DATE NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='NoteUrmatoareaVizita')
    ALTER TABLE dbo.Consultations ADD NoteUrmatoareaVizita NVARCHAR(MAX) NULL;
GO
