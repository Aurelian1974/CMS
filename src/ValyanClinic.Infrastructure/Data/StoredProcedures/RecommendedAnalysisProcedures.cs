namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class RecommendedAnalysisProcedures
{
    public const string Create             = "dbo.RecommendedAnalysis_Create";
    public const string Update             = "dbo.RecommendedAnalysis_Update";
    public const string Delete             = "dbo.RecommendedAnalysis_Delete";
    public const string GetByConsultation  = "dbo.RecommendedAnalysis_GetByConsultation";
}

public static class AnalysisProcedures
{
    public const string Search = "dbo.Analysis_Search";
}
