-- =============================================================================
-- SP: User_GetByIdForAuth — returnează datele necesare pentru generarea token-ului JWT
--     (folosit de RefreshToken flow când avem UserId dar nu email)
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.User_GetByIdForAuth
    @Id UNIQUEIDENTIFIER
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
    WHERE u.Id = @Id
      AND u.IsDeleted = 0;
END;
GO
