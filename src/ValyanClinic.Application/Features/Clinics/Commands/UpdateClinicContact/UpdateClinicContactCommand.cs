using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicContact;

public sealed record UpdateClinicContactCommand(
    Guid Id,
    string ContactType,
    string Value,
    string? Label,
    bool IsMain
) : IRequest<Result<bool>>;
