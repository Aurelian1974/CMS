-- ============================================================
-- Doctor_GetPaged — listare paginată cu căutare și filtre
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.Doctor_GetPaged
    @ClinicId    UNIQUEIDENTIFIER,
    @Search      NVARCHAR(200)    = NULL,
    @SpecialtyId UNIQUEIDENTIFIER = NULL,
    @DepartmentId UNIQUEIDENTIFIER = NULL,
    @IsActive    BIT              = NULL,
    @Page        INT              = 1,
    @PageSize    INT              = 20,
    @SortBy      NVARCHAR(50)     = 'LastName',
    @SortDir     NVARCHAR(4)      = 'asc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    DECLARE @SearchTerm NVARCHAR(202) = '%' + ISNULL(@Search, '') + '%';

    -- Result set 1: date paginate
    SELECT
        d.Id,
        d.ClinicId,
        d.DepartmentId,
        dep.Name                AS DepartmentName,
        d.SupervisorDoctorId,
        sup.FirstName + ' ' + sup.LastName AS SupervisorName,
        d.SpecialtyId,
        sp.Name                 AS SpecialtyName,
        d.SubspecialtyId,
        ssp.Name                AS SubspecialtyName,
        d.FirstName,
        d.LastName,
        d.FirstName + ' ' + d.LastName AS FullName,
        d.Email,
        d.PhoneNumber,
        d.MedicalCode,
        d.LicenseNumber,
        d.LicenseExpiresAt,
        d.IsActive,
        d.CreatedAt
    FROM Doctors d
    LEFT JOIN Departments  dep ON dep.Id = d.DepartmentId       AND dep.IsDeleted = 0
    LEFT JOIN Doctors      sup ON sup.Id = d.SupervisorDoctorId AND sup.IsDeleted = 0
    LEFT JOIN Specialties  sp  ON sp.Id  = d.SpecialtyId        AND sp.IsActive = 1
    LEFT JOIN Specialties  ssp ON ssp.Id = d.SubspecialtyId     AND ssp.IsActive = 1
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND (@IsActive IS NULL OR d.IsActive = @IsActive)
      AND (@SpecialtyId IS NULL OR d.SpecialtyId = @SpecialtyId)
      AND (@DepartmentId IS NULL OR d.DepartmentId = @DepartmentId)
      AND (@Search IS NULL OR @Search = '' OR
           d.FirstName LIKE @SearchTerm OR
           d.LastName  LIKE @SearchTerm OR
           d.Email     LIKE @SearchTerm OR
           d.MedicalCode LIKE @SearchTerm OR
           sp.Name     LIKE @SearchTerm OR
           ssp.Name    LIKE @SearchTerm)
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'FirstName'    THEN d.FirstName
                WHEN 'LastName'     THEN d.LastName
                WHEN 'Email'        THEN d.Email
                WHEN 'SpecialtyName' THEN sp.Name
                WHEN 'MedicalCode'  THEN d.MedicalCode
                ELSE d.LastName
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'FirstName'    THEN d.FirstName
                WHEN 'LastName'     THEN d.LastName
                WHEN 'Email'        THEN d.Email
                WHEN 'SpecialtyName' THEN sp.Name
                WHEN 'MedicalCode'  THEN d.MedicalCode
                ELSE d.LastName
            END
        END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*)
    FROM Doctors d
    LEFT JOIN Specialties sp  ON sp.Id  = d.SpecialtyId    AND sp.IsActive = 1
    LEFT JOIN Specialties ssp ON ssp.Id = d.SubspecialtyId AND ssp.IsActive = 1
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND (@IsActive IS NULL OR d.IsActive = @IsActive)
      AND (@SpecialtyId IS NULL OR d.SpecialtyId = @SpecialtyId)
      AND (@DepartmentId IS NULL OR d.DepartmentId = @DepartmentId)
      AND (@Search IS NULL OR @Search = '' OR
           d.FirstName LIKE @SearchTerm OR
           d.LastName  LIKE @SearchTerm OR
           d.Email     LIKE @SearchTerm OR
           d.MedicalCode LIKE @SearchTerm OR
           sp.Name     LIKE @SearchTerm OR
           ssp.Name    LIKE @SearchTerm);
END;
GO
