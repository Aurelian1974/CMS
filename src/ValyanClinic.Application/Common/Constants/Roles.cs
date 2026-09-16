namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Codurile rolurilor, identice cu valorile din coloana Roles.Code din baza de date
/// si cu claim-ul de rol pus in JWT de LoginCommandHandler (care foloseste RoleCode).
///
/// Valorile sunt lowercase intentionat. Compararea valorii unui claim in
/// ClaimsIdentity.HasClaim — deci si in ClaimsPrincipal.IsInRole si in politicile
/// RequireRole — este ordinala si case-sensitive, asa ca o nepotrivire de forma
/// produce un 403 tacut, fara niciun mesaj care sa arate cauza.
/// </summary>
public static class Roles
{
    public const string Admin         = "admin";
    public const string Doctor        = "doctor";
    public const string Nurse         = "nurse";
    public const string Receptionist  = "receptionist";
    public const string ClinicManager = "clinic_manager";
}
