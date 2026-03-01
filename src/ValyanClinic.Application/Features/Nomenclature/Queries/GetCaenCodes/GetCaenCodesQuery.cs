using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetCaenCodes;

/// <summary>
/// Cauta coduri CAEN dupa text liber (pe cod sau denumire).
/// <para>Parametri optionali: Search (text), ClassesOnly (doar nivel 4), TopN (limita, default 50).</para>
/// </summary>
public sealed record GetCaenCodesQuery(
    string? Search = null,
    bool ClassesOnly = false,
    int TopN = 50
) : IRequest<Result<IEnumerable<CaenCodeDto>>>;
