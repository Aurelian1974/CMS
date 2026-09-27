using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.AddMedicalServicePrice;

/// <summary>Versiune nouă de preț, valabilă de la <see cref="ValidFrom"/> (nu în trecut).</summary>
public sealed record AddMedicalServicePriceCommand(
    Guid MedicalServiceId,
    decimal Price,
    Guid VatRateId,
    DateOnly ValidFrom)
    : IRequest<Result<Guid>>;
