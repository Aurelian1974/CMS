namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe specializări medicale.
/// </summary>
public interface ISpecialtyRepository
{
    Task<IEnumerable<Features.Nomenclature.Queries.GetSpecialties.SpecialtyDto>> GetAllAsync(
        bool? isActive, CancellationToken ct);

    Task<Features.Nomenclature.Queries.GetSpecialties.SpecialtyDto?> GetByIdAsync(
        Guid id, CancellationToken ct);

    Task<Features.Nomenclature.Queries.GetSpecialtyTree.SpecialtyTreeResult> GetTreeAsync(
        bool? isActive, CancellationToken ct);

    Task<Guid> CreateAsync(
        Guid? parentId, string name, string code, string? description,
        int displayOrder, byte level, CancellationToken ct);

    Task UpdateAsync(
        Guid id, Guid? parentId, string name, string code, string? description,
        int displayOrder, byte level, CancellationToken ct);

    Task ToggleActiveAsync(Guid id, bool isActive, CancellationToken ct);
}
