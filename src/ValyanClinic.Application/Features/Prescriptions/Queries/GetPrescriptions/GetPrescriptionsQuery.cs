using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptions;

public sealed record GetPrescriptionsQuery(
    string? Search = null,
    Guid? PrescriptionTypeId = null,
    Guid? StatusId = null,
    Guid? DoctorId = null,
    Guid? PatientId = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "Date",
    string SortDir = "desc"
) : IRequest<Result<PrescriptionsPagedResponse>>;
