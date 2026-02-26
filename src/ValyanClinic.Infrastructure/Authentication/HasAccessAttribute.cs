using Microsoft.AspNetCore.Authorization;
using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Atribut de autorizare bazat pe modul + nivel de acces.
/// Folosire: [HasAccess("patients", AccessLevel.Write)]
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class HasAccessAttribute : AuthorizeAttribute
{
    /// <summary>Codul modulului (ex: "patients", "consultations").</summary>
    public string Module { get; }

    /// <summary>Nivelul minim de acces necesar.</summary>
    public AccessLevel MinimumLevel { get; }

    public HasAccessAttribute(string module, AccessLevel minimumLevel)
        : base(policy: $"Module:{module}:{(int)minimumLevel}")
    {
        Module = module;
        MinimumLevel = minimumLevel;
    }
}
