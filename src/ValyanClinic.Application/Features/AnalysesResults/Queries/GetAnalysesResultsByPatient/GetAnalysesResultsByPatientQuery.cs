using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsByPatient;

public sealed record GetAnalysesResultsByPatientQuery(
    Guid     PatientId,
    DateOnly? DateFrom = null,
    DateOnly? DateTo   = null)
    : IRequest<Result<AnalysesResultsByPatientResponse>>;

public sealed record AnalysesResultsByPatientResponse(
    IReadOnlyList<AnalysesResultListDto> Headers,
    IReadOnlyList<AnalysesResultDetailRowDto> Details);
