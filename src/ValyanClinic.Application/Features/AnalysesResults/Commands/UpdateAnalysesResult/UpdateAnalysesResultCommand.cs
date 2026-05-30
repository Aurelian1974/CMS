using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.Commands.CreateAnalysesResult;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.UpdateAnalysesResult;

public sealed record UpdateAnalysesResultCommand(
    Guid    Id,
    string? Laboratory,
    string? BulletinNumber,
    DateOnly CollectionDate,
    DateOnly? ResultDate,
    string? DoctorName,
    IReadOnlyList<AnalysesResultDetailInput> Details)
    : IRequest<Result<bool>>;
