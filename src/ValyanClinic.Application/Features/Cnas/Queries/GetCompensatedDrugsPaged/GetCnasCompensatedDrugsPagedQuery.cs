using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetCompensatedDrugsPaged;

public sealed record GetCnasCompensatedDrugsPagedQuery(
    string? Search,
    string? ListType,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<CnasCompensatedDrugDto>>>;
