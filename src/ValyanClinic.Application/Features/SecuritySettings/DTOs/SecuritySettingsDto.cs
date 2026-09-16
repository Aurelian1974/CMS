namespace ValyanClinic.Application.Features.SecuritySettings.DTOs;

/// <summary>
/// Setarile globale de securitate, administrabile din aplicatie.
///
/// Valorile sunt intotdeauna trecute prin <see cref="SecuritySettingsLimits.Sanitize"/>
/// inainte de a fi folosite: pragurile minime sunt garantate in cod, nu doar in
/// formularul de administrare sau in stored procedure.
/// </summary>
public sealed record SecuritySettingsDto
{
    // ===== Politica de parole (consumata incepand cu Etapa 2) =====
    public int PasswordMinLength { get; init; } = 12;
    public int PasswordMaxLength { get; init; } = 100;
    public int PasswordMinDigits { get; init; }
    public int PasswordMinSpecial { get; init; }
    public int PasswordMinUppercase { get; init; }
    public int PasswordMinLowercase { get; init; }

    /// <summary>Lista de parole frecvente. Nu poate fi dezactivata.</summary>
    public bool PasswordBlocklistEnabled { get; init; } = true;

    /// <summary>Interzice parola identica cu emailul, username-ul sau numele contului.</summary>
    public bool PasswordForbidIdentityValues { get; init; } = true;

    /// <summary>Cate parole anterioare nu pot fi reutilizate. 0 = fara istoric.</summary>
    public int PasswordHistoryCount { get; init; }

    /// <summary>Dupa cate zile expira parola. 0 = fara expirare.</summary>
    public int PasswordExpiryDays { get; init; }

    // ===== Blocarea contului =====
    public int MaxFailedLoginAttempts { get; init; } = 5;
    public int LockoutMinutes { get; init; } = 15;

    // ===== Retentie =====
    public int SecurityEventRetentionDays { get; init; } = 730;
    public int RefreshTokenRetentionDays { get; init; } = 30;

    public DateTime? UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
}

/// <summary>Setarile de sesiune ale unui rol.</summary>
public sealed record RoleSecuritySettingsDto
{
    public Guid RoleId { get; init; }
    public string RoleCode { get; init; } = string.Empty;
    public string RoleName { get; init; } = string.Empty;

    /// <summary>Fereastra de inactivitate dupa care sesiunea expira. Consumata din Etapa 3.</summary>
    public int IdleTimeoutMinutes { get; init; } = 30;

    /// <summary>Cat timp poate fi reluata sesiunea fara reautentificare.</summary>
    public int RefreshTokenDays { get; init; } = 7;
}
