using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetMedicalServices;

public sealed record GetMedicalServicesQuery(
    string? Search,
    Guid? CategoryId,
    bool? IsActive,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "Name",
    string SortDir = "asc")
    : IRequest<Result<MedicalServicesPagedResponse>>;
