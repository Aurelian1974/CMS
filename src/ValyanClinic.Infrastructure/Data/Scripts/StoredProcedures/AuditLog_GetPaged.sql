-- ============================================================
-- AuditLog_GetPaged — listare paginată jurnal audit per clinică
-- Suportă filtrare după: EntityType, EntityId, Action, ChangedBy,
--   interval de date; sortare după ChangedAt DESC
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.AuditLog_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @EntityType NVARCHAR(100)    = NULL,   -- NULL = toate tipurile
    @EntityId   UNIQUEIDENTIFIER = NULL,   -- NULL = toate entitățile
    @Action     NVARCHAR(50)     = NULL,   -- NULL = toate acțiunile
    @ChangedBy  UNIQUEIDENTIFIER = NULL,   -- NULL = toți utilizatorii
    @DateFrom   DATETIME2        = NULL,
    @DateTo     DATETIME2        = NULL,
    @Page       INT              = 1,
    @PageSize   INT              = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    -- Result set 1: înregistrările de audit
    SELECT
        al.Id,
        al.ClinicId,
        al.EntityType,
        al.EntityId,
        al.Action,
        al.OldValues,
        al.NewValues,
        al.ChangedBy,
        u.FirstName + ' ' + u.LastName AS ChangedByName,
        al.ChangedAt,
        COUNT(*) OVER() AS TotalCount
    FROM dbo.AuditLogs al
    LEFT JOIN dbo.Users u ON u.Id = al.ChangedBy AND u.IsDeleted = 0
    WHERE al.ClinicId = @ClinicId
      AND (@EntityType IS NULL OR al.EntityType = @EntityType)
      AND (@EntityId   IS NULL OR al.EntityId   = @EntityId)
      AND (@Action     IS NULL OR al.Action     = @Action)
      AND (@ChangedBy  IS NULL OR al.ChangedBy  = @ChangedBy)
      AND (@DateFrom   IS NULL OR al.ChangedAt >= @DateFrom)
      AND (@DateTo     IS NULL OR al.ChangedAt <= @DateTo)
    ORDER BY al.ChangedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
