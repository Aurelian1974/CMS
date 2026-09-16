namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Tipurile de evenimente inregistrate in SecurityEvents.
/// Valorile ajung ca atare in baza de date, deci nu se redenumesc fara migrare.
/// </summary>
public static class SecurityEventTypes
{
    public const string LoginSucceeded     = "LoginSucceeded";
    public const string LoginFailed        = "LoginFailed";
    /// <summary>Contul era deja blocat la momentul incercarii.</summary>
    public const string AccountLocked      = "AccountLocked";
    /// <summary>Incercare de autentificare pe un cont dezactivat.</summary>
    public const string AccountInactive    = "AccountInactive";
    public const string Logout             = "Logout";
    public const string TokenRefreshed     = "TokenRefreshed";
    /// <summary>Refresh token revocat, prezentat din nou — semnal de furt.</summary>
    public const string TokenReuseDetected = "TokenReuseDetected";
    public const string PasswordChanged    = "PasswordChanged";
    public const string PasswordReset      = "PasswordReset";
}
