using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.CreateSpecialty;

/// <summary>Creare specializare nouă (categorie, specialitate sau subspecialitate).</summary>
public sealed record CreateSpecialtyCommand(
    Guid? ParentId,
    string Name,
    string Code,
    string? Description,
    int DisplayOrder,
    byte Level
) : IRequest<Result<Guid>>;
