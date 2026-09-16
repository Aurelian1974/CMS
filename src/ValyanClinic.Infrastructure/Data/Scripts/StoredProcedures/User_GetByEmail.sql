-- =============================================================================
-- SP: User_GetByEmailOrUsername — returnează utilizator după email sau username
--     (pentru autentificare — login cu email sau username)
--     @ClinicId NULL = căutare în toate clinicile (login flow)
--
-- TOP 1 cu ordonare explicită: migrarea 0043 garantează unicitatea globală pe
-- Email și Username, dar ordonarea face rezultatul determinist chiar dacă un
-- rând scapă constrângerii — potrivirea pe email are prioritate față de username.
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.User_GetByEmail
    @Email    NVARCHAR(200),
    @ClinicId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT TOP 1
           u.Id,
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
           u.LockoutEnd,
           u.MustChangePassword,
           u.PasswordChangedAt
    FROM Users u
    INNER JOIN Roles r ON r.Id = u.RoleId
    WHERE (u.Email = @Email OR u.Username = @Email)
      AND (@ClinicId IS NULL OR u.ClinicId = @ClinicId)
      AND u.IsDeleted = 0
    ORDER BY CASE WHEN u.Email = @Email THEN 0 ELSE 1 END, u.Id;
END;
GO
