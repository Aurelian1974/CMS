using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicContact;

public sealed record DeleteClinicContactCommand(Guid Id) : IRequest<Result<bool>>;
