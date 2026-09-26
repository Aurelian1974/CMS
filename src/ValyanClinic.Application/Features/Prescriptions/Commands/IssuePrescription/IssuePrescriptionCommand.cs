using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.IssuePrescription;

/// <summary>Emite rețeta din ciornă: serie + număr, dată, valabilitate.</summary>
public sealed record IssuePrescriptionCommand(Guid Id) : IRequest<Result<bool>>;
