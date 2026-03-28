using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Serviciu pentru descărcarea și importul nomenclatorului ANM
/// (Agenția Națională a Medicamentului și a Dispozitivelor Medicale).
/// Sursa: https://nomenclator.anm.ro/files/nomenclator.xlsx
/// </summary>
public interface IAnmNomenclatorService
{
    /// <summary>
    /// Pornește sincronizarea în background. Returnează imediat JobId-ul.
    /// </summary>
    Task<Guid> StartSyncAsync(string triggeredBy, CancellationToken ct = default);
}
