using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffById;

public sealed class GetMedicalStaffByIdQueryHandler(
    IMedicalStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetMedicalStaffByIdQuery, Result<MedicalStaffDetailDto>>
{
    public async Task<Result<MedicalStaffDetailDto>> Handle(
        GetMedicalStaffByIdQuery request, CancellationToken cancellationToken)
    {
        var member = await repository.GetByIdAsync(
            request.Id,
            currentUser.ClinicId,
            cancellationToken);

        return member is not null
            ? Result<MedicalStaffDetailDto>.Success(member)
            : Result<MedicalStaffDetailDto>.NotFound(ErrorMessages.MedicalStaffMember.NotFound);
    }
}
