using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.CancelPrescription;

public sealed record CancelPrescriptionCommand(Guid Id, string Reason) : IRequest<Result<bool>>;
