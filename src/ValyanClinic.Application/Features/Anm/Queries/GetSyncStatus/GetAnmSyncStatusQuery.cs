using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetSyncStatus;

public sealed record GetAnmSyncStatusQuery(Guid JobId) : IRequest<Result<AnmSyncStatusDto>>;
