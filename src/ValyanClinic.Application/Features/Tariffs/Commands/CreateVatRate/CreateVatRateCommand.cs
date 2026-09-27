using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.CreateVatRate;

public sealed record CreateVatRateCommand(
    string Code,
    string Name,
    decimal Percent,
    string UblCategoryCode,
    string? ExemptionReasonCode,
    string? ExemptionReasonText)
    : IRequest<Result<Guid>>;
