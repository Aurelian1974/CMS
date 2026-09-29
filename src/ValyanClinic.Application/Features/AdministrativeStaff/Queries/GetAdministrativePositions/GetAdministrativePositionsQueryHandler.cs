using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativePositions;

public sealed class GetAdministrativePositionsQueryHandler(IAdministrativeStaffRepository repository)
    : IRequestHandler<GetAdministrativePositionsQuery, Result<IReadOnlyList<AdministrativePositionDto>>>
{
    public async Task<Result<IReadOnlyList<AdministrativePositionDto>>> Handle(
        GetAdministrativePositionsQuery request, CancellationToken cancellationToken)
    {
        var positions = await repository.GetPositionsAsync(request.IsActive, cancellationToken);
        return Result<IReadOnlyList<AdministrativePositionDto>>.Success(positions);
    }
}
