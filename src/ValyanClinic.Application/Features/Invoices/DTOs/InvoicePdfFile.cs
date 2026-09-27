namespace ValyanClinic.Application.Features.Invoices.DTOs;

public sealed record InvoicePdfFile(byte[] Content, string FileName);
