namespace ValyanClinic.Application.Features.Schedule.DTOs;

public sealed record ClinicScheduleDto(
    Guid Id,
    Guid ClinicId,
    byte DayOfWeek,
    bool IsOpen,
    string? OpenTime,
    string? CloseTime
);

public sealed record DoctorScheduleDto(
    Guid? Id,
    Guid ClinicId,
    Guid DoctorId,
    string DoctorName,
    string? SpecialtyName,
    byte? DayOfWeek,
    string? StartTime,
    string? EndTime
);

/// <summary>Program medic simplificat (fără info doctor — pentru GetByDoctor).</summary>
public sealed record DoctorDayDto(
    Guid Id,
    Guid DoctorId,
    byte DayOfWeek,
    string StartTime,
    string EndTime
);
