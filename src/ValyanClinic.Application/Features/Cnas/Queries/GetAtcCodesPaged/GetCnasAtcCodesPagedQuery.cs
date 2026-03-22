using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetAtcCodesPaged;

public sealed record GetCnasAtcCodesPagedQuery(
    string? Search,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<CnasAtcCodeDto>>>;
