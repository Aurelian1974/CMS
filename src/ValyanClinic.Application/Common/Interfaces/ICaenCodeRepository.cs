using ValyanClinic.Application.Features.Nomenclature.Queries.GetCaenCodes;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Contract repository pentru nomenclatorul codurilor CAEN.</summary>
public interface ICaenCodeRepository
{
    /// <summary>
    /// Cauta coduri CAEN dupa text liber (cod sau denumire).
    /// </summary>
    /// <param name="search">Text de cautare (optional).</param>
    /// <param name="level">Filtrare pe nivel: 1=Sectiune, 2=Diviziune, 3=Grupa, 4=Clasa (optional).</param>
    /// <param name="topN">Numar maxim de rezultate.</param>
    Task<IEnumerable<CaenCodeDto>> SearchAsync(
        string? search, int? level, int topN, CancellationToken ct);
}
