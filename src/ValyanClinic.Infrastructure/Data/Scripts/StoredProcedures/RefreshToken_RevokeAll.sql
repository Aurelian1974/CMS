-- =============================================================================
-- SP: RefreshToken_RevokeAll — revocă toate refresh token-urile unui utilizator
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_RevokeAll
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE RefreshTokens
    SET RevokedAt = GETDATE()
    WHERE UserId = @UserId
      AND RevokedAt IS NULL;
END;
GO
