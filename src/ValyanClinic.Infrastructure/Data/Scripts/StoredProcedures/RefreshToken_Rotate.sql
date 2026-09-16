-- =============================================================================
-- SP: RefreshToken_Rotate — rotație atomică a unui refresh token.
--
-- Revocarea token-ului vechi și inserarea celui nou se fac într-o singură
-- tranzacție. Anterior erau două apeluri separate din handler, fără tranzacție:
-- o eroare între ele lăsa utilizatorul fără niciun token valid, deci deconectat
-- definitiv până la un login nou.
--
-- Clauza RevokedAt IS NULL plus verificarea @@ROWCOUNT rezolvă și cursa dintre
-- două cereri de refresh concurente cu același token (tab-uri multiple): doar
-- prima reușește, a doua primește 50052 și e tratată ca token inactiv.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_Rotate
    @OldTokenHash CHAR(64),
    @NewTokenHash CHAR(64),
    @UserId       UNIQUEIDENTIFIER,
    @ExpiresAt    DATETIME2,
    @CreatedByIp  NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE RefreshTokens
        SET RevokedAt           = GETDATE(),
            ReplacedByTokenHash = @NewTokenHash
        WHERE TokenHash = @OldTokenHash
          AND RevokedAt IS NULL;

        IF @@ROWCOUNT = 0
        BEGIN
            ;THROW 50052, N'Refresh token-ul nu mai este activ.', 1;
        END;

        INSERT INTO RefreshTokens (UserId, TokenHash, ExpiresAt, CreatedByIp)
        VALUES (@UserId, @NewTokenHash, @ExpiresAt, @CreatedByIp);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
