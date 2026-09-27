using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.SetMedicalServiceActive;

/// <summary>Dezactivare / reactivare — serviciile nu se șterg.</summary>
public sealed record SetMedicalServiceActiveCommand(Guid Id, bool IsActive) : IRequest<Result<bool>>;
