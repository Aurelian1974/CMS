namespace ValyanClinic.Application.Common.Constants;

/// <summary>Codurile statusurilor consultației (ConsultationStatuses.Code).</summary>
public static class ConsultationStatusCodes
{
    public const string InProgress = "INLUCRU";
    public const string Completed  = "FINALIZATA";
    public const string Billed     = "FACTURATA";
    public const string Locked     = "BLOCATA";
}
