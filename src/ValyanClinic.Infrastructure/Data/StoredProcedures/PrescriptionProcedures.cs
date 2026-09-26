namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Prescription.</summary>
public static class PrescriptionProcedures
{
    public const string GetById                  = "dbo.Prescription_GetById";
    public const string GetPaged                 = "dbo.Prescription_GetPaged";
    public const string GetByConsultation        = "dbo.Prescription_GetByConsultation";
    public const string GetLookups               = "dbo.Prescription_GetLookups";
    public const string CreateFromItems          = "dbo.Prescription_CreateFromItems";
    public const string GenerateFromConsultation = "dbo.Prescription_GenerateFromConsultation";
    public const string Update                   = "dbo.Prescription_Update";
    public const string Issue                    = "dbo.Prescription_Issue";
    public const string Cancel                   = "dbo.Prescription_Cancel";
    public const string Delete                   = "dbo.Prescription_Delete";
    public const string SetTransmission          = "dbo.Prescription_SetTransmission";

    public const string ItemTableType            = "dbo.PrescriptionItemTableType";
}
