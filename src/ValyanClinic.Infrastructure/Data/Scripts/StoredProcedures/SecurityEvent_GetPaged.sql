-- =============================================================================
-- SP: SecurityEvent_GetPaged — interogare paginata a jurnalului de securitate.
--
-- Spre deosebire de AuditLogs, filtrul pe clinica e OPTIONAL si nu implicit:
-- evenimentele fara clinica identificata (login esuat cu email necunoscut) sunt
-- exact cele care conteaza intr-o investigatie si ar fi pierdute de un filtru strict.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.SecurityEvent_GetPaged
    @EventType      NVARCHAR(50)     = NULL,
    @UserId         UNIQUEIDENTIFIER = NULL,
    @EmailAttempted NVARCHAR(200)    = NULL,
    @IpAddress      NVARCHAR(50)     = NULL,
    @Succeeded      BIT              = NULL,
    @DateFrom       DATETIME2        = NULL,
    @DateTo         DATETIME2        = NULL,
    @Page           INT              = 1,
    @PageSize       INT              = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Page     < 1   SET @Page = 1;
    IF @PageSize < 1   SET @PageSize = 50;
    IF @PageSize > 200 SET @PageSize = 200;

    -- Tabela temporara, nu CTE: un CTE e valabil doar pentru instructiunea imediat
    -- urmatoare, iar filtrul e folosit de doua ori — o data pentru numarare si o
    -- data pentru pagina curenta.
    CREATE TABLE #Filtrate (Id UNIQUEIDENTIFIER PRIMARY KEY, OccurredAt DATETIME2);

    INSERT INTO #Filtrate (Id, OccurredAt)
    SELECT se.Id, se.OccurredAt
    FROM dbo.SecurityEvents se
    WHERE (@EventType      IS NULL OR se.EventType = @EventType)
      AND (@UserId         IS NULL OR se.UserId = @UserId)
      AND (@EmailAttempted IS NULL OR se.EmailAttempted LIKE '%' + @EmailAttempted + '%')
      AND (@IpAddress      IS NULL OR se.IpAddress = @IpAddress)
      AND (@Succeeded      IS NULL OR se.Succeeded = @Succeeded)
      AND (@DateFrom       IS NULL OR se.OccurredAt >= @DateFrom)
      AND (@DateTo         IS NULL OR se.OccurredAt <= @DateTo);

    SELECT COUNT(*) AS TotalCount FROM #Filtrate;

    SELECT se.Id,
           se.EventType,
           se.UserId,
           LTRIM(RTRIM(ISNULL(u.FirstName, N'') + N' ' + ISNULL(u.LastName, N''))) AS UserName,
           se.ClinicId,
           se.EmailAttempted,
           se.IpAddress,
           se.UserAgent,
           se.Succeeded,
           se.Details,
           se.OccurredAt
    FROM #Filtrate f
    JOIN dbo.SecurityEvents se ON se.Id = f.Id
    LEFT JOIN Users u ON u.Id = se.UserId
    ORDER BY f.OccurredAt DESC, f.Id DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    DROP TABLE #Filtrate;
END;
GO
