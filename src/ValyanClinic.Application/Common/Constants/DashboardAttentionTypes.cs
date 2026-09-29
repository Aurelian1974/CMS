namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Valorile coloanei Type din result set-ul „necesită atenție” al Dashboard_GetPatientFlow.
/// Sincron cu ATTENTION_TYPES din client/src/features/dashboard/components/widgets/patientFlow.ts.
/// </summary>
public static class DashboardAttentionTypes
{
    public const string StaleConsultation     = "STALE_CONSULTATION";
    public const string UnresolvedAppointment = "UNRESOLVED_APPOINTMENT";
    public const string LateAppointment       = "LATE_APPOINTMENT";
}
