-- ============================================================
-- MedicalStaff_GetPaged — listare paginată cu căutare și filtre
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.MedicalStaff_GetPaged
    @ClinicId       UNIQUEIDENTIFIER,
    @Search         NVARCHAR(200)    = NULL,
    @DepartmentId   UNIQUEIDENTIFIER = NULL,
    @MedicalTitleId UNIQUEIDENTIFIER = NULL,
    @IsActive       BIT              = NULL,
    @Page           INT              = 1,
    @PageSize       INT              = 20,
    @SortBy         NVARCHAR(50)     = 'LastName',
    @SortDir        NVARCHAR(4)      = 'asc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    DECLARE @SearchTerm NVARCHAR(202) = '%' + ISNULL(@Search, '') + '%';

    -- Result set 1: date paginate
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
        ms.CreatedAt
    FROM MedicalStaff ms
    LEFT JOIN Departments   dep ON dep.Id = ms.DepartmentId       AND dep.IsDeleted = 0
    LEFT JOIN Doctors       sup ON sup.Id = ms.SupervisorDoctorId AND sup.IsDeleted = 0
    LEFT JOIN MedicalTitles mt  ON mt.Id  = ms.MedicalTitleId     AND mt.IsActive = 1
    WHERE ms.ClinicId = @ClinicId
      AND ms.IsDeleted = 0
      AND (@IsActive IS NULL OR ms.IsActive = @IsActive)
      AND (@DepartmentId IS NULL OR ms.DepartmentId = @DepartmentId)
      AND (@MedicalTitleId IS NULL OR ms.MedicalTitleId = @MedicalTitleId)
      AND (@Search IS NULL OR @Search = '' OR
           ms.FirstName LIKE @SearchTerm OR
           ms.LastName  LIKE @SearchTerm OR
           ms.Email     LIKE @SearchTerm OR
           mt.Name      LIKE @SearchTerm)
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'FirstName'        THEN ms.FirstName
                WHEN 'LastName'         THEN ms.LastName
                WHEN 'Email'            THEN ms.Email
                WHEN 'DepartmentName'   THEN dep.Name
                WHEN 'MedicalTitleName' THEN mt.Name
                ELSE ms.LastName
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'FirstName'        THEN ms.FirstName
                WHEN 'LastName'         THEN ms.LastName
                WHEN 'Email'            THEN ms.Email
                WHEN 'DepartmentName'   THEN dep.Name
                WHEN 'MedicalTitleName' THEN mt.Name
                ELSE ms.LastName
            END
        END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*)
    FROM MedicalStaff ms
    LEFT JOIN MedicalTitles mt ON mt.Id = ms.MedicalTitleId AND mt.IsActive = 1
    WHERE ms.ClinicId = @ClinicId
      AND ms.IsDeleted = 0
      AND (@IsActive IS NULL OR ms.IsActive = @IsActive)
      AND (@DepartmentId IS NULL OR ms.DepartmentId = @DepartmentId)
      AND (@MedicalTitleId IS NULL OR ms.MedicalTitleId = @MedicalTitleId)
      AND (@Search IS NULL OR @Search = '' OR
           ms.FirstName LIKE @SearchTerm OR
           ms.LastName  LIKE @SearchTerm OR
           ms.Email     LIKE @SearchTerm OR
           mt.Name      LIKE @SearchTerm);
END;
GO
