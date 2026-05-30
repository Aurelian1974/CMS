namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru buletine de analize medicale.</summary>
public static class AnalysesResultProcedures
{
    public const string Create               = "dbo.AnalysesResult_Create";
    public const string Update               = "dbo.AnalysesResult_Update";
    public const string Delete               = "dbo.AnalysesResult_Delete";
    public const string GetById              = "dbo.AnalysesResult_GetById";
    public const string GetByConsultation    = "dbo.AnalysesResult_GetByConsultation";
    public const string GetByPatient         = "dbo.AnalysesResult_GetByPatient";
}
