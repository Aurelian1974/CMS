using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.UpdateConsultationServiceQuantity;

public sealed record UpdateConsultationServiceQuantityCommand(Guid Id, decimal Quantity) : IRequest<Result<bool>>;
