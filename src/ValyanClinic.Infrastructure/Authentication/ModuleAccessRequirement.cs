using Microsoft.AspNetCore.Authorization;
using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>Requirement ASP.NET Core pentru verificarea accesului pe modul.</summary>
public sealed class ModuleAccessRequirement(string module, AccessLevel minimumLevel)
    : IAuthorizationRequirement
{
    public string Module { get; } = module;
    public AccessLevel MinimumLevel { get; } = minimumLevel;
}
