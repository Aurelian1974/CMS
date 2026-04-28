namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Investigație paraclinică efectuată în cadrul unei consultații (1:N cu Consultation).
/// Câmpurile <see cref="PatientId"/> și <see cref="DoctorId"/> sunt denormalizate pentru
/// query-uri de trending eficiente la nivel de pacient.
/// </summary>
public sealed class ConsultationInvestigation
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid PatientId { get; init; }
    public Guid DoctorId { get; init; }
    public string InvestigationType { get; set; } = string.Empty;
    public DateTime InvestigationDate { get; set; }
    public string? StructuredData { get; set; }
    public string? Narrative { get; set; }
    public bool IsExternal { get; set; }
    public string? ExternalSource { get; set; }
    public byte Status { get; set; }
    public Guid? AttachedDocumentId { get; set; }
    public bool HasStructuredData { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
