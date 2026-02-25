-- =============================================================================
-- SP: User_GetById — returnează detalii utilizator cu rol, doctor/staff asociat
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.User_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT u.Id,
           u.ClinicId,
           u.RoleId,
           r.Name     AS RoleName,
           r.Code     AS RoleCode,
           u.DoctorId,
           CASE WHEN d.Id IS NOT NULL
                THEN d.LastName + ' ' + d.FirstName
                ELSE NULL
           END        AS DoctorName,
           u.MedicalStaffId,
           CASE WHEN ms.Id IS NOT NULL
                THEN ms.LastName + ' ' + ms.FirstName
                ELSE NULL
           END        AS MedicalStaffName,
           u.Username,
           u.Email,
           u.FirstName,
           u.LastName,
           u.IsActive,
           u.LastLoginAt,
           u.FailedLoginAttempts,
           u.LockoutEnd,
           u.CreatedAt,
           u.UpdatedAt
    FROM Users u
    INNER JOIN Roles r ON r.Id = u.RoleId
    LEFT JOIN Doctors d ON d.Id = u.DoctorId AND d.IsDeleted = 0
    LEFT JOIN MedicalStaff ms ON ms.Id = u.MedicalStaffId AND ms.IsDeleted = 0
    WHERE u.Id = @Id
      AND u.ClinicId = @ClinicId
      AND u.IsDeleted = 0;
END;
GO
