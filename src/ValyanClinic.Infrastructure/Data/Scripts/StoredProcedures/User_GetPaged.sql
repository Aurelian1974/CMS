-- =============================================================================
-- SP: User_GetPaged — listare paginată utilizatori cu căutare și sortare
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.User_GetPaged
    @ClinicId UNIQUEIDENTIFIER,
    @Search   NVARCHAR(200) = NULL,
    @RoleId   UNIQUEIDENTIFIER = NULL,
    @IsActive BIT           = NULL,
    @Page     INT           = 1,
    @PageSize INT           = 20,
    @SortBy   NVARCHAR(50)  = 'lastName',
    @SortDir  NVARCHAR(4)   = 'asc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    -- Result set 1: date paginate
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
           u.CreatedAt
    FROM Users u
    INNER JOIN Roles r ON r.Id = u.RoleId
    LEFT JOIN Doctors d ON d.Id = u.DoctorId AND d.IsDeleted = 0
    LEFT JOIN MedicalStaff ms ON ms.Id = u.MedicalStaffId AND ms.IsDeleted = 0
    WHERE u.ClinicId = @ClinicId
      AND u.IsDeleted = 0
      AND (@Search IS NULL OR @Search = ''
           OR u.FirstName LIKE '%' + @Search + '%'
           OR u.LastName  LIKE '%' + @Search + '%'
           OR u.Email     LIKE '%' + @Search + '%'
           OR u.Username  LIKE '%' + @Search + '%')
      AND (@RoleId IS NULL OR u.RoleId = @RoleId)
      AND (@IsActive IS NULL OR u.IsActive = @IsActive)
    ORDER BY
        CASE WHEN @SortBy = 'lastName'  AND @SortDir = 'asc'  THEN u.LastName  END ASC,
        CASE WHEN @SortBy = 'lastName'  AND @SortDir = 'desc' THEN u.LastName  END DESC,
        CASE WHEN @SortBy = 'firstName' AND @SortDir = 'asc'  THEN u.FirstName END ASC,
        CASE WHEN @SortBy = 'firstName' AND @SortDir = 'desc' THEN u.FirstName END DESC,
        CASE WHEN @SortBy = 'email'     AND @SortDir = 'asc'  THEN u.Email     END ASC,
        CASE WHEN @SortBy = 'email'     AND @SortDir = 'desc' THEN u.Email     END DESC,
        CASE WHEN @SortBy = 'username'  AND @SortDir = 'asc'  THEN u.Username  END ASC,
        CASE WHEN @SortBy = 'username'  AND @SortDir = 'desc' THEN u.Username  END DESC,
        CASE WHEN @SortBy = 'roleName'  AND @SortDir = 'asc'  THEN r.Name      END ASC,
        CASE WHEN @SortBy = 'roleName'  AND @SortDir = 'desc' THEN r.Name      END DESC,
        CASE WHEN @SortBy = 'createdAt' AND @SortDir = 'asc'  THEN u.CreatedAt END ASC,
        CASE WHEN @SortBy = 'createdAt' AND @SortDir = 'desc' THEN u.CreatedAt END DESC,
        u.LastName ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*)
    FROM Users u
    WHERE u.ClinicId = @ClinicId
      AND u.IsDeleted = 0
      AND (@Search IS NULL OR @Search = ''
           OR u.FirstName LIKE '%' + @Search + '%'
           OR u.LastName  LIKE '%' + @Search + '%'
           OR u.Email     LIKE '%' + @Search + '%'
           OR u.Username  LIKE '%' + @Search + '%')
      AND (@RoleId IS NULL OR u.RoleId = @RoleId)
      AND (@IsActive IS NULL OR u.IsActive = @IsActive);
END;
GO
