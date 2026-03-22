using ValyanClinic.Application.Features.Schedule.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IScheduleRepository
{
    // ── Clinic Schedule ───────────────────────────────────────────────────────
    Task<IEnumerable<ClinicScheduleDto>> GetClinicScheduleAsync(Guid clinicId, CancellationToken ct);

    Task UpsertClinicDayAsync(
        Guid clinicId, byte dayOfWeek, bool isOpen,
        string? openTime, string? closeTime,
        Guid userId, CancellationToken ct);

    // ── Doctor Schedule ───────────────────────────────────────────────────────
    Task<IEnumerable<DoctorScheduleDto>> GetDoctorScheduleByClinicAsync(Guid clinicId, CancellationToken ct);

    Task<IEnumerable<DoctorDayDto>> GetDoctorScheduleByDoctorAsync(Guid doctorId, Guid clinicId, CancellationToken ct);

    Task UpsertDoctorDayAsync(
        Guid clinicId, Guid doctorId, byte dayOfWeek,
        string startTime, string endTime,
        Guid userId, CancellationToken ct);

    Task DeleteDoctorDayAsync(Guid doctorId, byte dayOfWeek, Guid clinicId, CancellationToken ct);
}
