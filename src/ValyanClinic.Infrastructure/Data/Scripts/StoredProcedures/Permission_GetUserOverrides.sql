CREATE OR ALTER PROCEDURE dbo.Permission_GetUserOverrides
    @UserId UNIQUEIDENTIFIER
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
        al.Level      AS AccessLevel,
        uo.Reason,
        uo.GrantedBy,
        uo.GrantedAt,
        gu.FirstName + ' ' + gu.LastName AS GrantedByName
    FROM UserModuleOverrides uo
    INNER JOIN Modules m ON m.Id = uo.ModuleId AND m.IsActive = 1
    INNER JOIN AccessLevels al ON al.Id = uo.AccessLevelId
    INNER JOIN Users gu ON gu.Id = uo.GrantedBy
    WHERE uo.UserId = @UserId
    ORDER BY m.SortOrder;
END;
GO
