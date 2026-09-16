using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.UserMenuPreferences.Commands.UpsertUserMenuPreferences;

/// <summary>
/// Salvează lista de rute favorite ale utilizatorului curent, în ordinea de afișare.
/// </summary>
public sealed record UpsertUserMenuPreferencesCommand(
    IReadOnlyList<string> FavoriteRoutes
) : IRequest<Result<bool>>;
