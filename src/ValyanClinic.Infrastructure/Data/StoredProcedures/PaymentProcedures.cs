namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class PaymentProcedures
{
    public const string Create          = "dbo.Payment_Create";
    public const string Cancel          = "dbo.Payment_Cancel";
    public const string TenderTableType = "dbo.PaymentTenderTableType";
}
