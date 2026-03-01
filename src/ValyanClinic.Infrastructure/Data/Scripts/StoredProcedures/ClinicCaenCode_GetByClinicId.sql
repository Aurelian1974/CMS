SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicCaenCode_GetByClinicId
-- Descriere: Returnează toate codurile CAEN asociate unei clinici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicCaenCode_GetByClinicId
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT ccc.Id,
           ccc.CaenCodeId,
           cc.Code,
           cc.Name,
           cc.Level,
           ccc.IsPrimary
    FROM ClinicCaenCodes ccc
    INNER JOIN CaenCodes cc ON cc.Id = ccc.CaenCodeId
    WHERE ccc.ClinicId = @ClinicId
    ORDER BY ccc.IsPrimary DESC, cc.Code;
END;
GO
