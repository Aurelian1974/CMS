-- =============================================================================
-- SP: RefreshToken_Revoke — revocă un refresh token (la refresh rotation sau logout)
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_Revoke
    @Token          NVARCHAR(500),
    @ReplacedByToken NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE RefreshTokens
    SET RevokedAt       = GETDATE(),
        ReplacedByToken = @ReplacedByToken
    WHERE Token = @Token
      AND RevokedAt IS NULL;
END;
GO
