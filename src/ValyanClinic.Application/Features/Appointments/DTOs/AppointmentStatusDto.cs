namespace ValyanClinic.Application.Features.Appointments.DTOs;

/// <summary>Nomenclator status programare + tranzițiile permise din el.</summary>
public sealed class AppointmentStatusDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public bool BlocksSlot { get; init; }
    /// <summary>Coduri separate prin virgulă (STRING_AGG din SP); null pentru statusuri terminale.</summary>
    public string? AllowedNextCodes { get; init; }
}
