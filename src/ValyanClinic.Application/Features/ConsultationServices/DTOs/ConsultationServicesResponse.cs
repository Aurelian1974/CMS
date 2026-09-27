namespace ValyanClinic.Application.Features.ConsultationServices.DTOs;

public sealed class ConsultationServicesResponse
{
    public IReadOnlyList<ConsultationServiceDto> Lines { get; init; } = [];
    /// <summary>Suma liniilor (fiecare rotunjită la 2 zecimale) — totalul de plată.</summary>
    public decimal Total { get; init; }
}
