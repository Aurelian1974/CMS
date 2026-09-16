-- =============================================================================
-- SP: RefreshToken_DeleteExpired — curățare periodică a token-urilor inactive.
--
-- Tabela creștea la infinit: nimic nu ștergea token-urile expirate sau revocate.
-- Păstrăm o perioadă de retenție după expirare/revocare, ca lanțul
-- ReplacedByTokenHash să rămână investigabil după un incident.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_DeleteExpired
    @RetentionDays INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Cutoff DATETIME2 = DATEADD(DAY, -@RetentionDays, GETDATE());

    DELETE FROM RefreshTokens
    WHERE (ExpiresAt < @Cutoff)
       OR (RevokedAt IS NOT NULL AND RevokedAt < @Cutoff);

    SELECT @@ROWCOUNT AS DeletedCount;
END;
GO
