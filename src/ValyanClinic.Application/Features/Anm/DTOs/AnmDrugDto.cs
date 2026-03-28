namespace ValyanClinic.Application.Features.Anm.DTOs;

/// <summary>DTO pentru un medicament din nomenclatorul ANM (nomenclator.anm.ro).</summary>
public sealed record AnmDrugDto(
    string  AuthorizationCode,
    string  CommercialName,
    string? InnName,
    string? PharmaceuticalForm,
    string? AtcCode,
    string? Company,
    string? Country,
    string? DispenseMode,
    bool    IsActive,
    bool    IsCompensated
);
