-- =============================================================================
-- SP: RefreshToken_GetByToken — returnează un refresh token după hash-ul său.
--
-- Returnează randul indiferent de starea lui (revocat / expirat): apelantul are
-- nevoie de RevokedAt pentru a distinge un token necunoscut de unul revocat,
-- acesta din urmă fiind semnalul clasic de furt (reuse detection).
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_GetByToken
    @TokenHash CHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT rt.Id,
           rt.UserId,
           rt.ExpiresAt,
           rt.CreatedAt,
           rt.RevokedAt,
           rt.CreatedByIp
    FROM RefreshTokens rt
    WHERE rt.TokenHash = @TokenHash;
END;
GO
