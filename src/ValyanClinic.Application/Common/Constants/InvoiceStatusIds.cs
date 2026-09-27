namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// ID-uri fixe pentru statusurile facturilor (seed în migrarea 0055_CreatePaymentsAndInvoices.sql).
/// </summary>
public static class InvoiceStatusIds
{
    public static readonly Guid Issued   = Guid.Parse("f4000000-0000-0000-0000-000000000001");
    public static readonly Guid Reversed = Guid.Parse("f4000000-0000-0000-0000-000000000002");
}
