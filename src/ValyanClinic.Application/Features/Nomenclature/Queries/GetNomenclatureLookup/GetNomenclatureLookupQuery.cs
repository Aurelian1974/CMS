using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;

/// <summary>Tipul de nomenclator solicitat.</summary>
public enum NomenclatureLookupType
{
    Genders,
    BloodTypes,
    AllergyTypes,
    AllergySeverities
}

/// <summary>Query generic pentru nomenclatoare simple (lookup tables).</summary>
public sealed record GetNomenclatureLookupQuery(
    NomenclatureLookupType Type,
    bool? IsActive = null)
    : IRequest<Result<IEnumerable<NomenclatureLookupDto>>>;
