using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetDrugsPaged;

public sealed record GetCnasDrugsPagedQuery(
    string? Search,
    bool? IsActive,
    bool? IsCompensated,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<CnasDrugDto>>>;
