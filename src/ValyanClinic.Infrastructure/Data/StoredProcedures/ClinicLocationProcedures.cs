namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea ClinicLocation (locații fizice / puncte de lucru).</summary>
public static class ClinicLocationProcedures
{
    public const string GetByClinic = "dbo.ClinicLocation_GetByClinic";
    public const string GetById     = "dbo.ClinicLocation_GetById";
    public const string Create      = "dbo.ClinicLocation_Create";
    public const string Update      = "dbo.ClinicLocation_Update";
    public const string Delete      = "dbo.ClinicLocation_Delete";
}
