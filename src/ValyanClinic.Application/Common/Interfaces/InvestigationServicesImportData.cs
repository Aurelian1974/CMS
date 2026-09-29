using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record InvestigationServicesImportData(
    Guid ClinicId,
    IReadOnlyList<InvestigationServiceImportItem> Items,
    Guid? VatRateId,
    DateOnly? ValidFrom);
