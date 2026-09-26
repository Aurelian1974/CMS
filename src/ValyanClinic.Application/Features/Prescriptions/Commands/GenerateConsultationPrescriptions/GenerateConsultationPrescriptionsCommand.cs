using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.GenerateConsultationPrescriptions;

/// <summary>Generează rețetele (ciornă) din tratamentul recomandat al consultației.</summary>
public sealed record GenerateConsultationPrescriptionsCommand(
    Guid ConsultationId,
    Guid? CareTypeId,
    Guid? InsuredCategoryId,
    int? TreatmentDays)
    : IRequest<Result<IReadOnlyList<Guid>>>;
