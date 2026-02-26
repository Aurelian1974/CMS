CREATE OR ALTER PROCEDURE dbo.Permission_GetEffectiveByUser
    @UserId  UNIQUEIDENTIFIER,
    @RoleId  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Returnează permisiunile efective: override dacă există, altfel din rol
    SELECT
        m.Id          AS ModuleId,
        m.Code        AS ModuleCode,
        m.Name        AS ModuleName,
        m.SortOrder,
        al.Id         AS AccessLevelId,
        al.Code       AS AccessLevelCode,
        al.Level      AS AccessLevel,
        CASE WHEN uo.Id IS NOT NULL THEN 1 ELSE 0 END AS IsOverridden
    FROM Modules m
    INNER JOIN RoleModulePermissions rmp ON rmp.ModuleId = m.Id AND rmp.RoleId = @RoleId
    LEFT JOIN UserModuleOverrides uo ON uo.ModuleId = m.Id AND uo.UserId = @UserId
    INNER JOIN AccessLevels al ON al.Id = COALESCE(uo.AccessLevelId, rmp.AccessLevelId)
    WHERE m.IsActive = 1
    ORDER BY m.SortOrder;
END;
GO
