using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetSyncHistory;

public sealed record GetAnmSyncHistoryQuery(int Count = 10)
    : IRequest<Result<IEnumerable<AnmSyncHistoryDto>>>;
