-- ============================================================
-- AdministrativeStaff_GetPaged — listare paginată cu căutare și filtre
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.AdministrativeStaff_GetPaged
    @ClinicId     UNIQUEIDENTIFIER,
    @Search       NVARCHAR(200)    = NULL,
    @DepartmentId UNIQUEIDENTIFIER = NULL,
    @PositionId   UNIQUEIDENTIFIER = NULL,
    @IsActive     BIT              = NULL,
    @Page         INT              = 1,
    @PageSize     INT              = 20,
    @SortBy       NVARCHAR(50)     = 'LastName',
    @SortDir      NVARCHAR(4)      = 'asc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    DECLARE @SearchTerm NVARCHAR(202) = '%' + ISNULL(@Search, '') + '%';

    -- Result set 1: date paginate
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
        s.CreatedAt
    FROM dbo.AdministrativeStaff s
    LEFT JOIN dbo.Departments             dep ON dep.Id = s.DepartmentId AND dep.IsDeleted = 0
    LEFT JOIN dbo.AdministrativePositions pos ON pos.Id = s.PositionId
    WHERE s.ClinicId = @ClinicId
      AND s.IsDeleted = 0
      AND (@IsActive IS NULL OR s.IsActive = @IsActive)
      AND (@DepartmentId IS NULL OR s.DepartmentId = @DepartmentId)
      AND (@PositionId IS NULL OR s.PositionId = @PositionId)
      AND (@Search IS NULL OR @Search = '' OR
           s.FirstName COLLATE Latin1_General_CI_AI LIKE @SearchTerm OR
           s.LastName  COLLATE Latin1_General_CI_AI LIKE @SearchTerm OR
           s.Email     COLLATE Latin1_General_CI_AI LIKE @SearchTerm OR
           pos.Name    COLLATE Latin1_General_CI_AI LIKE @SearchTerm)
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'FirstName'      THEN s.FirstName
                WHEN 'LastName'       THEN s.LastName
                WHEN 'Email'          THEN s.Email
                WHEN 'DepartmentName' THEN dep.Name
                WHEN 'PositionName'   THEN pos.Name
                ELSE s.LastName
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'FirstName'      THEN s.FirstName
                WHEN 'LastName'       THEN s.LastName
                WHEN 'Email'          THEN s.Email
                WHEN 'DepartmentName' THEN dep.Name
                WHEN 'PositionName'   THEN pos.Name
                ELSE s.LastName
            END
        END DESC,
        s.LastName ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*)
    FROM dbo.AdministrativeStaff s
    LEFT JOIN dbo.AdministrativePositions pos ON pos.Id = s.PositionId
    WHERE s.ClinicId = @ClinicId
      AND s.IsDeleted = 0
      AND (@IsActive IS NULL OR s.IsActive = @IsActive)
      AND (@DepartmentId IS NULL OR s.DepartmentId = @DepartmentId)
      AND (@PositionId IS NULL OR s.PositionId = @PositionId)
      AND (@Search IS NULL OR @Search = '' OR
           s.FirstName COLLATE Latin1_General_CI_AI LIKE @SearchTerm OR
           s.LastName  COLLATE Latin1_General_CI_AI LIKE @SearchTerm OR
           s.Email     COLLATE Latin1_General_CI_AI LIKE @SearchTerm OR
           pos.Name    COLLATE Latin1_General_CI_AI LIKE @SearchTerm);
END;
GO
