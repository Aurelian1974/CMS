namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Consultație medicală — înregistrare clinică cu motiv, examen, diagnostic și tratament.
/// </summary>
public sealed class Consultation
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? AppointmentId { get; set; }
    public DateTime Date { get; set; }
    public string? Motiv { get; set; }
    public string? ExamenClinic { get; set; }
    public string? Diagnostic { get; set; }
    public string? DiagnosticCodes { get; set; }
    public string? Recomandari { get; set; }
    public string? Observatii { get; set; }
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
