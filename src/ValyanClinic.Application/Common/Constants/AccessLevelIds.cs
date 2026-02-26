namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// GUID-uri fixe pentru nivelurile de acces — corespund seed-ului din 0011_CreatePermissionsTables.sql.
/// </summary>
public static class AccessLevelIds
{
    public static readonly Guid None  = Guid.Parse("E1000001-0000-0000-0000-000000000001");
    public static readonly Guid Read  = Guid.Parse("E1000001-0000-0000-0000-000000000002");
    public static readonly Guid Write = Guid.Parse("E1000001-0000-0000-0000-000000000003");
    public static readonly Guid Full  = Guid.Parse("E1000001-0000-0000-0000-000000000004");
}
