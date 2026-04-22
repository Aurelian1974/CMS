using ValyanClinic.Application.Features.ICD10.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe coduri ICD-10.
/// </summary>
public interface IICD10Repository
{
    Task<IEnumerable<ICD10SearchResultDto>> SearchAsync(
        string searchTerm, int maxResults, CancellationToken ct);

    Task<IEnumerable<ICD10SearchResultDto>> GetFavoritesAsync(
        Guid userId, CancellationToken ct);

    Task<bool> AddFavoriteAsync(
        Guid userId, Guid icd10Id, CancellationToken ct);

    Task<bool> RemoveFavoriteAsync(
        Guid userId, Guid icd10Id, CancellationToken ct);
}
