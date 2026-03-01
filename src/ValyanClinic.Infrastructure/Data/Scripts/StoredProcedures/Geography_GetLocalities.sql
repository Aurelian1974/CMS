-- ============================================================
-- Geography_GetLocalities — localitățile unui județ
-- @CountyId — filtru obligatoriu (un județ = 50-200 localități)
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Geography_GetLocalities
    @CountyId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        l.Id,
        l.Name,
        lt.Code   AS LocationTypeCode,
        lt.Name   AS LocationTypeName
    FROM Localities l
    LEFT JOIN LocationTypes lt ON lt.Id = l.LocationTypeId AND lt.IsActive = 1
    WHERE l.CountyId = @CountyId
      AND l.IsActive = 1
    ORDER BY lt.Code, l.Name;
END;
GO
