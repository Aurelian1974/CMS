using System.Text.Json;
using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.UserMenuPreferences.DTOs;

namespace ValyanClinic.Application.Features.UserMenuPreferences.Queries.GetUserMenuPreferences;

public sealed class GetUserMenuPreferencesQueryHandler(
    IUserMenuPreferenceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetUserMenuPreferencesQuery, Result<UserMenuPreferencesDto>>
{
    public async Task<Result<UserMenuPreferencesDto>> Handle(
        GetUserMenuPreferencesQuery request, CancellationToken ct)
    {
        var json = await repository.GetFavoriteRoutesJsonAsync(currentUser.Id, currentUser.ClinicId, ct);

        var favoriteRoutes = string.IsNullOrEmpty(json)
            ? []
            : JsonSerializer.Deserialize<List<string>>(json) ?? [];

        return Result<UserMenuPreferencesDto>.Success(
            new UserMenuPreferencesDto { FavoriteRoutes = favoriteRoutes });
    }
}
