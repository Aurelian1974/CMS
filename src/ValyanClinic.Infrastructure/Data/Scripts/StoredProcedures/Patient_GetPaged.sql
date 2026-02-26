-- ============================================================
-- Patient_GetPaged — listare paginată cu căutare și filtre
-- Result set 1: pacienți paginați (cu nr. alergii și doctor primar)
-- Result set 2: total count
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_GetPaged
    @ClinicId    UNIQUEIDENTIFIER,
    @Search      NVARCHAR(200)    = NULL,
    @GenderId    UNIQUEIDENTIFIER = NULL,
    @DoctorId    UNIQUEIDENTIFIER = NULL,
    @HasAllergies BIT             = NULL,
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
        p.Id,
        p.ClinicId,
        p.PatientCode,
        p.FirstName,
        p.LastName,
        p.FirstName + ' ' + p.LastName AS FullName,
        p.Cnp,
        p.BirthDate,
        CASE WHEN p.BirthDate IS NOT NULL
             THEN DATEDIFF(YEAR, p.BirthDate, GETDATE())
                  - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.BirthDate, GETDATE()), p.BirthDate) > GETDATE()
                         THEN 1 ELSE 0 END
             ELSE NULL END AS Age,
        p.GenderId,
        g.Name                  AS GenderName,
        p.BloodTypeId,
        bt.Name                 AS BloodTypeName,
        p.PhoneNumber,
        p.Email,
        p.Address,
        p.InsuranceNumber,
        p.InsuranceExpiry,
        p.IsActive,
        p.CreatedAt,
        -- Număr alergii active
        (SELECT COUNT(*) FROM PatientAllergies pa
         WHERE pa.PatientId = p.Id AND pa.IsActive = 1) AS AllergyCount,
        -- Severitatea maximă a alergiilor (pentru badge)
        (SELECT TOP 1 asev.Code FROM PatientAllergies pa
         INNER JOIN AllergySeverities asev ON asev.Id = pa.AllergySeverityId
         WHERE pa.PatientId = p.Id AND pa.IsActive = 1
         ORDER BY CASE asev.Code
             WHEN 'ANAPHYLAXIS' THEN 1
             WHEN 'SEVERE' THEN 2
             WHEN 'MODERATE' THEN 3
             WHEN 'MILD' THEN 4
             ELSE 5
         END) AS MaxAllergySeverityCode,
        -- Doctor primar
        (SELECT TOP 1 d.FirstName + ' ' + d.LastName
         FROM PatientDoctors pd
         INNER JOIN Doctors d ON d.Id = pd.DoctorId AND d.IsDeleted = 0
         WHERE pd.PatientId = p.Id AND pd.IsPrimary = 1 AND pd.IsActive = 1
        ) AS PrimaryDoctorName
    FROM Patients p
    LEFT JOIN Genders    g  ON g.Id  = p.GenderId    AND g.IsActive = 1
    LEFT JOIN BloodTypes bt ON bt.Id = p.BloodTypeId  AND bt.IsActive = 1
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND (@IsActive IS NULL OR p.IsActive = @IsActive)
      AND (@GenderId IS NULL OR p.GenderId = @GenderId)
      AND (@DoctorId IS NULL OR EXISTS (
          SELECT 1 FROM PatientDoctors pd
          WHERE pd.PatientId = p.Id AND pd.DoctorId = @DoctorId AND pd.IsActive = 1
      ))
      AND (@HasAllergies IS NULL OR
          (@HasAllergies = 1 AND EXISTS (SELECT 1 FROM PatientAllergies pa WHERE pa.PatientId = p.Id AND pa.IsActive = 1)) OR
          (@HasAllergies = 0 AND NOT EXISTS (SELECT 1 FROM PatientAllergies pa WHERE pa.PatientId = p.Id AND pa.IsActive = 1))
      )
      AND (@Search IS NULL OR @Search = '' OR
           p.FirstName    LIKE @SearchTerm OR
           p.LastName     LIKE @SearchTerm OR
           p.Cnp          LIKE @SearchTerm OR
           p.Email        LIKE @SearchTerm OR
           p.PhoneNumber  LIKE @SearchTerm OR
           p.PatientCode  LIKE @SearchTerm)
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'PatientCode' THEN p.PatientCode
                WHEN 'FirstName'  THEN p.FirstName
                WHEN 'LastName'   THEN p.LastName
                WHEN 'Email'      THEN p.Email
                WHEN 'Cnp'        THEN p.Cnp
                WHEN 'GenderName' THEN g.Name
                ELSE p.LastName
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'FirstName'  THEN p.FirstName
                WHEN 'LastName'   THEN p.LastName
                WHEN 'Email'      THEN p.Email
                WHEN 'Cnp'        THEN p.Cnp
                WHEN 'GenderName' THEN g.Name
                ELSE p.LastName
            END
        END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count (aceleași filtre)
    SELECT COUNT(*)
    FROM Patients p
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND (@IsActive IS NULL OR p.IsActive = @IsActive)
      AND (@GenderId IS NULL OR p.GenderId = @GenderId)
      AND (@DoctorId IS NULL OR EXISTS (
          SELECT 1 FROM PatientDoctors pd
          WHERE pd.PatientId = p.Id AND pd.DoctorId = @DoctorId AND pd.IsActive = 1
      ))
      AND (@HasAllergies IS NULL OR
          (@HasAllergies = 1 AND EXISTS (SELECT 1 FROM PatientAllergies pa WHERE pa.PatientId = p.Id AND pa.IsActive = 1)) OR
          (@HasAllergies = 0 AND NOT EXISTS (SELECT 1 FROM PatientAllergies pa WHERE pa.PatientId = p.Id AND pa.IsActive = 1))
      )
      AND (@Search IS NULL OR @Search = '' OR
           p.FirstName    LIKE @SearchTerm OR
           p.LastName     LIKE @SearchTerm OR
           p.Cnp          LIKE @SearchTerm OR
           p.Email        LIKE @SearchTerm OR
           p.PhoneNumber  LIKE @SearchTerm OR
           p.PatientCode  LIKE @SearchTerm);

    -- Result set 3: statistici (total, activi, cu alergii, noi luna curentă)
    SELECT
        (SELECT COUNT(*) FROM Patients WHERE ClinicId = @ClinicId AND IsDeleted = 0) AS TotalPatients,
        (SELECT COUNT(*) FROM Patients WHERE ClinicId = @ClinicId AND IsDeleted = 0 AND IsActive = 1) AS ActivePatients,
        (SELECT COUNT(DISTINCT pa.PatientId) FROM PatientAllergies pa
         INNER JOIN Patients p2 ON p2.Id = pa.PatientId AND p2.IsDeleted = 0
         WHERE p2.ClinicId = @ClinicId AND pa.IsActive = 1) AS PatientsWithAllergies,
        (SELECT COUNT(*) FROM Patients
         WHERE ClinicId = @ClinicId AND IsDeleted = 0
           AND CreatedAt >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)) AS NewThisMonth;
END;
GO
