using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.TransmitPrescription;

/// <summary>Transmite în SIPE o rețetă compensată emisă.</summary>
public sealed record TransmitPrescriptionCommand(Guid Id) : IRequest<Result<bool>>;
