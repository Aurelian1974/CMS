namespace ValyanClinic.Application.Features.Invoices.DTOs;

/// <summary>Linie introdusă manual pe factura de corecție (după stornarea facturii inițiale).</summary>
public sealed record InvoiceLineInput(
    Guid? MedicalServiceId,
    string? Code,
    string Name,
    decimal UnitPrice,
    decimal Quantity,
    Guid VatRateId);
