using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;

namespace ValyanClinic.Application.Features.SecuritySettings.Queries.GetSecuritySettings;

/// <summary>Tot ce are nevoie ecranul de administrare, intr-un singur apel.</summary>
public sealed record GetSecuritySettingsQuery : IRequest<Result<SecuritySettingsViewDto>>;
