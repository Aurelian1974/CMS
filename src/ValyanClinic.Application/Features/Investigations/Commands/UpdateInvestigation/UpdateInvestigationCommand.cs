using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Investigations.Commands.UpdateInvestigation;

public sealed record UpdateInvestigationCommand(
    Guid Id,
    DateTime InvestigationDate,
    string? StructuredData,
    string? Narrative,
    bool IsExternal,
    string? ExternalSource,
    byte Status,
    Guid? AttachedDocumentId,
    bool HasStructuredData,
    string InvestigationType
) : IRequest<Result<bool>>;
