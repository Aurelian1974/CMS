using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicContactPerson;

public sealed record CreateClinicContactPersonCommand(
    string Name,
    string? Function,
    string? PhoneNumber,
    string? Email,
    bool IsMain
) : IRequest<Result<Guid>>;
