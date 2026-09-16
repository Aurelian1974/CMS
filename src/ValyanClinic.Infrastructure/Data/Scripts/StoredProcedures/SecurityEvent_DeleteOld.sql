-- =============================================================================
-- SP: SecurityEvent_DeleteOld — retentie pentru jurnalul de securitate.
-- Perioada implicita e mult mai lunga decat la refresh tokens: jurnalul trebuie
-- sa poata raspunde unei cereri GDPR sau unei investigatii ulterioare.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.SecurityEvent_DeleteOld
    @RetentionDays INT = 730
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DELETE FROM dbo.SecurityEvents
    WHERE OccurredAt < DATEADD(DAY, -@RetentionDays, SYSUTCDATETIME());

    SELECT @@ROWCOUNT AS DeletedCount;
END;
GO
