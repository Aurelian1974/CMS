using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.UpdateVatRate;

/// <summary>Codul regimului TVA este imuabil.</summary>
public sealed record UpdateVatRateCommand(
    Guid Id,
    string Name,
    decimal Percent,
    string UblCategoryCode,
    string? ExemptionReasonCode,
    string? ExemptionReasonText,
    bool IsActive)
    : IRequest<Result<bool>>;
