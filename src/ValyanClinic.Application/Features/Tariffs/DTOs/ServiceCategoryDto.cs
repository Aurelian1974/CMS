namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed class ServiceCategoryDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int SortOrder { get; init; }
}
