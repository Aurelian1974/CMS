using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ICD10.DTOs;

namespace ValyanClinic.Application.Features.ICD10.Queries.SearchICD10;

/// <summary>Query pentru căutare coduri ICD-10.</summary>
public sealed record SearchICD10Query(
    string SearchTerm,
    int MaxResults = 20
) : IRequest<Result<IEnumerable<ICD10SearchResultDto>>>;
