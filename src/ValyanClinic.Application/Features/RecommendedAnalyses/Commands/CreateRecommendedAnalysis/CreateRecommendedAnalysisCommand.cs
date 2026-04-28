using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Commands.CreateRecommendedAnalysis;

public sealed record CreateRecommendedAnalysisCommand(
    Guid ConsultationId,
    Guid PatientId,
    Guid AnalysisId,
    byte Priority,
    string? Notes,
    byte Status
) : IRequest<Result<Guid>>;
