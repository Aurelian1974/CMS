namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>Prețul inițial pentru serviciul unei investigații importate (denumirea vine din nomenclator).</summary>
public sealed record InvestigationServiceImportItem(
    Guid InvestigationTypeId,
    decimal Price);
