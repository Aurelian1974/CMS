using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetCompensatedDrugsPaged;

public sealed class GetCnasCompensatedDrugsPagedQueryHandler(ICnasSyncRepository repo)
    : IRequestHandler<GetCnasCompensatedDrugsPagedQuery, Result<PagedResult<CnasCompensatedDrugDto>>>
{
    public async Task<Result<PagedResult<CnasCompensatedDrugDto>>> Handle(
        GetCnasCompensatedDrugsPagedQuery request, CancellationToken ct)
    {
        var page     = Math.Clamp(request.Page, 1, int.MaxValue);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var result = await repo.GetCompensatedDrugsPagedAsync(
            request.Search, request.ListType, page, pageSize, ct);
        return Result<PagedResult<CnasCompensatedDrugDto>>.Success(result);
    }
}
