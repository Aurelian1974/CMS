using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.DeleteConsultationService;

public sealed record DeleteConsultationServiceCommand(Guid Id) : IRequest<Result<bool>>;
