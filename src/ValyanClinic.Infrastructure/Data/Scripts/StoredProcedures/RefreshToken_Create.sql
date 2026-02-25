-- =============================================================================
-- SP: RefreshToken_Create — creare refresh token nou
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RefreshToken_Create
    @UserId      UNIQUEIDENTIFIER,
    @Token       NVARCHAR(500),
    @ExpiresAt   DATETIME2,
    @CreatedByIp NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    INSERT INTO RefreshTokens (UserId, Token, ExpiresAt, CreatedByIp)
    VALUES (@UserId, @Token, @ExpiresAt, @CreatedByIp);
END;
GO
