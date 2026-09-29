using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffList;

public sealed class GetAdministrativeStaffListQueryHandler(
    IAdministrativeStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAdministrativeStaffListQuery, Result<PagedResult<AdministrativeStaffListDto>>>
{
    public async Task<Result<PagedResult<AdministrativeStaffListDto>>> Handle(
        GetAdministrativeStaffListQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.DepartmentId,
            request.PositionId,
            request.IsActive,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        return Result<PagedResult<AdministrativeStaffListDto>>.Success(result);
    }
}
