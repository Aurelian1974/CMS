using Microsoft.AspNetCore.Http;
using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Extrage IP-ul si user agent-ul din cererea HTTP curenta.
/// Returneaza null in afara unei cereri (job-uri background, teste).
/// </summary>
public sealed class RequestContext(IHttpContextAccessor accessor) : IRequestContext
{
    public string? IpAddress =>
        accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public string? UserAgent =>
        accessor.HttpContext?.Request.Headers.UserAgent.ToString() is { Length: > 0 } ua
            ? ua
            : null;
}
