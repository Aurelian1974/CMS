using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetActiveSubstancesPaged;

public sealed record GetCnasActiveSubstancesPagedQuery(
    string? Search,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<CnasActiveSubstanceDto>>>;
