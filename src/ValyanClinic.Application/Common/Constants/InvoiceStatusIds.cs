namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// ID-uri fixe pentru statusurile facturilor.
/// Valorile GUID corespund rândurilor seed-uite în migrarea 0002_SeedNomenclature.sql.
/// </summary>
public static class InvoiceStatusIds
{
    public static readonly Guid Draft     = Guid.Parse("b1000000-0000-0000-0000-000000000001");
    public static readonly Guid Issued    = Guid.Parse("b1000000-0000-0000-0000-000000000002");
    public static readonly Guid Paid      = Guid.Parse("b1000000-0000-0000-0000-000000000003");
    public static readonly Guid Cancelled = Guid.Parse("b1000000-0000-0000-0000-000000000004");
}
