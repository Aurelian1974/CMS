namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class ConsultationServiceProcedures
{
    public const string GetByConsultation = "dbo.ConsultationService_GetByConsultation";
    public const string Add               = "dbo.ConsultationService_Add";
    public const string UpdateQuantity    = "dbo.ConsultationService_UpdateQuantity";
    public const string Delete            = "dbo.ConsultationService_Delete";
}
