using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ICD10.DTOs;

namespace ValyanClinic.Application.Features.ICD10.Queries.GetICD10Favorites;

/// <summary>Query pentru obținerea codurilor ICD-10 favorite ale utilizatorului.</summary>
public sealed record GetICD10FavoritesQuery(Guid UserId)
    : IRequest<Result<IEnumerable<ICD10SearchResultDto>>>;
