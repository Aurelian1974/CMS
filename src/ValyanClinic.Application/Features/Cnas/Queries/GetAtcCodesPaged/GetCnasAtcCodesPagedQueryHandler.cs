using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetAtcCodesPaged;

internal sealed class GetCnasAtcCodesPagedQueryHandler(ICnasSyncRepository repo)
    : IRequestHandler<GetCnasAtcCodesPagedQuery, Result<PagedResult<CnasAtcCodeDto>>>
{
    public async Task<Result<PagedResult<CnasAtcCodeDto>>> Handle(
        GetCnasAtcCodesPagedQuery request, CancellationToken ct)
    {
        var page     = Math.Clamp(request.Page, 1, int.MaxValue);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var result = await repo.GetAtcCodesPagedAsync(request.Search, page, pageSize, ct);
        return Result<PagedResult<CnasAtcCodeDto>>.Success(result);
    }
}
