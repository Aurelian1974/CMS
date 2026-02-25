using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.CreateMedicalTitle;

/// <summary>Creare titulatură medicală nouă.</summary>
public sealed record CreateMedicalTitleCommand(
    string Name,
    string Code,
    string? Description,
    int DisplayOrder
) : IRequest<Result<Guid>>;
