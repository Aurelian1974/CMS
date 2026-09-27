using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetMedicalServices;

public sealed class GetMedicalServicesQueryHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetMedicalServicesQuery, Result<MedicalServicesPagedResponse>>
{
    public async Task<Result<MedicalServicesPagedResponse>> Handle(
        GetMedicalServicesQuery request, CancellationToken cancellationToken)
    {
        var filter = new MedicalServiceFilterData(
            request.Search, request.CategoryId, request.IsActive,
            request.Page, request.PageSize, request.SortBy, request.SortDir);

        var result = await repository.GetPagedAsync(currentUser.ClinicId, filter, cancellationToken);

        return Result<MedicalServicesPagedResponse>.Success(new MedicalServicesPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        });
    }
}
