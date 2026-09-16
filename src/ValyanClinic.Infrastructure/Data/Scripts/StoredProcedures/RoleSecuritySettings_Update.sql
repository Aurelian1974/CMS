-- =============================================================================
-- SP: RoleSecuritySettings_Update — setarile de sesiune ale unui rol.
-- Face upsert: un rol adaugat dupa migrarea 0046 nu are inca rand.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.RoleSecuritySettings_Update
    @RoleId             UNIQUEIDENTIFIER,
    @IdleTimeoutMinutes INT,
    @RefreshTokenDays   INT,
    @UpdatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Id = @RoleId)
    BEGIN
        -- BEGIN/END obligatoriu: punctul si virgula care precede THROW ar inchide
        -- instructiunea IF si i-ar lasa corpul gol.
        ;THROW 50053, N'Rolul nu exista.', 1;
    END;

    -- Praguri: sub un minut fereastra devine inutilizabila, iar peste o zi nu mai
    -- are sensul de protectie a statiei nesupravegheate.
    DECLARE @Idle INT = CASE WHEN @IdleTimeoutMinutes < 1    THEN 1
                             WHEN @IdleTimeoutMinutes > 1440 THEN 1440
                             ELSE @IdleTimeoutMinutes END;
    DECLARE @Days INT = CASE WHEN @RefreshTokenDays < 1   THEN 1
                             WHEN @RefreshTokenDays > 365 THEN 365
                             ELSE @RefreshTokenDays END;

    MERGE dbo.RoleSecuritySettings AS t
    USING (SELECT @RoleId AS RoleId) AS src ON t.RoleId = src.RoleId
    WHEN MATCHED THEN
        UPDATE SET IdleTimeoutMinutes = @Idle,
                   RefreshTokenDays   = @Days,
                   UpdatedAt          = SYSUTCDATETIME(),
                   UpdatedBy          = @UpdatedBy
    WHEN NOT MATCHED THEN
        INSERT (RoleId, IdleTimeoutMinutes, RefreshTokenDays, UpdatedAt, UpdatedBy)
        VALUES (@RoleId, @Idle, @Days, SYSUTCDATETIME(), @UpdatedBy);
END;
GO
