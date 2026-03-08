using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicContact;

public sealed record CreateClinicContactCommand(
    string ContactType,
    string Value,
    string? Label,
    bool IsMain
) : IRequest<Result<Guid>>;
