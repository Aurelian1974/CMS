namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class TariffProcedures
{
    public const string GetPaged       = "dbo.MedicalService_GetPaged";
    public const string GetById        = "dbo.MedicalService_GetById";
    public const string Create         = "dbo.MedicalService_Create";
    public const string Update         = "dbo.MedicalService_Update";
    public const string SetActive      = "dbo.MedicalService_SetActive";
    public const string AddPrice       = "dbo.MedicalServicePrice_Add";
    public const string GetLookups     = "dbo.BillingLookup_GetAll";
    public const string GetVatRates    = "dbo.VatRate_GetAll";
    public const string CreateVatRate  = "dbo.VatRate_Create";
    public const string UpdateVatRate  = "dbo.VatRate_Update";
}
