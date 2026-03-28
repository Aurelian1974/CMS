using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetDrugsPaged;

public sealed record GetAnmDrugsPagedQuery(
    string? Search,
    bool?   IsActive,
    bool?   IsCompensated,
    int     Page,
    int     PageSize
) : IRequest<Result<PagedResult<AnmDrugDto>>>;
