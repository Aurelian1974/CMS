namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

public sealed class PrescriptionTypeLookupDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsCnas { get; init; }
    public int? MaxItems { get; init; }
}
