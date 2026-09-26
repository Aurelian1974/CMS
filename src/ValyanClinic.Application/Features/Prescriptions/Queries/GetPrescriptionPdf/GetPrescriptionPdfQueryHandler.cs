using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionPdf;

public sealed class GetPrescriptionPdfQueryHandler(
    IPrescriptionRepository repository,
    IPrescriptionPdfGenerator pdfGenerator,
    ICurrentUser currentUser)
    : IRequestHandler<GetPrescriptionPdfQuery, Result<PrescriptionPdfFile>>
{
    public async Task<Result<PrescriptionPdfFile>> Handle(
        GetPrescriptionPdfQuery request, CancellationToken cancellationToken)
    {
        var prescription = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        if (prescription is null)
            return Result<PrescriptionPdfFile>.NotFound(ErrorMessages.Prescription.NotFound);

        // Numele fișierului nu conține date personale (fără nume pacient / CNP)
        var suffix = prescription.Number is null
            ? $"ciorna_{prescription.Id:N}"
            : $"{prescription.Series}{prescription.Number}";

        return Result<PrescriptionPdfFile>.Success(
            new PrescriptionPdfFile(pdfGenerator.Generate(prescription), $"reteta_{suffix}.pdf"));
    }
}
