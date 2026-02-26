using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Features.Patients.Queries.GetPatients;

/// <summary>Listare paginată pacienți cu căutare și filtre.</summary>
public sealed record GetPatientsQuery(
    string? Search = null,
    Guid? GenderId = null,
    Guid? DoctorId = null,
    bool? HasAllergies = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "LastName",
    string SortDir = "asc"
) : IRequest<Result<PatientsPagedResponse>>;

/// <summary>Răspunsul paginat include și statisticile globale.</summary>
public sealed class PatientsPagedResponse
{
    public required PagedResult<PatientListDto> PagedResult { get; init; }
    public required PatientStatsDto Stats { get; init; }
}
