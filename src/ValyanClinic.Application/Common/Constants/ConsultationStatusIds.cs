namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// ID-uri fixe pentru statusurile consultațiilor.
/// Valorile GUID corespund rândurilor seed-uite în migrarea 0031_CreateConsultations.sql.
/// </summary>
public static class ConsultationStatusIds
{
    public static readonly Guid InProgress = Guid.Parse("c2000000-0000-0000-0000-000000000001");
    public static readonly Guid Completed  = Guid.Parse("c2000000-0000-0000-0000-000000000002");
    public static readonly Guid Locked     = Guid.Parse("c2000000-0000-0000-0000-000000000003");
}
