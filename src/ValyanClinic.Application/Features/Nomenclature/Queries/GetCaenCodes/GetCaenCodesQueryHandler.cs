using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetCaenCodes;

public sealed class GetCaenCodesQueryHandler(ICaenCodeRepository repository)
    : IRequestHandler<GetCaenCodesQuery, Result<IEnumerable<CaenCodeDto>>>
{
    public async Task<Result<IEnumerable<CaenCodeDto>>> Handle(
        GetCaenCodesQuery request, CancellationToken cancellationToken)
    {
        // Nivel 4 = clase CAEN (coduri cu 4 cifre, folosite in CUI/inregistrare firma)
        int? level = request.ClassesOnly ? 4 : null;

        var codes = await repository.SearchAsync(
            request.Search, level, request.TopN, cancellationToken);

        return Result<IEnumerable<CaenCodeDto>>.Success(codes);
    }
}
