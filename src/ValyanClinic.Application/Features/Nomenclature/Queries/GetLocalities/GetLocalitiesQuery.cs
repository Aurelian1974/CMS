using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;

/// <summary>Query pentru localitățile unui județ specificat.</summary>
public sealed record GetLocalitiesQuery(Guid CountyId) : IRequest<Result<IEnumerable<LocalityDto>>>;
