using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Features.Doctors.Queries.GetDoctors;

public sealed class GetDoctorsQueryHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetDoctorsQuery, Result<PagedResult<DoctorListDto>>>
{
    public async Task<Result<PagedResult<DoctorListDto>>> Handle(
        GetDoctorsQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.SpecialtyId,
            request.DepartmentId,
            request.IsActive,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        return Result<PagedResult<DoctorListDto>>.Success(result);
    }
}
