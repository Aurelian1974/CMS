-- =============================================================================
-- SP: PasswordHistory_Add — inregistreaza hash-ul si pastreaza doar ultimele @Keep.
-- Curatarea se face aici, nu intr-un job separat: istoricul e util doar in fereastra
-- configurata, iar pastrarea a mai mult decat atat ar fi date sensibile fara scop.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.PasswordHistory_Add
    @UserId       UNIQUEIDENTIFIER,
    @PasswordHash NVARCHAR(500),
    @Keep         INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    INSERT INTO dbo.PasswordHistory (UserId, PasswordHash)
    VALUES (@UserId, @PasswordHash);

    IF @Keep < 0 SET @Keep = 0;

    ;WITH DePastrat AS (
        SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt DESC) AS Rang
        FROM dbo.PasswordHistory
        WHERE UserId = @UserId
    )
    DELETE FROM dbo.PasswordHistory
    WHERE Id IN (SELECT Id FROM DePastrat WHERE Rang > @Keep);
END;
GO
