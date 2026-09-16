-- =============================================================================
-- SP: RoleSecuritySettings_GetAll — setarile de sesiune pentru toate rolurile.
--
-- Se citesc toate deodata: sunt cinci randuri, iar provider-ul le cachuieste
-- impreuna. Un SP per rol ar inmulti apelurile fara niciun castig.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RoleSecuritySettings_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT r.Id   AS RoleId,
           r.Code AS RoleCode,
           r.Name AS RoleName,
           ISNULL(s.IdleTimeoutMinutes, 30) AS IdleTimeoutMinutes,
           ISNULL(s.RefreshTokenDays,    7) AS RefreshTokenDays
    FROM dbo.Roles r
    LEFT JOIN dbo.RoleSecuritySettings s ON s.RoleId = r.Id
    WHERE r.IsActive = 1
    ORDER BY r.Name;
END;
GO
