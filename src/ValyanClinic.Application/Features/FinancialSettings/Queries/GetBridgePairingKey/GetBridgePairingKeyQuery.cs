using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Queries.GetBridgePairingKey;

public sealed record GetBridgePairingKeyQuery : IRequest<Result<BridgePairingKeyDto>>;
