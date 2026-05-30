using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.DeleteAnalysesResult;

public sealed record DeleteAnalysesResultCommand(Guid Id)
    : IRequest<Result<bool>>;
