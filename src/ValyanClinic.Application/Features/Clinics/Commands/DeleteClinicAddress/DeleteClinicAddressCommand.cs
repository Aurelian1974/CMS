using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicAddress;

public sealed record DeleteClinicAddressCommand(Guid Id) : IRequest<Result<bool>>;
