using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;

/// <summary>Handler generic — rutează către metoda corectă din repository pe baza tipului solicitat.</summary>
public sealed class GetNomenclatureLookupQueryHandler(INomenclatureLookupRepository repository)
    : IRequestHandler<GetNomenclatureLookupQuery, Result<IEnumerable<NomenclatureLookupDto>>>
{
    public async Task<Result<IEnumerable<NomenclatureLookupDto>>> Handle(
        GetNomenclatureLookupQuery request, CancellationToken cancellationToken)
    {
        var items = request.Type switch
        {
            NomenclatureLookupType.Genders           => await repository.GetGendersAsync(request.IsActive, cancellationToken),
            NomenclatureLookupType.BloodTypes        => await repository.GetBloodTypesAsync(request.IsActive, cancellationToken),
            NomenclatureLookupType.AllergyTypes      => await repository.GetAllergyTypesAsync(request.IsActive, cancellationToken),
            NomenclatureLookupType.AllergySeverities  => await repository.GetAllergySeveritiesAsync(request.IsActive, cancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(request.Type), request.Type, "Tip nomenclator necunoscut.")
        };

        return Result<IEnumerable<NomenclatureLookupDto>>.Success(items);
    }
}
