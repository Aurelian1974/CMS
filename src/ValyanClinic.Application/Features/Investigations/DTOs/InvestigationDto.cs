namespace ValyanClinic.Application.Features.Investigations.DTOs;

/// <summary>Investigație paraclinică (formă canonică pentru API).</summary>
public sealed class InvestigationDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid PatientId { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;

    public string InvestigationType { get; init; } = string.Empty;
    public string InvestigationTypeDisplayName { get; init; } = string.Empty;
    public string UIPattern { get; init; } = string.Empty;
    public string ParentTab { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;

    public DateTime InvestigationDate { get; init; }

    /// <summary>JSON brut tipizat (forma se decide după <see cref="InvestigationType"/>).</summary>
    public string? StructuredData { get; init; }

    /// <summary>HTML rezultat din rich-text editor.</summary>
    public string? Narrative { get; init; }

    public bool IsExternal { get; init; }
    public string? ExternalSource { get; init; }
    public byte Status { get; init; }

    public Guid? AttachedDocumentId { get; init; }
    public string? AttachedDocumentName { get; init; }
    public bool HasStructuredData { get; init; }

    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
}
