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
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.GenderId,
            request.BloodTypeId,
            request.DoctorId,
            request.HasAllergies,
            request.IsActive,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        var response = new PatientsPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        };

        return Result<PatientsPagedResponse>.Success(response);
    }
}
