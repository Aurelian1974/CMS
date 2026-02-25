-- =============================================================================
-- SP: RefreshToken_GetByToken — returnează refresh token activ (neexpirat, nerevocat)
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_GetByToken
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT rt.Id,
           rt.UserId,
           rt.Token,
           rt.ExpiresAt,
           rt.CreatedAt,
           rt.RevokedAt,
           rt.ReplacedByToken,
           rt.CreatedByIp
    FROM RefreshTokens rt
    WHERE rt.Token = @Token;
END;
GO
