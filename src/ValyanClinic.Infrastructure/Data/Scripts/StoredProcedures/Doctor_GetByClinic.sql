-- ============================================================
-- Doctor_GetByClinic — listă simplă pentru dropdown-uri
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.Doctor_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        d.Id,
        d.FirstName + ' ' + d.LastName AS FullName,
        d.FirstName,
        d.LastName,
        d.Email,
        d.MedicalCode,
        d.SpecialtyId,
        sp.Name AS SpecialtyName,
        d.DepartmentId,
        dep.Name AS DepartmentName
    FROM Doctors d
    LEFT JOIN Specialties sp   ON sp.Id  = d.SpecialtyId   AND sp.IsActive = 1
    LEFT JOIN Departments dep  ON dep.Id = d.DepartmentId   AND dep.IsDeleted = 0
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND d.IsActive = 1
    ORDER BY d.LastName, d.FirstName;
END;
GO
