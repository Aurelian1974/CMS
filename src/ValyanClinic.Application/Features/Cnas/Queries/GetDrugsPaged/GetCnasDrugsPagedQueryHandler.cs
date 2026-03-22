using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetDrugsPaged;

public sealed class GetCnasDrugsPagedQueryHandler(ICnasSyncRepository repo)
    : IRequestHandler<GetCnasDrugsPagedQuery, Result<PagedResult<CnasDrugDto>>>
{
    public async Task<Result<PagedResult<CnasDrugDto>>> Handle(
        GetCnasDrugsPagedQuery request, CancellationToken ct)
    {
        var page     = Math.Clamp(request.Page, 1, int.MaxValue);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var result = await repo.GetDrugsPagedAsync(
            request.Search, request.IsActive, request.IsCompensated, page, pageSize, ct);
        return Result<PagedResult<CnasDrugDto>>.Success(result);
    }
}
