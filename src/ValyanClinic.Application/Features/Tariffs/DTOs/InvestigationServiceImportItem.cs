namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>Un tip de investigație de importat ca serviciu; fără preț, serviciul nu se poate factura.</summary>
public sealed record InvestigationServiceImportItem(
    string InvestigationTypeCode,
    string Name,
    decimal? Price);
