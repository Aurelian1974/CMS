namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru programare medicală.
/// O programare aparține unei clinici, leagă un pacient de un doctor,
/// are un interval orar și un status (programat, confirmat, finalizat, anulat, neprezentare).
/// </summary>
public sealed class Appointment
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public Guid StatusId { get; set; }
    public string? Notes { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
