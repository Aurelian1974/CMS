namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Persistă preferințele sidebar-ului (favorite) per utilizator.</summary>
public interface IUserMenuPreferenceRepository
{
    /// <summary>Ruta JSON brută (FavoriteRoutes) salvată pentru utilizator, sau null dacă nu există.</summary>
    Task<string?> GetFavoriteRoutesJsonAsync(Guid userId, Guid clinicId, CancellationToken ct);

    Task UpsertFavoriteRoutesAsync(
        Guid userId, Guid clinicId, string favoriteRoutesJson, Guid updatedBy, CancellationToken ct);
}
