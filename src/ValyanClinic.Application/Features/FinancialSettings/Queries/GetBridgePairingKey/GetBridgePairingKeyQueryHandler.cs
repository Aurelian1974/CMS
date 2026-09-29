using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Queries.GetBridgePairingKey;

public sealed class GetBridgePairingKeyQueryHandler(
    IBridgePairingTicketIssuer issuer,
    ICurrentUser currentUser)
    : IRequestHandler<GetBridgePairingKeyQuery, Result<BridgePairingKeyDto>>
{
    public Task<Result<BridgePairingKeyDto>> Handle(GetBridgePairingKeyQuery request, CancellationToken cancellationToken)
    {
        if (!string.Equals(currentUser.Role, Roles.Admin, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(Result<BridgePairingKeyDto>.Forbidden(ErrorMessages.FiscalBridge.PairingRequiresAdmin));

        return Task.FromResult(Result<BridgePairingKeyDto>.Success(new BridgePairingKeyDto
        {
            IsConfigured = issuer.IsConfigured,
            PublicKeyPem = issuer.IsConfigured ? issuer.GetPublicKeyPem() : null,
        }));
    }
}
