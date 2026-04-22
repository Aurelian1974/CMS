using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ICD10.Commands.AddICD10Favorite;

/// <summary>Command pentru adăugarea unui cod ICD-10 la favorite.</summary>
public sealed record AddICD10FavoriteCommand(Guid ICD10_ID)
    : IRequest<Result<bool>>;
