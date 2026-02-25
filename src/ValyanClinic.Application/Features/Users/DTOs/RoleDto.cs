namespace ValyanClinic.Application.Features.Users.DTOs;

/// <summary>DTO pentru roluri (nomenclator dropdown).</summary>
public sealed record RoleDto(
    Guid Id,
    string Name,
    string Code,
    bool IsActive);
