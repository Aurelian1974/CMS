namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Valorile coloanei Stage din Dashboard_GetPatientFlow. Sincron cu FLOW_STAGES din
/// client/src/features/dashboard/components/widgets/patientFlow.ts.
/// </summary>
public static class DashboardFlowStages
{
    public const string ToConfirm      = "TO_CONFIRM";
    public const string Waiting        = "WAITING";
    public const string InConsultation = "IN_CONSULTATION";
    public const string ToPay          = "TO_PAY";
    public const string Done           = "DONE";
    public const string Cancelled      = "CANCELLED";
}
