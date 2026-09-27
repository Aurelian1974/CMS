namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class FinancialSettingsProcedures
{
    public const string GetFiscal               = "dbo.FiscalSettings_Get";
    public const string UpdateFiscal            = "dbo.FiscalSettings_Update";
    public const string VatMappingTableType     = "dbo.FiscalVatMappingTableType";
    public const string PaymentMappingTableType = "dbo.FiscalPaymentMappingTableType";
    public const string GetSeries               = "dbo.InvoiceSeries_GetAll";
    public const string CreateSeries            = "dbo.InvoiceSeries_Create";
    public const string UpdateSeries            = "dbo.InvoiceSeries_Update";
}
