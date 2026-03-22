using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetSyncStatus;

/// <summary>Returnează statusul unui job de sincronizare în curs sau finalizat.</summary>
public sealed record GetCnasSyncStatusQuery(Guid JobId) : IRequest<Result<CnasSyncStatusDto>>;
