SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: InvoiceSeries_GetAll — seriile clinicii (inclusiv inactive) + nr. de facturi emise
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvoiceSeries_GetAll
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT s.Id, s.Series, s.LastNumber, s.IsDefault, s.IsActive, s.CreatedAt,
           (SELECT COUNT(*) FROM dbo.Invoices i WHERE i.SeriesId = s.Id) AS InvoiceCount
    FROM dbo.InvoiceSeries s
    WHERE s.ClinicId = @ClinicId
    ORDER BY s.IsDefault DESC, s.IsActive DESC, s.Series;
END;
GO
