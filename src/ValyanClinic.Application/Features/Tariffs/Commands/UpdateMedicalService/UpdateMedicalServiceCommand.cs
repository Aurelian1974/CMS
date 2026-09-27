using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.UpdateMedicalService;

/// <summary>Date descriptive ale serviciului; prețul se schimbă prin AddMedicalServicePrice.</summary>
public sealed record UpdateMedicalServiceCommand(
    Guid Id,
    string Code,
    string Name,
    Guid CategoryId,
    int? DurationMinutes,
    string? InvestigationTypeCode,
    byte[] RowVersion)
    : IRequest<Result<bool>>;
