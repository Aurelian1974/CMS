using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetIcd10CodesPaged;

internal sealed class GetCnasIcd10CodesPagedQueryHandler(ICnasSyncRepository repo)
    : IRequestHandler<GetCnasIcd10CodesPagedQuery, Result<PagedResult<CnasIcd10Dto>>>
{
    public async Task<Result<PagedResult<CnasIcd10Dto>>> Handle(
        GetCnasIcd10CodesPagedQuery request, CancellationToken ct)
    {
        var page     = Math.Clamp(request.Page, 1, int.MaxValue);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var result = await repo.GetIcd10CodesPagedAsync(request.Search, page, pageSize, ct);
        return Result<PagedResult<CnasIcd10Dto>>.Success(result);
    }
}
