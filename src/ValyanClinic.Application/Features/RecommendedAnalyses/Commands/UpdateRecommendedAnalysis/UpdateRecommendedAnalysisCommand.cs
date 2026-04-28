using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Commands.UpdateRecommendedAnalysis;

public sealed record UpdateRecommendedAnalysisCommand(
    Guid Id,
    byte Priority,
    string? Notes,
    byte Status
) : IRequest<Result<bool>>;
