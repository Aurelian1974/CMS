using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Implementarea implicită: SIPE neconfigurat. Rețetele compensate rămân emise în aplicație
/// și se transmit din aplicația CNAS până la configurarea integrării reale.
/// </summary>
public sealed class DisabledSipeClient : ISipeClient
{
    public bool IsEnabled => false;

    public Task<SipeTransmissionResult> TransmitAsync(PrescriptionDetailDto prescription, CancellationToken ct) =>
        Task.FromResult(new SipeTransmissionResult(false, null, false, ErrorMessages.Prescription.SipeNotConfigured));
}
