namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Consultație medicală — header (date generale).
/// Datele clinice sunt stocate în tabele dedicate (per-tab):
///   - <see cref="ConsultationAnamnesis"/> (Tab 1)
///   - <see cref="ConsultationExam"/> (Tab 2)
///   - restul tab-urilor: temporar pe coloane vechi în Consultations până la finalizarea refactor-ului.
/// </summary>
public sealed class Consultation
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? AppointmentId { get; set; }
    public DateTime Date { get; set; }
    public Guid StatusId { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    // ── Domain behavior ──────────────────────

    public bool IsLocked => StatusId != Guid.Empty && _lockedStatusIds.Contains(StatusId);

    private static readonly HashSet<Guid> _lockedStatusIds = [];

    public bool IsCompleted(Guid completedStatusId) => StatusId == completedStatusId;
}

