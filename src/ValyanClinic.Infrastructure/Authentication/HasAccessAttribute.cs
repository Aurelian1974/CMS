using Microsoft.AspNetCore.Authorization;
using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Atribut de autorizare bazat pe modul + nivel de acces.
/// Folosire: [HasAccess("patients", AccessLevel.Write)]
/// Oricare dintre mai multe module: [HasAccess(AccessLevel.Read, "clinic", "appointments")]
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class HasAccessAttribute : AuthorizeAttribute
{
    /// <summary>Codurile modulelor (ex: "patients"); e suficient accesul pe unul dintre ele.</summary>
    public IReadOnlyList<string> Modules { get; }

    /// <summary>Nivelul minim de acces necesar.</summary>
    public AccessLevel MinimumLevel { get; }

    public HasAccessAttribute(string module, AccessLevel minimumLevel)
        : this(minimumLevel, module)
    {
    }

    public HasAccessAttribute(AccessLevel minimumLevel, params string[] modules)
        : base(policy: $"Module:{string.Join(',', modules)}:{(int)minimumLevel}")
    {
        Modules = modules;
        MinimumLevel = minimumLevel;
    }
}
