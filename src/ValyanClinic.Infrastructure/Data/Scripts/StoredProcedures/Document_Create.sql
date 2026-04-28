SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Document_Create
-- Stocheaza metadata + (optional) bytes pentru documente atasate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Document_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @FileName    NVARCHAR(260),
    @ContentType NVARCHAR(120),
    @FileSize    BIGINT,
    @StoragePath NVARCHAR(500) = NULL,
    @FileBytes   VARBINARY(MAX) = NULL,
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.Documents (Id, ClinicId, FileName, ContentType, FileSize, StoragePath, FileBytes, CreatedBy)
    VALUES (@NewId, @ClinicId, @FileName, @ContentType, @FileSize, @StoragePath, @FileBytes, @CreatedBy);

    SELECT @NewId;
END;
GO
