namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru investigații paraclinice.</summary>
public static class InvestigationProcedures
{
    public const string Create             = "dbo.Investigation_Create";
    public const string Update             = "dbo.Investigation_Update";
    public const string Delete             = "dbo.Investigation_Delete";
    public const string GetById            = "dbo.Investigation_GetById";
    public const string GetByConsultation  = "dbo.Investigation_GetByConsultation";
    public const string GetByPatient       = "dbo.Investigation_GetByPatient";
    public const string GetTrending        = "dbo.Investigation_GetTrending";

    public const string TypeGetAll         = "dbo.InvestigationType_GetAll";
    public const string TypeGetBySpecialty = "dbo.InvestigationType_GetBySpecialty";
}

/// <summary>Stored procedures pentru documente atașate.</summary>
public static class DocumentProcedures
{
    public const string Create  = "dbo.Document_Create";
    public const string GetById = "dbo.Document_GetById";
}
