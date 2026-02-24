using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;

/// <summary>Query care returnează toate specializările (flat list), filtrate opțional pe IsActive.</summary>
public sealed record GetSpecialtiesQuery(bool? IsActive = null)
    : IRequest<Result<IEnumerable<SpecialtyDto>>>;
