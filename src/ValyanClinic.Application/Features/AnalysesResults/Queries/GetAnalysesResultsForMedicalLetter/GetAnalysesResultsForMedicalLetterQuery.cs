using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;
using MediatR;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsForMedicalLetter;

public sealed record GetAnalysesResultsForMedicalLetterQuery(Guid ConsultationId)
    : IRequest<Result<AnalysesResultsForLetterResponse>>;
