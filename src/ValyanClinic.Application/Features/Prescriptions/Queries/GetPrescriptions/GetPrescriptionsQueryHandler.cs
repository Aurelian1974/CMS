using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptions;

public sealed class GetPrescriptionsQueryHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPrescriptionsQuery, Result<PrescriptionsPagedResponse>>
{
    public async Task<Result<PrescriptionsPagedResponse>> Handle(
        GetPrescriptionsQuery request, CancellationToken cancellationToken)
    {
        var filter = new PrescriptionFilterData(
            request.Search,
            request.PrescriptionTypeId,
            request.StatusId,
            request.DoctorId,
            request.PatientId,
            request.DateFrom,
            request.DateTo,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir);

        var result = await repository.GetPagedAsync(currentUser.ClinicId, filter, cancellationToken);

        return Result<PrescriptionsPagedResponse>.Success(new PrescriptionsPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        });
    }
}
