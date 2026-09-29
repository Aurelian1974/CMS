using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Commands.ImportInvestigationServices;

/// <summary>Creează servicii (categoria investigații) din tipurile de investigații selectate. Întoarce numărul creat.</summary>
public sealed record ImportInvestigationServicesCommand(
    IReadOnlyList<InvestigationServiceImportItem> Items,
    Guid? VatRateId,
    DateOnly? ValidFrom)
    : IRequest<Result<int>>;
