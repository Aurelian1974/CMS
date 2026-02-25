using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.UpdateMedicalTitle;

/// <summary>Actualizare titulatură medicală existentă.</summary>
public sealed record UpdateMedicalTitleCommand(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    int DisplayOrder
) : IRequest<Result<bool>>;
