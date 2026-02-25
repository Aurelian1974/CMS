using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetMedicalTitles;

public sealed class GetMedicalTitlesQueryHandler(IMedicalTitleRepository repository)
    : IRequestHandler<GetMedicalTitlesQuery, Result<IEnumerable<MedicalTitleDto>>>
{
    public async Task<Result<IEnumerable<MedicalTitleDto>>> Handle(
        GetMedicalTitlesQuery request, CancellationToken cancellationToken)
    {
        var titles = await repository.GetAllAsync(request.IsActive, cancellationToken);
        return Result<IEnumerable<MedicalTitleDto>>.Success(titles);
    }
}
