using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;

public sealed class GetSpecialtiesQueryHandler(ISpecialtyRepository repository)
    : IRequestHandler<GetSpecialtiesQuery, Result<IEnumerable<SpecialtyDto>>>
{
    public async Task<Result<IEnumerable<SpecialtyDto>>> Handle(
        GetSpecialtiesQuery request, CancellationToken cancellationToken)
    {
        var specialties = await repository.GetAllAsync(request.IsActive, cancellationToken);
        return Result<IEnumerable<SpecialtyDto>>.Success(specialties);
    }
}
