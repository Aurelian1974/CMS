using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Client pentru Sistemul Informatic al Prescripției Electronice (CNAS).
/// Implementarea reală necesită certificatul digital al medicului și contractul cu CAS.
/// </summary>
public interface ISipeClient
{
    bool IsEnabled { get; }

    Task<SipeTransmissionResult> TransmitAsync(PrescriptionDetailDto prescription, CancellationToken ct);
}
