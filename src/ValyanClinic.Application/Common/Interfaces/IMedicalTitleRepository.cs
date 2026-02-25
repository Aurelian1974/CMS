namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe titulaturi medicale.
/// </summary>
public interface IMedicalTitleRepository
{
    Task<IEnumerable<Features.Nomenclature.Queries.GetMedicalTitles.MedicalTitleDto>> GetAllAsync(
        bool? isActive, CancellationToken ct);

    Task<Guid> CreateAsync(
        string name, string code, string? description,
        int displayOrder, CancellationToken ct);

    Task UpdateAsync(
        Guid id, string name, string code, string? description,
        int displayOrder, CancellationToken ct);

    Task ToggleActiveAsync(Guid id, bool isActive, CancellationToken ct);
}
