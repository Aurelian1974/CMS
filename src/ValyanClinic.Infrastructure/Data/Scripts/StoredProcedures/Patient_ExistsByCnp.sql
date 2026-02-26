-- ============================================================
-- Patient_ExistsByCnp — verificare existență CNP per clinică
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_ExistsByCnp
    @Cnp      NCHAR(13),
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT CAST(
        CASE WHEN EXISTS (
            SELECT 1 FROM Patients
            WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0
        ) THEN 1 ELSE 0 END
    AS BIT);
END;
GO
