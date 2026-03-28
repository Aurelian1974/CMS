using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetDrugsPaged;

public sealed class GetAnmDrugsPagedQueryHandler(IAnmSyncRepository repo)
    : IRequestHandler<GetAnmDrugsPagedQuery, Result<PagedResult<AnmDrugDto>>>
{
    public async Task<Result<PagedResult<AnmDrugDto>>> Handle(
        GetAnmDrugsPagedQuery request, CancellationToken ct)
    {
        var page     = Math.Clamp(request.Page, 1, int.MaxValue);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var result   = await repo.GetDrugsPagedAsync(request.Search, request.IsActive, request.IsCompensated, page, pageSize, ct);
        return Result<PagedResult<AnmDrugDto>>.Success(result);
    }
}
