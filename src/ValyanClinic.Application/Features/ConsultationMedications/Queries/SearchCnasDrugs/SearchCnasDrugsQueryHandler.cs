using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationMedications.DTOs;

namespace ValyanClinic.Application.Features.ConsultationMedications.Queries.SearchCnasDrugs;

public sealed class SearchCnasDrugsQueryHandler(
    IConsultationMedicationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<SearchCnasDrugsQuery, Result<IReadOnlyList<CnasDrugLookupDto>>>
{
    public async Task<Result<IReadOnlyList<CnasDrugLookupDto>>> Handle(
        SearchCnasDrugsQuery request, CancellationToken ct)
    {
        var rows = await repository.SearchDrugsAsync(
            currentUser.ClinicId, request.Search.Trim(), request.Top, ct);
        return Result<IReadOnlyList<CnasDrugLookupDto>>.Success(rows);
    }
}
