using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetUserOverrides;

/// <summary>Returnează override-urile de permisiuni ale unui utilizator specific.</summary>
public sealed record GetUserOverridesQuery(Guid UserId) : IRequest<Result<IReadOnlyList<UserOverrideDto>>>;
