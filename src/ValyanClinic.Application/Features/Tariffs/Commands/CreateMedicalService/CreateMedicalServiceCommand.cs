using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;

/// <summary>Serviciu medical nou + prima versiune de preț (implicit valabilă de azi).</summary>
public sealed record CreateMedicalServiceCommand(
    string Code,
    string Name,
    Guid CategoryId,
    int? DurationMinutes,
    string? InvestigationTypeCode,
    decimal Price,
    Guid VatRateId,
    DateOnly? ValidFrom)
    : IRequest<Result<Guid>>;
