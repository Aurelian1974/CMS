namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru codurile CAEN ale unei clinici.</summary>
public static class ClinicCaenCodeProcedures
{
    public const string GetByClinicId = "dbo.ClinicCaenCode_GetByClinicId";
    public const string Sync          = "dbo.ClinicCaenCode_Sync";
}
