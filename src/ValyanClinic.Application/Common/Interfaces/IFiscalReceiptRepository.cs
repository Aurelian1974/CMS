using ValyanClinic.Application.Features.FiscalReceipts.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Mașina de stări a bonului fiscal (tranzițiile sunt validate în SP-uri).</summary>
public interface IFiscalReceiptRepository
{
    Task<FiscalReceiptDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    /// <summary>PENDING / FAILED → PRINTING. Din UNKNOWN nu se retipărește fără reconciliere.</summary>
    Task MarkPrintingAsync(Guid id, Guid clinicId, Guid updatedBy, CancellationToken ct);

    /// <summary>PRINTING → PRINTED / FAILED / UNKNOWN.</summary>
    Task SetResultAsync(FiscalReceiptResultData data, Guid updatedBy, CancellationToken ct);

    /// <summary>Confirmare manuală: UNKNOWN / PRINTING → PRINTED (cu număr) sau FAILED.</summary>
    Task ReconcileAsync(
        Guid id, Guid clinicId, bool wasPrinted, string? receiptNumber, string? note, Guid userId, CancellationToken ct);
}
