using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Features.Patients.Queries.GetPatients;

public sealed class GetPatientsQueryHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPatientsQuery, Result<PatientsPagedResponse>>
{
    public async Task<Result<PatientsPagedResponse>> Handle(
        GetPatientsQuery request, CancellationToken cancellationToken)
    {
        var pagedResult = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.GenderId,
            request.DoctorId,
            request.HasAllergies,
            request.IsActive,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        var stats = await repository.GetStatsAsync(
            currentUser.ClinicId,
            cancellationToken);

        var response = new PatientsPagedResponse
        {
            PagedResult = pagedResult,
            Stats = stats
        };

        return Result<PatientsPagedResponse>.Success(response);
    }
}
