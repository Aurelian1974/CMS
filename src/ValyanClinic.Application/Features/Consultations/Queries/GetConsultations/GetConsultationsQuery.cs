using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Queries.GetConsultations;

/// <summary>Query paginat pentru listare consultații.</summary>
public sealed record GetConsultationsQuery(
    string? Search = null,
    Guid? DoctorId = null,
    Guid? StatusId = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "Date",
    string SortDir = "desc"
) : IRequest<Result<ConsultationsPagedResponse>>;

public sealed class ConsultationsPagedResponse
{
    public required PagedResult<ConsultationListDto> PagedResult { get; init; }
    public required ConsultationStatsDto Stats { get; init; }
}
