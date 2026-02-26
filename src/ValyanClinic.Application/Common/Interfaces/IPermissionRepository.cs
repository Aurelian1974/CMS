using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Repository pentru sistemul de permisiuni RBAC.</summary>
public interface IPermissionRepository
{
    /// <summary>Returnează permisiunile efective ale unui utilizator (rol + override-uri).</summary>
    Task<IReadOnlyList<UserModulePermissionDto>> GetEffectiveByUserAsync(
        Guid userId, Guid roleId, CancellationToken ct);

    /// <summary>Returnează permisiunile default ale unui rol.</summary>
    Task<IReadOnlyList<RoleModulePermissionDto>> GetRolePermissionsAsync(
        Guid roleId, CancellationToken ct);

    /// <summary>Returnează override-urile unui utilizator.</summary>
    Task<IReadOnlyList<UserOverrideDto>> GetUserOverridesAsync(
        Guid userId, CancellationToken ct);

    /// <summary>Sincronizează permisiunile unui rol (delete + insert batch).</summary>
    Task<int> SyncRolePermissionsAsync(
        Guid roleId, string permissionsJson, Guid updatedBy, CancellationToken ct);

    /// <summary>Sincronizează override-urile unui utilizator.</summary>
    Task<int> SyncUserOverridesAsync(
        Guid userId, string overridesJson, Guid grantedBy, CancellationToken ct);

    /// <summary>Returnează toate modulele active.</summary>
    Task<IReadOnlyList<ModuleDto>> GetAllModulesAsync(CancellationToken ct);

    /// <summary>Returnează toate nivelurile de acces.</summary>
    Task<IReadOnlyList<AccessLevelDto>> GetAllAccessLevelsAsync(CancellationToken ct);
}

// ===== DTOs pentru permisiuni =====

/// <summary>Permisiune efectivă per modul (folosită la login/init).</summary>
public sealed record UserModulePermissionDto
{
    public Guid ModuleId { get; init; }
    public string ModuleCode { get; init; } = string.Empty;
    public string ModuleName { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public Guid AccessLevelId { get; init; }
    public string AccessLevelCode { get; init; } = string.Empty;
    public int AccessLevel { get; init; }
    public bool IsOverridden { get; init; }
}

/// <summary>Permisiune default per modul și rol.</summary>
public sealed record RoleModulePermissionDto
{
    public Guid ModuleId { get; init; }
    public string ModuleCode { get; init; } = string.Empty;
    public string ModuleName { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public Guid AccessLevelId { get; init; }
    public string AccessLevelCode { get; init; } = string.Empty;
    public int AccessLevel { get; init; }
}

/// <summary>Override individual al unui utilizator.</summary>
public sealed record UserOverrideDto
{
    public Guid ModuleId { get; init; }
    public string ModuleCode { get; init; } = string.Empty;
    public string ModuleName { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public Guid AccessLevelId { get; init; }
    public string AccessLevelCode { get; init; } = string.Empty;
    public int AccessLevel { get; init; }
    public string? Reason { get; init; }
    public Guid GrantedBy { get; init; }
    public DateTime GrantedAt { get; init; }
    public string GrantedByName { get; init; } = string.Empty;
}

/// <summary>Modul al aplicației.</summary>
public sealed record ModuleDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int SortOrder { get; init; }
    public bool IsActive { get; init; }
}

/// <summary>Nivel de acces.</summary>
public sealed record AccessLevelDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int Level { get; init; }
}
