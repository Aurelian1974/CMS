using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffList;

public sealed class GetMedicalStaffListQueryHandler(
    IMedicalStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetMedicalStaffListQuery, Result<PagedResult<MedicalStaffListDto>>>
{
    public async Task<Result<PagedResult<MedicalStaffListDto>>> Handle(
        GetMedicalStaffListQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.DepartmentId,
            request.MedicalTitleId,
            request.IsActive,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        return Result<PagedResult<MedicalStaffListDto>>.Success(result);
    }
}
