-- =============================================================================
-- SP: SecurityEvent_Create — inregistreaza un eveniment de securitate.
-- Scrierea nu trebuie sa blocheze niciodata autentificarea; apelantul trateaza
-- eventualele erori fara sa le propage catre utilizator.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.SecurityEvent_Create
    @EventType      NVARCHAR(50),
    @UserId         UNIQUEIDENTIFIER = NULL,
    @ClinicId       UNIQUEIDENTIFIER = NULL,
    @EmailAttempted NVARCHAR(200)    = NULL,
    @IpAddress      NVARCHAR(50)     = NULL,
    @UserAgent      NVARCHAR(500)    = NULL,
    @Succeeded      BIT,
    @Details        NVARCHAR(MAX)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    INSERT INTO dbo.SecurityEvents
        (EventType, UserId, ClinicId, EmailAttempted, IpAddress, UserAgent, Succeeded, Details)
    VALUES
        (@EventType, @UserId, @ClinicId, @EmailAttempted, @IpAddress, @UserAgent, @Succeeded, @Details);
END;
GO
