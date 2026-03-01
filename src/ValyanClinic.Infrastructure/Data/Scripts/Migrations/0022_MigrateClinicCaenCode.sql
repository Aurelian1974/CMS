-- ============================================================================
-- Migrare 0022: Migrare date CaenCode → ClinicCaenCodes + drop coloana veche
-- IMPORTANT: rulat DUPĂ ce SP-urile (Clinic_GetById, Clinic_Update etc.)
--            sunt deja actualizate să nu mai refere coloana CaenCode
-- ============================================================================

-- Pasul 1: Migrare valori existente din Clinics.CaenCode → ClinicCaenCodes
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Clinics' AND COLUMN_NAME = 'CaenCode'
)
BEGIN
    INSERT INTO ClinicCaenCodes (ClinicId, CaenCodeId, IsPrimary)
    SELECT c.Id, cc.Id, 1   -- marcat ca primar
    FROM Clinics c
    INNER JOIN CaenCodes cc ON cc.Code = c.CaenCode AND cc.IsActive = 1
    WHERE c.CaenCode IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM ClinicCaenCodes ccc
          WHERE ccc.ClinicId = c.Id AND ccc.CaenCodeId = cc.Id
      );

    PRINT '0022 — date CaenCode migrate din Clinics → ClinicCaenCodes.';
END;
GO

-- Pasul 2: Drop coloana CaenCode din Clinics
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Clinics' AND COLUMN_NAME = 'CaenCode'
)
BEGIN
    ALTER TABLE Clinics DROP COLUMN CaenCode;
    PRINT '0022 OK — coloana Clinics.CaenCode ștearsă.';
END
ELSE
BEGIN
    PRINT '0022 SKIP — coloana CaenCode nu există (deja ștearsă).';
END;
GO
