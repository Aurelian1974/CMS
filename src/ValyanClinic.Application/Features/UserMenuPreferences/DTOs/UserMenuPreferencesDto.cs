namespace ValyanClinic.Application.Features.UserMenuPreferences.DTOs;

/// <summary>
/// Preferințele sidebar-ului pentru utilizatorul curent. <see cref="FavoriteRoutes"/>
/// e ordonat — ordinea din listă e ordinea de afișare în secțiunea „Favorite".
/// </summary>
public sealed record UserMenuPreferencesDto
{
    public IReadOnlyList<string> FavoriteRoutes { get; init; } = [];
}
