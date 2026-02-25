-- ============================================================================
-- SP: Role_GetAll
-- Descriere: Returnează toate rolurile active (nomenclator).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Role_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT r.Id,
           r.Name,
           r.Code,
           r.IsActive
    FROM Roles r
    WHERE r.IsActive = 1
    ORDER BY r.Name;
END;
GO
