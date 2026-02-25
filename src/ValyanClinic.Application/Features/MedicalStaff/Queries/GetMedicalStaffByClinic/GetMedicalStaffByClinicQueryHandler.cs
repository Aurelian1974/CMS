using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffByClinic;

public sealed class GetMedicalStaffByClinicQueryHandler(
    IMedicalStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetMedicalStaffByClinicQuery, Result<IEnumerable<MedicalStaffLookupDto>>>
{
    public async Task<Result<IEnumerable<MedicalStaffLookupDto>>> Handle(
        GetMedicalStaffByClinicQuery request, CancellationToken cancellationToken)
    {
        var staff = await repository.GetByClinicAsync(
            currentUser.ClinicId,
            cancellationToken);

        return Result<IEnumerable<MedicalStaffLookupDto>>.Success(staff);
    }
}
