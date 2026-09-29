-- ============================================================
-- AdministrativeStaff_GetById — detalii personal administrativ
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.AdministrativeStaff_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        s.Id,
        s.ClinicId,
        s.DepartmentId,
        dep.Name                       AS DepartmentName,
        s.PositionId,
        pos.Name                       AS PositionName,
        s.FirstName,
        s.LastName,
        s.FirstName + ' ' + s.LastName AS FullName,
        s.Email,
        s.PhoneNumber,
        s.IsActive,
        s.CreatedAt,
        s.UpdatedAt
    FROM dbo.AdministrativeStaff s
    LEFT JOIN dbo.Departments             dep ON dep.Id = s.DepartmentId AND dep.IsDeleted = 0
    LEFT JOIN dbo.AdministrativePositions pos ON pos.Id = s.PositionId
    WHERE s.Id = @Id
      AND s.ClinicId = @ClinicId
      AND s.IsDeleted = 0;
END;
GO
