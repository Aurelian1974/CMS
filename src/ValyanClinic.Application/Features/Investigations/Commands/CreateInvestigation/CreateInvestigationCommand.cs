using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Investigations.Commands.CreateInvestigation;

/// <summary>Creează o investigație paraclinică.</summary>
public sealed record CreateInvestigationCommand(
    Guid ConsultationId,
    Guid PatientId,
    Guid DoctorId,
    string InvestigationType,
    DateTime InvestigationDate,
    string? StructuredData,
    string? Narrative,
    bool IsExternal,
    string? ExternalSource,
    byte Status,
    Guid? AttachedDocumentId,
    bool HasStructuredData
) : IRequest<Result<Guid>>;
