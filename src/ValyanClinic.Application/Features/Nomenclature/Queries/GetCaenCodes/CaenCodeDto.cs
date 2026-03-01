namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetCaenCodes;

/// <summary>DTO pentru un cod CAEN (nomenclator).</summary>
public sealed record CaenCodeDto(
    Guid Id,
    string Code,
    string Name,
    byte Level,
    bool IsActive);
