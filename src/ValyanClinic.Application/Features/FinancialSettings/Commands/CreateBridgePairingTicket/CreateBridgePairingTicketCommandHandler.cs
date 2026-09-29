using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.CreateBridgePairingTicket;

public sealed class CreateBridgePairingTicketCommandHandler(
    IBridgePairingTicketIssuer issuer,
    ICurrentUser currentUser)
    : IRequestHandler<CreateBridgePairingTicketCommand, Result<BridgePairingTicketDto>>
{
    public Task<Result<BridgePairingTicketDto>> Handle(
        CreateBridgePairingTicketCommand request, CancellationToken cancellationToken)
    {
        // Rolul, nu nivelul pe modul: permisiunile pe module se pot acorda și altor roluri
        if (!string.Equals(currentUser.Role, Roles.Admin, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(Result<BridgePairingTicketDto>.Forbidden(ErrorMessages.FiscalBridge.PairingRequiresAdmin));

        if (!issuer.IsConfigured)
            return Task.FromResult(Result<BridgePairingTicketDto>.Failure(ErrorMessages.FiscalBridge.PairingKeyNotConfigured));

        return Task.FromResult(Result<BridgePairingTicketDto>.Success(
            issuer.Issue(currentUser.ClinicId, currentUser.Id)));
    }
}
