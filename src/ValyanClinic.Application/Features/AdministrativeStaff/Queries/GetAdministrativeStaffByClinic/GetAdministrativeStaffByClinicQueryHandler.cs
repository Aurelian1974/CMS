using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffByClinic;

public sealed class GetAdministrativeStaffByClinicQueryHandler(
    IAdministrativeStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAdministrativeStaffByClinicQuery, Result<IEnumerable<AdministrativeStaffLookupDto>>>
{
    public async Task<Result<IEnumerable<AdministrativeStaffLookupDto>>> Handle(
        GetAdministrativeStaffByClinicQuery request, CancellationToken cancellationToken)
    {
        var staff = await repository.GetByClinicAsync(currentUser.ClinicId, cancellationToken);
        return Result<IEnumerable<AdministrativeStaffLookupDto>>.Success(staff);
    }
}
