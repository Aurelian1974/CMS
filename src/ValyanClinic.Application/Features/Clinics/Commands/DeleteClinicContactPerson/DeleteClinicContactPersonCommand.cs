using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicContactPerson;

public sealed record DeleteClinicContactPersonCommand(Guid Id) : IRequest<Result<bool>>;
