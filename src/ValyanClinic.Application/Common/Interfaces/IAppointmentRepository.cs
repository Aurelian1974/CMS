using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe programările clinicii.
/// </summary>
public interface IAppointmentRepository
{
    /// <summary>Listare paginată cu filtre + statistici — multiple result sets din SP.</summary>
    Task<AppointmentPagedResult> GetPagedAsync(
        Guid clinicId, string? search, Guid? doctorId, Guid? statusId,
        DateTime? dateFrom, DateTime? dateTo,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    /// <summary>Detalii complete programare.</summary>
    Task<AppointmentDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    /// <summary>Programări pentru scheduler (interval de date, opțional filtrat pe doctor).</summary>
    Task<IEnumerable<AppointmentSchedulerDto>> GetForSchedulerAsync(
        Guid clinicId, DateTime dateFrom, DateTime dateTo, Guid? doctorId,
        CancellationToken ct);

    /// <summary>Creare programare — returnează ID-ul generat.</summary>
    Task<Guid> CreateAsync(AppointmentWriteData data, CancellationToken ct);

    /// <summary>Actualizare programare; <paramref name="rowVersion"/> null = fără verificare de concurență.</summary>
    Task UpdateAsync(Guid id, byte[]? rowVersion, AppointmentWriteData data, CancellationToken ct);

    /// <summary>Actualizare doar status programare.</summary>
    Task UpdateStatusAsync(Guid id, Guid clinicId, Guid statusId, Guid updatedBy, CancellationToken ct);

    /// <summary>Soft delete programare.</summary>
    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    /// <summary>Nomenclator statusuri + tranziții permise.</summary>
    Task<IEnumerable<AppointmentStatusDto>> GetStatusesAsync(CancellationToken ct);
}

/// <summary>Rezultatul combinat din GetPagedAsync — date paginate + statistici.</summary>
public sealed record AppointmentPagedResult(
    PagedResult<AppointmentListDto> Paged,
    AppointmentStatsDto Stats);
