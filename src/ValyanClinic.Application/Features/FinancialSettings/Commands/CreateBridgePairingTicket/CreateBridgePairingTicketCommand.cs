using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.CreateBridgePairingTicket;

public sealed record CreateBridgePairingTicketCommand : IRequest<Result<BridgePairingTicketDto>>;
