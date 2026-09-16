using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.UserMenuPreferences.DTOs;

namespace ValyanClinic.Application.Features.UserMenuPreferences.Queries.GetUserMenuPreferences;

/// <summary>Preferințele sidebar-ului (favorite) ale utilizatorului curent.</summary>
public sealed record GetUserMenuPreferencesQuery : IRequest<Result<UserMenuPreferencesDto>>;
