using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetSyncHistory;

public sealed record GetCnasSyncHistoryQuery(int Count = 10) : IRequest<Result<IEnumerable<CnasSyncHistoryDto>>>;
