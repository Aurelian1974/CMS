using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Commands.UpdateUserOverrides;

/// <summary>
/// Actualizează override-urile de permisiuni ale unui utilizator specific.
/// Primește lista completă — sincronizare delete + insert (replace all).
/// Lista goală = resetare la default-urile rolului.
/// </summary>
public sealed record UpdateUserOverridesCommand(
    Guid UserId,
    IReadOnlyList<UserOverrideItemDto> Overrides
) : IRequest<Result<int>>;

/// <summary>Un element override: modul + nivel de acces.</summary>
public sealed record UserOverrideItemDto(
    Guid ModuleId,
    Guid AccessLevelId);
