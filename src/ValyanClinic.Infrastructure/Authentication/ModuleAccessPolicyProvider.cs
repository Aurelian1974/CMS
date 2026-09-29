using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Policy provider dinamic care creează politici "Module:{code}:{level}" on-the-fly.
/// Elimină necesitatea de a înregistra manual fiecare combinație modul+nivel.
/// </summary>
public sealed class ModuleAccessPolicyProvider : IAuthorizationPolicyProvider
{
    private const string PolicyPrefix = "Module:";
    private readonly DefaultAuthorizationPolicyProvider _fallback;

    public ModuleAccessPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _fallback = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Pattern: "Module:{moduleCode}[,{moduleCode}...]:{accessLevel}" — mai multe module = oricare dintre ele
        if (policyName.StartsWith(PolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var parts = policyName[PolicyPrefix.Length..].Split(':');
            var modules = parts.Length == 2
                ? parts[0].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                : [];
            if (modules.Length > 0 && int.TryParse(parts[1], out var level))
            {
                var policy = new AuthorizationPolicyBuilder()
                    .AddRequirements(new ModuleAccessRequirement(modules, (AccessLevel)level))
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(policy);
            }
        }

        return _fallback.GetPolicyAsync(policyName);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
        => _fallback.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
        => _fallback.GetFallbackPolicyAsync();
}
