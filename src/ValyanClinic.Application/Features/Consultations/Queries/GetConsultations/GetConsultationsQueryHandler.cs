using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Queries.GetConsultations;

public sealed class GetConsultationsQueryHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationsQuery, Result<ConsultationsPagedResponse>>
{
    public async Task<Result<ConsultationsPagedResponse>> Handle(
        GetConsultationsQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.DoctorId,
            request.StatusId,
            request.DateFrom,
            request.DateTo,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        var response = new ConsultationsPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        };

        return Result<ConsultationsPagedResponse>.Success(response);
    }
}
