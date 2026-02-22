namespace ValyanClinic.Application.Common.Models;

/// <summary>
/// Wrapper consistent pentru toate response-urile API.
/// </summary>
public sealed record ApiResponse<T>(
    bool Success,
    T? Data,
    string? Message,
    IDictionary<string, string[]>? Errors);
