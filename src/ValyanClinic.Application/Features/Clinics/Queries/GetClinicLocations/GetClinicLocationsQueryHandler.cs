using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Features.Clinics.Queries.GetClinicLocations;

public sealed class GetClinicLocationsQueryHandler(
    IClinicLocationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetClinicLocationsQuery, Result<IEnumerable<ClinicLocationDto>>>
{
    public async Task<Result<IEnumerable<ClinicLocationDto>>> Handle(
        GetClinicLocationsQuery request, CancellationToken cancellationToken)
    {
        var locations = await repository.GetByClinicAsync(
            currentUser.ClinicId, request.IsActive, cancellationToken);

        return Result<IEnumerable<ClinicLocationDto>>.Success(locations);
    }
}
