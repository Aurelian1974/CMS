namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// ID-uri fixe pentru statusurile programărilor.
/// Valorile GUID corespund rândurilor seed-uite în migrarea 0002_SeedNomenclature.sql.
/// </summary>
public static class AppointmentStatusIds
{
    public static readonly Guid Scheduled = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid Confirmed = Guid.Parse("a1000000-0000-0000-0000-000000000002");
    public static readonly Guid Completed = Guid.Parse("a1000000-0000-0000-0000-000000000003");
    public static readonly Guid Cancelled = Guid.Parse("a1000000-0000-0000-0000-000000000004");
    public static readonly Guid NoShow    = Guid.Parse("a1000000-0000-0000-0000-000000000005");
}
