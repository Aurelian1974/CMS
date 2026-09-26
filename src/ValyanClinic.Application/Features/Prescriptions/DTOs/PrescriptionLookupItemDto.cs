namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Element generic de nomenclator (status, categorie asigurat).</summary>
public sealed class PrescriptionLookupItemDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}
