-- ============================================================================
-- Migrare 0050: Tratament recomandat pe consultatie (medicamente din nomenclatorul CNAS)
-- Datele medicamentului sunt snapshot la momentul prescrierii; lista de compensare
-- aleasa (A/B/C1/...) se pastreaza pe rand. NULL = necompensat.
-- Posologia: doza per priza pe momente (NULL = moment nebifat);
-- TotalQuantity = suma dozelor zilnice x numarul de zile.
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConsultationMedications')
BEGIN
    CREATE TABLE dbo.ConsultationMedications (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ConsMed_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId            UNIQUEIDENTIFIER NOT NULL,
        ConsultationId      UNIQUEIDENTIFIER NOT NULL,
        PatientId           UNIQUEIDENTIFIER NOT NULL,
        DrugCode            NVARCHAR(50)     NOT NULL,
        DrugName            NVARCHAR(500)    NOT NULL,
        ActiveSubstance     NVARCHAR(200)    NULL,
        PharmaceuticalForm  NVARCHAR(200)    NULL,
        Concentration       NVARCHAR(200)    NULL,
        PrescriptionMode    NVARCHAR(50)     NULL,
        CopaymentListType   NVARCHAR(20)     NULL,
        DoseMorning         DECIMAL(4,2)     NULL,
        DoseAfternoon       DECIMAL(4,2)     NULL,
        DoseEvening         DECIMAL(4,2)     NULL,
        DurationDays        INT              NULL,
        TotalQuantity       AS CAST(
                                NULLIF(ISNULL(DoseMorning, 0) + ISNULL(DoseAfternoon, 0) + ISNULL(DoseEvening, 0), 0)
                                * DurationDays AS DECIMAL(9,2)) PERSISTED,
        Notes               NVARCHAR(1000)   NULL,
        SortOrder           INT              NOT NULL CONSTRAINT DF_ConsMed_SortOrder DEFAULT 0,
        IsDeleted           BIT              NOT NULL CONSTRAINT DF_ConsMed_IsDeleted DEFAULT 0,
        CreatedAt           DATETIME2(0)     NOT NULL CONSTRAINT DF_ConsMed_CreatedAt DEFAULT GETDATE(),
        CreatedBy           UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt           DATETIME2(0)     NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_ConsultationMedications PRIMARY KEY (Id),
        CONSTRAINT CK_ConsMed_Doses CHECK (
            (DoseMorning   IS NULL OR DoseMorning   > 0) AND
            (DoseAfternoon IS NULL OR DoseAfternoon > 0) AND
            (DoseEvening   IS NULL OR DoseEvening   > 0)),
        CONSTRAINT FK_ConsMed_Clinic       FOREIGN KEY (ClinicId)       REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_ConsMed_Consultation FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id),
        CONSTRAINT FK_ConsMed_Drug         FOREIGN KEY (DrugCode)       REFERENCES dbo.Cnas_Drug(Code)
    );
    PRINT 'Tabel ConsultationMedications creat.';
END
ELSE
    PRINT 'Tabel ConsultationMedications exista deja - ignorat.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsMed_Consultation')
    CREATE INDEX IX_ConsMed_Consultation
        ON dbo.ConsultationMedications (ClinicId, ConsultationId, SortOrder)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsMed_Patient')
    CREATE INDEX IX_ConsMed_Patient
        ON dbo.ConsultationMedications (ClinicId, PatientId, CreatedAt DESC)
        WHERE IsDeleted = 0;
GO
