using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ICD10.Commands.RemoveICD10Favorite;

/// <summary>Command pentru eliminarea unui cod ICD-10 din favorite.</summary>
public sealed record RemoveICD10FavoriteCommand(Guid ICD10_ID)
    : IRequest<Result<bool>>;
