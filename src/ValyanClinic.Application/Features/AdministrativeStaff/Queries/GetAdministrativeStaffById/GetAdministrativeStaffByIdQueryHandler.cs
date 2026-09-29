using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffById;

public sealed class GetAdministrativeStaffByIdQueryHandler(
    IAdministrativeStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAdministrativeStaffByIdQuery, Result<AdministrativeStaffDetailDto>>
{
    public async Task<Result<AdministrativeStaffDetailDto>> Handle(
        GetAdministrativeStaffByIdQuery request, CancellationToken cancellationToken)
    {
        var member = await repository.GetByIdAsync(
            request.Id,
            currentUser.ClinicId,
            cancellationToken);

        return member is null
            ? Result<AdministrativeStaffDetailDto>.NotFound(ErrorMessages.AdministrativeStaffMember.NotFound)
            : Result<AdministrativeStaffDetailDto>.Success(member);
    }
}
