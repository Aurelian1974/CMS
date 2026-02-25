-- ============================================================
-- MedicalStaff_GetById — obține detalii personal medical cu JOIN-uri
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.MedicalStaff_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        ms.Id,
        ms.ClinicId,
        ms.DepartmentId,
        dep.Name                AS DepartmentName,
        ms.SupervisorDoctorId,
        sup.FirstName + ' ' + sup.LastName AS SupervisorName,
        ms.MedicalTitleId,
        mt.Name                 AS MedicalTitleName,
        ms.FirstName,
        ms.LastName,
        ms.FirstName + ' ' + ms.LastName AS FullName,
        ms.Email,
        ms.PhoneNumber,
        ms.IsActive,
        ms.CreatedAt,
        ms.UpdatedAt
    FROM MedicalStaff ms
    LEFT JOIN Departments   dep ON dep.Id = ms.DepartmentId       AND dep.IsDeleted = 0
    LEFT JOIN Doctors       sup ON sup.Id = ms.SupervisorDoctorId AND sup.IsDeleted = 0
    LEFT JOIN MedicalTitles mt  ON mt.Id  = ms.MedicalTitleId     AND mt.IsActive = 1
    WHERE ms.Id = @Id
      AND ms.ClinicId = @ClinicId
      AND ms.IsDeleted = 0;
END;
GO
