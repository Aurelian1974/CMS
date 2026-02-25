using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.ToggleMedicalTitle;

/// <summary>Activează/dezactivează o titulatură medicală.</summary>
public sealed record ToggleMedicalTitleCommand(Guid Id, bool IsActive) : IRequest<Result<bool>>;
