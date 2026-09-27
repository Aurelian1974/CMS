namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class DashboardProcedures
{
    public const string GetClinicalKpis      = "dbo.Dashboard_GetClinicalKpis";
    public const string GetAgenda            = "dbo.Dashboard_GetAgenda";
    public const string GetFinancialKpis     = "dbo.Dashboard_GetFinancialKpis";
    public const string GetTrends            = "dbo.Dashboard_GetTrends";
    public const string GetOperationalHealth = "dbo.Dashboard_GetOperationalHealth";
}
