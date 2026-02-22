namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Consultation.</summary>
public static class ConsultationProcedures
{
    public const string GetById      = "dbo.Consultation_GetById";
    public const string GetPaged     = "dbo.Consultation_GetPaged";
    public const string GetByPatient = "dbo.Consultation_GetByPatient";
    public const string Create       = "dbo.Consultation_Create";
    public const string Update       = "dbo.Consultation_Update";
    public const string Delete       = "dbo.Consultation_Delete";
}
