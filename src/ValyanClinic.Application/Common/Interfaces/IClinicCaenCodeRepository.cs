using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru codurile CAEN ale unei clinici.
/// </summary>
public interface IClinicCaenCodeRepository
{
    /// <summary>Returnează toate codurile CAEN asociate clinicii, sortate: principal primul, restul alfabetic.</summary>
    Task<IReadOnlyList<ClinicCaenCodeDto>> GetByClinicIdAsync(Guid clinicId, CancellationToken ct);

    /// <summary>
    /// Sincronizare completă: șterge toate codurile existente și inserează lista nouă.
    /// Primul element din listă devine codul principal (IsPrimary = true).
    /// Lista goală → se șterg toate codurile CAEN ale clinicii.
    /// </summary>
    Task SyncAsync(Guid clinicId, IEnumerable<Guid> caenCodeIds, CancellationToken ct);
}
