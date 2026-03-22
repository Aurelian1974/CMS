namespace ValyanClinic.Domain.Entities;

public sealed class ClinicSchedule
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public byte DayOfWeek { get; set; }   // 1=Luni ... 7=Duminică
    public bool IsOpen { get; set; }
    public string? OpenTime { get; set; }  // "HH:mm"
    public string? CloseTime { get; set; } // "HH:mm"
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
