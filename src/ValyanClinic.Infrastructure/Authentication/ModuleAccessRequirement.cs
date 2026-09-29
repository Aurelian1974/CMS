using Microsoft.AspNetCore.Authorization;
using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>Requirement ASP.NET Core pentru verificarea accesului pe modul; cu mai multe module e suficient unul.</summary>
public sealed class ModuleAccessRequirement(IReadOnlyList<string> modules, AccessLevel minimumLevel)
    : IAuthorizationRequirement
{
    public ModuleAccessRequirement(string module, AccessLevel minimumLevel)
        : this([module], minimumLevel)
    {
    }

    public IReadOnlyList<string> Modules { get; } = modules;
    public AccessLevel MinimumLevel { get; } = minimumLevel;
}
