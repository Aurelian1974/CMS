using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationMedications.DTOs;

namespace ValyanClinic.Application.Features.ConsultationMedications.Queries.SearchCnasDrugs;

public sealed record SearchCnasDrugsQuery(string Search, int Top = SearchCnasDrugsQuery.DefaultTop)
    : IRequest<Result<IReadOnlyList<CnasDrugLookupDto>>>
{
    public const int DefaultTop = 30;
    public const int MaxTop = 50;
    public const int MinSearchLength = 2;
}
