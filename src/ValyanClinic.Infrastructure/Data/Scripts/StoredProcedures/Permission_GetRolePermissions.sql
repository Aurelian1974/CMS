CREATE OR ALTER PROCEDURE dbo.Permission_GetRolePermissions
    @RoleId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        m.Id          AS ModuleId,
        m.Code        AS ModuleCode,
        m.Name        AS ModuleName,
        m.SortOrder,
        al.Id         AS AccessLevelId,
        al.Code       AS AccessLevelCode,
        al.Level      AS AccessLevel
    FROM Modules m
    INNER JOIN RoleModulePermissions rmp ON rmp.ModuleId = m.Id AND rmp.RoleId = @RoleId
    INNER JOIN AccessLevels al ON al.Id = rmp.AccessLevelId
    WHERE m.IsActive = 1
    ORDER BY m.SortOrder;
END;
GO
