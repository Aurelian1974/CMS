using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.DeletePrescription;

/// <summary>Șterge (soft) o rețetă în ciornă. Rețetele emise se anulează.</summary>
public sealed record DeletePrescriptionCommand(Guid Id) : IRequest<Result<bool>>;
