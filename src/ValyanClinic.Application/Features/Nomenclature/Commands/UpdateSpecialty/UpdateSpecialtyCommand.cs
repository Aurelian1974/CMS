using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.UpdateSpecialty;

/// <summary>Actualizare specializare existentă.</summary>
public sealed record UpdateSpecialtyCommand(
    Guid Id,
    Guid? ParentId,
    string Name,
    string Code,
    string? Description,
    int DisplayOrder,
    byte Level
) : IRequest<Result<bool>>;
