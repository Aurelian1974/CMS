-- ============================================================================
-- SP: CaenCode_Search — Căutare coduri CAEN după cod sau denumire
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.CaenCode_Search
    @Search     NVARCHAR(200) = NULL,   -- text liber (cauta in code + name)
    @Level      TINYINT       = NULL,   -- filtrare dupa nivel (4 = clase, NULL = toate)
    @TopN       INT           = 50      -- limita rezultate (default 50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT TOP (@TopN)
           c.Id,
           c.Code,
           c.Name,
           c.Level,
           c.IsActive
    FROM CaenCodes c
    WHERE c.IsActive = 1
      AND (@Level IS NULL OR c.Level = @Level)
      AND (@Search IS NULL OR @Search = ''
           OR c.Code LIKE @Search + '%'
           OR c.Name LIKE '%' + @Search + '%')
    ORDER BY
        -- Prioritate: match exact pe cod > starts with > contains in name
        CASE WHEN c.Code = @Search THEN 0
             WHEN c.Code LIKE @Search + '%' THEN 1
             ELSE 2 END,
        c.Level,
        c.Code;
END;
GO
