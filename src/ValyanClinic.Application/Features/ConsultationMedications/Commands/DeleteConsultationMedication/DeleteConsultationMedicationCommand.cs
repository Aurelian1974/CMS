using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.DeleteConsultationMedication;

public sealed record DeleteConsultationMedicationCommand(Guid Id) : IRequest<Result<bool>>;
