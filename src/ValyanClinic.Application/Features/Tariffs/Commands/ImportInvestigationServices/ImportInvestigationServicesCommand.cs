using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Commands.ImportInvestigationServices;

/// <summary>
/// Creează serviciul lipsă pentru fiecare investigație facturabilă (1:1 cu nomenclatorul).
/// Items = prețurile inițiale, opționale. Întoarce numărul de servicii create.
/// </summary>
public sealed record ImportInvestigationServicesCommand(
    IReadOnlyList<InvestigationServiceImportItem> Items,
    Guid? VatRateId,
    DateOnly? ValidFrom)
    : IRequest<Result<int>>;
