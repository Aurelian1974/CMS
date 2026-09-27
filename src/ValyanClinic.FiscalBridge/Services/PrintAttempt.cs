using ValyanClinic.FiscalBridge.Printing;

namespace ValyanClinic.FiscalBridge.Services;

/// <summary>Răspunsul serviciului de tipărire: fie un rezultat, fie o respingere a cererii (nimic trimis la aparat).</summary>
public sealed record PrintAttempt(PrintResult? Result, string? RejectionReason, bool IsConflict)
{
    public static PrintAttempt Done(PrintResult result) => new(result, null, false);
    public static PrintAttempt Invalid(string reason) => new(null, reason, false);
    public static PrintAttempt Conflict(string reason) => new(null, reason, true);
}
