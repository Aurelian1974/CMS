using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Features.Prescriptions.DTOs;
using ValyanClinic.Infrastructure.Services;
using Xunit;

namespace ValyanClinic.Tests.Services;

public sealed class PrescriptionPdfGeneratorTests
{
    private static readonly byte[] PdfSignature = "%PDF"u8.ToArray();

    private static PrescriptionDetailDto Sample(bool isCnas, string statusCode) => new()
    {
        Id = Guid.NewGuid(),
        ClinicName = "Clinica Test",
        PatientName = "Popescu Ion",
        PatientCnp = "1800101123456",
        PatientBirthDate = new DateOnly(1980, 1, 1),
        DoctorName = "Ionescu Maria",
        DoctorMedicalCode = "A12345",
        IsCnas = isCnas,
        StatusCode = statusCode,
        Series = "RS",
        Number = 7,
        IssueDate = new DateTime(2026, 9, 26),
        ValidUntil = new DateOnly(2026, 10, 26),
        Diagnostic = "Hipertensiune arterială esențială",
        DiagnosticCodes = "I10",
        CareTypeName = "Cronic (max. 30 zile)",
        TreatmentDays = 30,
        Items =
        [
            new PrescriptionItemDto
            {
                DrugName = "PRESTARIUM 5 mg", ActiveSubstance = "PERINDOPRILUM", PharmaceuticalForm = "compr. film.",
                Concentration = "5 mg", CopaymentListType = isCnas ? "B" : null, CopaymentPercent = isCnas ? 50 : null,
                DiagnosisCode = "I10", DoseMorning = 1, DurationDays = 30, Quantity = 30, PrescriptionMode = "PRF",
            },
        ],
    };

    [Theory]
    [InlineData(true,  PrescriptionStatusCodes.Issued)]
    [InlineData(false, PrescriptionStatusCodes.Issued)]
    [InlineData(true,  PrescriptionStatusCodes.Draft)]
    [InlineData(false, PrescriptionStatusCodes.Cancelled)]
    public void Generate_BothLayouts_ProducesPdf(bool isCnas, string statusCode)
    {
        var bytes = new PrescriptionPdfGenerator().Generate(Sample(isCnas, statusCode));

        Assert.True(bytes.Length > 1000);
        Assert.Equal(PdfSignature, bytes[..PdfSignature.Length]);
    }
}
