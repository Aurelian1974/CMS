-- ============================================================
-- MedicalStaff_GetByClinic — listă simplă pentru dropdown-uri / departamente detail
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.MedicalStaff_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        ms.Id,
        ms.FirstName + ' ' + ms.LastName AS FullName,
        ms.FirstName,
        ms.LastName,
        ms.Email,
        ms.DepartmentId,
        dep.Name                         AS DepartmentName,
        ms.MedicalTitleId,
        mt.Name                          AS MedicalTitleName
    FROM MedicalStaff ms
    LEFT JOIN Departments   dep ON dep.Id = ms.DepartmentId   AND dep.IsDeleted = 0
    LEFT JOIN MedicalTitles mt  ON mt.Id  = ms.MedicalTitleId AND mt.IsActive  = 1
    WHERE ms.ClinicId  = @ClinicId
      AND ms.IsDeleted = 0
      AND ms.IsActive  = 1
    ORDER BY ms.LastName, ms.FirstName;
END;
GO
