SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Document_GetById
-- Returneaza metadata + (optional) bytes pentru un document.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Document_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        Id, ClinicId, FileName, ContentType, FileSize,
        StoragePath, FileBytes, CreatedAt, CreatedBy
    FROM dbo.Documents
    WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;
END;
GO
