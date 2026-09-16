-- =============================================================================
-- SP: PasswordHistory_GetRecent — ultimele @Count hash-uri ale unui utilizator.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.PasswordHistory_GetRecent
    @UserId UNIQUEIDENTIFIER,
    @Count  INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Count < 1
    BEGIN
        SELECT TOP 0 CAST(NULL AS NVARCHAR(500)) AS PasswordHash;
        RETURN;
    END;

    SELECT TOP (@Count) PasswordHash
    FROM dbo.PasswordHistory
    WHERE UserId = @UserId
    ORDER BY CreatedAt DESC;
END;
GO
