-- ============================================================================
-- Migrare 0054: Servicii pe consultație (linii de plată)
-- Prețul și regimul TVA sunt SNAPSHOT la momentul adăugării — modificarea
-- ulterioară a tarifului nu afectează linia.
-- LineTotal = ROUND(UnitPrice × Quantity, 2), calculat de server (coloană persistată).
-- Rollback: Scripts/Rollback/0054_Rollback_CreateConsultationServices.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConsultationServices')
BEGIN
    CREATE TABLE dbo.ConsultationServices (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ConsultationServices_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId         UNIQUEIDENTIFIER NOT NULL,
        ConsultationId   UNIQUEIDENTIFIER NOT NULL,
        MedicalServiceId UNIQUEIDENTIFIER NOT NULL,
        ServiceCode      NVARCHAR(30)     NOT NULL,
        ServiceName      NVARCHAR(200)    NOT NULL,
        UnitPrice        DECIMAL(18,2)    NOT NULL,
        Quantity         DECIMAL(10,3)    NOT NULL CONSTRAINT DF_ConsultationServices_Quantity DEFAULT 1,
        LineTotal        AS CAST(ROUND(UnitPrice * Quantity, 2) AS DECIMAL(18,2)) PERSISTED,
        VatRateId        UNIQUEIDENTIFIER NOT NULL,
        VatPercent       DECIMAL(5,2)     NOT NULL,
        VatCategoryCode  NVARCHAR(3)      NOT NULL,
        SortOrder        INT              NOT NULL CONSTRAINT DF_ConsultationServices_SortOrder DEFAULT 0,
        IsDeleted        BIT              NOT NULL CONSTRAINT DF_ConsultationServices_IsDeleted DEFAULT 0,
        CreatedAt        DATETIME2(0)     NOT NULL CONSTRAINT DF_ConsultationServices_CreatedAt DEFAULT GETDATE(),
        CreatedBy        UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt        DATETIME2(0)     NULL,
        UpdatedBy        UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_ConsultationServices PRIMARY KEY (Id),
        CONSTRAINT FK_ConsultationServices_Clinics       FOREIGN KEY (ClinicId)         REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_ConsultationServices_Consultations FOREIGN KEY (ConsultationId)   REFERENCES dbo.Consultations(Id),
        CONSTRAINT FK_ConsultationServices_Services      FOREIGN KEY (MedicalServiceId) REFERENCES dbo.MedicalServices(Id),
        CONSTRAINT FK_ConsultationServices_VatRates      FOREIGN KEY (VatRateId)        REFERENCES dbo.VatRates(Id),
        CONSTRAINT CK_ConsultationServices_UnitPrice CHECK (UnitPrice >= 0),
        CONSTRAINT CK_ConsultationServices_Quantity  CHECK (Quantity > 0)
    );

    CREATE NONCLUSTERED INDEX IX_ConsultationServices_Consultation
        ON dbo.ConsultationServices (ConsultationId, IsDeleted)
        INCLUDE (ClinicId, UnitPrice, Quantity, LineTotal, SortOrder);

    PRINT 'Tabel ConsultationServices creat.';
END
GO

PRINT 'Migrarea 0054_CreateConsultationServices finalizata cu succes.';
GO
