-- =============================================================================
-- SP: RefreshToken_Revoke — revocă un refresh token (folosit la logout).
-- Rotația la /refresh folosește RefreshToken_Rotate, care e tranzacțional.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_Revoke
    @TokenHash           CHAR(64),
    @ReplacedByTokenHash CHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE RefreshTokens
    SET RevokedAt           = GETDATE(),
        ReplacedByTokenHash = @ReplacedByTokenHash
    WHERE TokenHash = @TokenHash
      AND RevokedAt IS NULL;
END;
GO
