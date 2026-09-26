using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionPdf;

public sealed record GetPrescriptionPdfQuery(Guid Id) : IRequest<Result<PrescriptionPdfFile>>;
