namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class ConsultationMedicationProcedures
{
    public const string GetByConsultation = "dbo.ConsultationMedication_GetByConsultation";
    public const string Create            = "dbo.ConsultationMedication_Create";
    public const string Update            = "dbo.ConsultationMedication_Update";
    public const string Delete            = "dbo.ConsultationMedication_Delete";
    public const string SearchDrugs       = "dbo.Cnas_Drug_SearchForPrescription";
}
