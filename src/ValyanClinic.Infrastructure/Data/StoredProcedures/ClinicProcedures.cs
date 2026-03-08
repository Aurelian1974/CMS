namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Clinic (societate comercială) și sub-entitățile sale.</summary>
public static class ClinicProcedures
{
    public const string GetById = "dbo.Clinic_GetById";
    public const string GetAll  = "dbo.Clinic_GetAll";
    public const string Create  = "dbo.Clinic_Create";
    public const string Update  = "dbo.Clinic_Update";

    // ── Conturi bancare ──────────────────────────────────────────────────────
    public const string BankAccountGetByClinic = "dbo.ClinicBankAccount_GetByClinic";
    public const string BankAccountCreate      = "dbo.ClinicBankAccount_Create";
    public const string BankAccountUpdate      = "dbo.ClinicBankAccount_Update";
    public const string BankAccountDelete      = "dbo.ClinicBankAccount_Delete";

    // ── Adrese ───────────────────────────────────────────────────────────────
    public const string AddressGetByClinic = "dbo.ClinicAddress_GetByClinic";
    public const string AddressCreate      = "dbo.ClinicAddress_Create";
    public const string AddressUpdate      = "dbo.ClinicAddress_Update";
    public const string AddressDelete      = "dbo.ClinicAddress_Delete";

    // ── Date de contact ──────────────────────────────────────────────────────
    public const string ContactGetByClinic = "dbo.ClinicContact_GetByClinic";
    public const string ContactCreate      = "dbo.ClinicContact_Create";
    public const string ContactUpdate      = "dbo.ClinicContact_Update";
    public const string ContactDelete      = "dbo.ClinicContact_Delete";
}
