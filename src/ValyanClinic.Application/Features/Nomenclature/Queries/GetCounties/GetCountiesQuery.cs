using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;

/// <summary>Query pentru lista tuturor județelor active.</summary>
public sealed record GetCountiesQuery : IRequest<Result<IEnumerable<CountyDto>>>;
