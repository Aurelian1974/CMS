using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicContactPerson;

public sealed record UpdateClinicContactPersonCommand(
    Guid Id,
    string Name,
    string? Function,
    string? PhoneNumber,
    string? Email,
    bool IsMain
) : IRequest<Result<bool>>;
