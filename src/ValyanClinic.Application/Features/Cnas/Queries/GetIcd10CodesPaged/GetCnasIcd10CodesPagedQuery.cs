using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetIcd10CodesPaged;

public sealed record GetCnasIcd10CodesPagedQuery(
    string? Search,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<CnasIcd10Dto>>>;
