-- =============================================================================
-- SP: User_GetByEmailOrUsername — returnează utilizator după email sau username
--     (pentru autentificare — login cu email sau username)
--     @ClinicId NULL = căutare în toate clinicile (login flow)
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.User_GetByEmail
    @Email    NVARCHAR(200),
    @ClinicId UNIQUEIDENTIFIER = NULL
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
           u.MedicalStaffId,
           u.Username,
           u.Email,
           u.PasswordHash,
           u.FirstName,
           u.LastName,
           u.IsActive,
           u.LastLoginAt,
           u.FailedLoginAttempts,
           u.LockoutEnd
    FROM Users u
    INNER JOIN Roles r ON r.Id = u.RoleId
    WHERE (u.Email = @Email OR u.Username = @Email)
      AND (@ClinicId IS NULL OR u.ClinicId = @ClinicId)
      AND u.IsDeleted = 0;
END;
GO
