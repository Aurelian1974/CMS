namespace ValyanClinic.Domain.Entities;

public sealed class DoctorSchedule
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid DoctorId { get; set; }
    public byte DayOfWeek { get; set; }   // 1=Luni ... 7=Duminică
    public string StartTime { get; set; } = string.Empty; // "HH:mm"
    public string EndTime { get; set; } = string.Empty;   // "HH:mm"
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
