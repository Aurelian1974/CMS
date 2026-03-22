using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetActiveSubstancesPaged;

public sealed class GetCnasActiveSubstancesPagedQueryHandler(ICnasSyncRepository repo)
    : IRequestHandler<GetCnasActiveSubstancesPagedQuery, Result<PagedResult<CnasActiveSubstanceDto>>>
{
    public async Task<Result<PagedResult<CnasActiveSubstanceDto>>> Handle(
        GetCnasActiveSubstancesPagedQuery request, CancellationToken ct)
    {
        var page     = Math.Clamp(request.Page, 1, int.MaxValue);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var result = await repo.GetActiveSubstancesPagedAsync(request.Search, page, pageSize, ct);
        return Result<PagedResult<CnasActiveSubstanceDto>>.Success(result);
    }
}
