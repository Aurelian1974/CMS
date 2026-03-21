-- ============================================================
-- Patient_GetPaged — listare paginată cu căutare și filtre
-- Result set 1: pacienți paginați (cu nr. alergii și doctor primar)
-- Result set 2: total count
-- Result set 3: statistici globale clinică
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_GetPaged
    @ClinicId    UNIQUEIDENTIFIER,
    @Search      NVARCHAR(200)    = NULL,
    @GenderId    UNIQUEIDENTIFIER = NULL,
    @DoctorId    UNIQUEIDENTIFIER = NULL,
    @HasAllergies BIT             = NULL,
    @BloodTypeId  UNIQUEIDENTIFIER = NULL,
    @IsActive    BIT              = NULL,
    @Page        INT              = 1,
    @PageSize    INT              = 20,
    @SortBy      NVARCHAR(50)     = 'LastName',
    @SortDir     NVARCHAR(4)      = 'asc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Copiem parametrii în variabile locale pentru a evita parameter sniffing.
    -- SQL Server generează planul de execuție pe baza valorilor locale,
    -- nu pe baza valorilor cu care a fost apelat prima dată procedura.
    DECLARE @ClinicId_     UNIQUEIDENTIFIER = @ClinicId;
    DECLARE @Search_       NVARCHAR(200)    = @Search;
    DECLARE @GenderId_     UNIQUEIDENTIFIER = @GenderId;
    DECLARE @DoctorId_     UNIQUEIDENTIFIER = @DoctorId;
    DECLARE @HasAllergies_ BIT              = @HasAllergies;
    DECLARE @BloodTypeId_  UNIQUEIDENTIFIER = @BloodTypeId;
    DECLARE @IsActive_     BIT              = @IsActive;
    DECLARE @Page_         INT              = @Page;
    DECLARE @PageSize_     INT              = @PageSize;
    DECLARE @SortBy_       NVARCHAR(50)     = @SortBy;
    DECLARE @SortDir_      NVARCHAR(4)      = @SortDir;

    DECLARE @Offset INT = (@Page_ - 1) * @PageSize_;
    DECLARE @SearchTerm NVARCHAR(202) = '%' + ISNULL(@Search_, '') + '%';

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
        -- Număr alergii active — OUTER APPLY (mai eficient decât subquery corelat)
        ISNULL(ac.AllergyCount, 0)          AS AllergyCount,
        msev.Code                           AS MaxAllergySeverityCode,
        pd_doc.DoctorName                   AS PrimaryDoctorName
    FROM Patients p
    LEFT JOIN Genders    g  ON g.Id  = p.GenderId    AND g.IsActive = 1
    LEFT JOIN BloodTypes bt ON bt.Id = p.BloodTypeId  AND bt.IsActive = 1
    -- Număr alergii active
    OUTER APPLY (
        SELECT COUNT(*) AS AllergyCount
        FROM PatientAllergies pa
        WHERE pa.PatientId = p.Id AND pa.IsActive = 1
    ) ac
    -- Severitatea maximă (rang numeric, ORDER BY pentru TOP 1)
    OUTER APPLY (
        SELECT TOP 1 asev.Code
        FROM PatientAllergies pa
        INNER JOIN AllergySeverities asev ON asev.Id = pa.AllergySeverityId
        WHERE pa.PatientId = p.Id AND pa.IsActive = 1
        ORDER BY CASE asev.Code
            WHEN 'ANAPHYLAXIS' THEN 1
            WHEN 'SEVERE'      THEN 2
            WHEN 'MODERATE'    THEN 3
            WHEN 'MILD'        THEN 4
            ELSE 5
        END
    ) msev(Code)
    -- Doctor primar
    OUTER APPLY (
        SELECT TOP 1 d.FirstName + ' ' + d.LastName AS DoctorName
        FROM PatientDoctors pd
        INNER JOIN Doctors d ON d.Id = pd.DoctorId AND d.IsDeleted = 0
        WHERE pd.PatientId = p.Id AND pd.IsPrimary = 1 AND pd.IsActive = 1
    ) pd_doc
    WHERE p.ClinicId = @ClinicId_
      AND p.IsDeleted = 0
      AND (@IsActive_     IS NULL OR p.IsActive    = @IsActive_)
      AND (@GenderId_     IS NULL OR p.GenderId    = @GenderId_)
      AND (@BloodTypeId_  IS NULL OR p.BloodTypeId = @BloodTypeId_)
      AND (@DoctorId_     IS NULL OR EXISTS (
              SELECT 1 FROM PatientDoctors pd2
              WHERE pd2.PatientId = p.Id AND pd2.DoctorId = @DoctorId_ AND pd2.IsActive = 1
          ))
      AND (@HasAllergies_ IS NULL
           OR (@HasAllergies_ = 1 AND EXISTS (
                   SELECT 1 FROM PatientAllergies pa2
                   WHERE pa2.PatientId = p.Id AND pa2.IsActive = 1))
           OR (@HasAllergies_ = 0 AND NOT EXISTS (
                   SELECT 1 FROM PatientAllergies pa2
                   WHERE pa2.PatientId = p.Id AND pa2.IsActive = 1)))
      AND (@Search_ IS NULL OR @Search_ = '' OR
           p.FirstName   LIKE @SearchTerm OR
           p.LastName    LIKE @SearchTerm OR
           p.Cnp         LIKE @SearchTerm OR
           p.Email       LIKE @SearchTerm OR
           p.PhoneNumber LIKE @SearchTerm OR
           p.PatientCode LIKE @SearchTerm)
    ORDER BY
        CASE WHEN @SortDir_ = 'asc' THEN
            CASE @SortBy_
                WHEN 'patientCode' THEN p.PatientCode
                WHEN 'PatientCode' THEN p.PatientCode
                WHEN 'firstName'   THEN p.FirstName
                WHEN 'FirstName'   THEN p.FirstName
                WHEN 'lastName'    THEN p.LastName
                WHEN 'LastName'    THEN p.LastName
                WHEN 'fullName'    THEN p.LastName
                WHEN 'FullName'    THEN p.LastName
                WHEN 'email'       THEN p.Email
                WHEN 'Email'       THEN p.Email
                WHEN 'cnp'         THEN p.Cnp
                WHEN 'Cnp'         THEN p.Cnp
                WHEN 'genderName'  THEN g.Name
                WHEN 'GenderName'  THEN g.Name
                ELSE p.LastName
            END
        END ASC,
        CASE WHEN @SortDir_ = 'desc' THEN
            CASE @SortBy_
                WHEN 'patientCode' THEN p.PatientCode
                WHEN 'PatientCode' THEN p.PatientCode
                WHEN 'firstName'   THEN p.FirstName
                WHEN 'FirstName'   THEN p.FirstName
                WHEN 'lastName'    THEN p.LastName
                WHEN 'LastName'    THEN p.LastName
                WHEN 'fullName'    THEN p.LastName
                WHEN 'FullName'    THEN p.LastName
                WHEN 'email'       THEN p.Email
                WHEN 'Email'       THEN p.Email
                WHEN 'cnp'         THEN p.Cnp
                WHEN 'Cnp'         THEN p.Cnp
                WHEN 'genderName'  THEN g.Name
                WHEN 'GenderName'  THEN g.Name
                ELSE p.LastName
            END
        END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize_ ROWS ONLY
    OPTION (RECOMPILE);

    -- Result set 2: total count (aceleași filtre, fără paginare)
    SELECT COUNT(*)
    FROM Patients p
    WHERE p.ClinicId = @ClinicId_
      AND p.IsDeleted = 0
      AND (@IsActive_     IS NULL OR p.IsActive    = @IsActive_)
      AND (@GenderId_     IS NULL OR p.GenderId    = @GenderId_)
      AND (@BloodTypeId_  IS NULL OR p.BloodTypeId = @BloodTypeId_)
      AND (@DoctorId_     IS NULL OR EXISTS (
              SELECT 1 FROM PatientDoctors pd2
              WHERE pd2.PatientId = p.Id AND pd2.DoctorId = @DoctorId_ AND pd2.IsActive = 1
          ))
      AND (@HasAllergies_ IS NULL
           OR (@HasAllergies_ = 1 AND EXISTS (
                   SELECT 1 FROM PatientAllergies pa2
                   WHERE pa2.PatientId = p.Id AND pa2.IsActive = 1))
           OR (@HasAllergies_ = 0 AND NOT EXISTS (
                   SELECT 1 FROM PatientAllergies pa2
                   WHERE pa2.PatientId = p.Id AND pa2.IsActive = 1)))
      AND (@Search_ IS NULL OR @Search_ = '' OR
           p.FirstName   LIKE @SearchTerm OR
           p.LastName    LIKE @SearchTerm OR
           p.Cnp         LIKE @SearchTerm OR
           p.Email       LIKE @SearchTerm OR
           p.PhoneNumber LIKE @SearchTerm OR
           p.PatientCode LIKE @SearchTerm)
    OPTION (RECOMPILE);

    -- Result set 3: statistici globale clinică
    SELECT
        (SELECT COUNT(*)
         FROM Patients
         WHERE ClinicId = @ClinicId_ AND IsDeleted = 0) AS TotalPatients,
        (SELECT COUNT(*)
         FROM Patients
         WHERE ClinicId = @ClinicId_ AND IsDeleted = 0 AND IsActive = 1) AS ActivePatients,
        (SELECT COUNT(DISTINCT pa.PatientId)
         FROM PatientAllergies pa
         INNER JOIN Patients p2 ON p2.Id = pa.PatientId AND p2.IsDeleted = 0
         WHERE p2.ClinicId = @ClinicId_ AND pa.IsActive = 1) AS PatientsWithAllergies,
        (SELECT COUNT(*)
         FROM Patients
         WHERE ClinicId = @ClinicId_ AND IsDeleted = 0
           AND CreatedAt >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)) AS NewThisMonth;
END;
GO

