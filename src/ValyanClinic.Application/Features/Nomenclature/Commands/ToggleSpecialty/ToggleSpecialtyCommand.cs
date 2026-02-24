using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.ToggleSpecialty;

/// <summary>Activează/dezactivează o specializare (și copiii, dacă se dezactivează).</summary>
public sealed record ToggleSpecialtyCommand(Guid Id, bool IsActive) : IRequest<Result<bool>>;
