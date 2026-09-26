namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionPdf;

public sealed record PrescriptionPdfFile(byte[] Content, string FileName);
