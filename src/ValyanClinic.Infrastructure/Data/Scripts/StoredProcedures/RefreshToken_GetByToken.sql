-- =============================================================================
-- SP: RefreshToken_GetByToken — returnează un refresh token după hash-ul său.
--
-- Returnează randul indiferent de starea lui (revocat / expirat): apelantul are
-- nevoie de starea lui pentru a distinge un token necunoscut de unul revocat.
--
-- WasReplaced separă cele două feluri de revocare:
--   1 = token-ul a fost rotit, deci altcineva l-a folosit deja ca să obțină unul
--       nou. Prezentarea lui din nou e semnalul clasic de furt.
--   0 = revocare terminală (logout, schimbare de parolă, dezactivare de cont).
--       Un tab rămas deschis care reîncearcă e un caz banal, nu un atac.
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
           CAST(CASE WHEN rt.ReplacedByTokenHash IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS WasReplaced,
           rt.CreatedByIp
    FROM RefreshTokens rt
    WHERE rt.TokenHash = @TokenHash;
END;
GO
