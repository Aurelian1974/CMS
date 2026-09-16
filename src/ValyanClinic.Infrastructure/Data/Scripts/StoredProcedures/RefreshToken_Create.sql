-- =============================================================================
-- SP: RefreshToken_Create — creare refresh token nou (stocat ca hash SHA-256)
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_Create
    @UserId      UNIQUEIDENTIFIER,
    @TokenHash   CHAR(64),
    @ExpiresAt   DATETIME2,
    @CreatedByIp NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    INSERT INTO RefreshTokens (UserId, TokenHash, ExpiresAt, CreatedByIp)
    VALUES (@UserId, @TokenHash, @ExpiresAt, @CreatedByIp);
END;
GO
