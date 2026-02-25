-- ============================================================
-- Doctor_GetById — obține detalii doctor cu JOIN-uri pe nomenclatoare
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.Doctor_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        d.Id,
        d.ClinicId,
        d.DepartmentId,
        dep.Name                AS DepartmentName,
        d.SupervisorDoctorId,
        sup.FirstName + ' ' + sup.LastName AS SupervisorName,
        d.SpecialtyId,
        sp.Name                 AS SpecialtyName,
        d.SubspecialtyId,
        ssp.Name                AS SubspecialtyName,
        d.FirstName,
        d.LastName,
        d.FirstName + ' ' + d.LastName AS FullName,
        d.Email,
        d.PhoneNumber,
        d.MedicalCode,
        d.LicenseNumber,
        d.LicenseExpiresAt,
        d.IsActive,
        d.CreatedAt,
        d.UpdatedAt
    FROM Doctors d
    LEFT JOIN Departments  dep ON dep.Id = d.DepartmentId       AND dep.IsDeleted = 0
    LEFT JOIN Doctors      sup ON sup.Id = d.SupervisorDoctorId AND sup.IsDeleted = 0
    LEFT JOIN Specialties  sp  ON sp.Id  = d.SpecialtyId        AND sp.IsActive = 1
    LEFT JOIN Specialties  ssp ON ssp.Id = d.SubspecialtyId     AND ssp.IsActive = 1
    WHERE d.Id = @Id
      AND d.ClinicId = @ClinicId
      AND d.IsDeleted = 0;
END;
GO
