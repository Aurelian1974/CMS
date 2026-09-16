CREATE OR ALTER PROCEDURE dbo.Permission_GetEffectiveByUser
    @UserId  UNIQUEIDENTIFIER,
    @RoleId  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Returnează permisiunile efective: override dacă există, altfel din rol.
    --
    -- Ambele join-uri sunt LEFT, pornind din Modules: un override poate exista pe un
    -- modul pentru care rolul nu are niciun rând în RoleModulePermissions (ecranul de
    -- administrare permite asta pentru orice modul activ). Cu INNER JOIN pe rol, acel
    -- override dispărea tăcut — utilizatorul nu vedea item-ul în sidebar, iar API-ul
    -- răspundea 403, fără niciun semn că setarea salvată fusese ignorată.
    -- Cazul e garantat de seed-uri: migrările 0045 și 0047 dau 'audit' și 'settings'
    -- doar rolului admin.
    --
    -- AccessLevels rămâne INNER JOIN: COALESCE-ul nu poate fi NULL decât dacă lipsesc
    -- ambele surse, adică modulul nu e nici în rol, nici în override — caz în care
    -- rândul nu are ce căuta în rezultat.
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
    LEFT  JOIN RoleModulePermissions rmp ON rmp.ModuleId = m.Id AND rmp.RoleId = @RoleId
    LEFT  JOIN UserModuleOverrides   uo  ON uo.ModuleId  = m.Id AND uo.UserId  = @UserId
    INNER JOIN AccessLevels al ON al.Id = COALESCE(uo.AccessLevelId, rmp.AccessLevelId)
    WHERE m.IsActive = 1
      AND al.Level > 0   -- None (0) nu e o permisiune: nu are ce căuta în payload
    ORDER BY m.SortOrder;
END;
GO
